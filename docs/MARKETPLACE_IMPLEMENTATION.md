# 🛍️ AnythingLLM Marketplace Implementation Guide

## Overview
This guide provides comprehensive documentation for implementing a paid marketplace system for agent skills in AnythingLLM, leveraging the existing CommunityHub infrastructure.

## Table of Contents
1. [Architecture Overview](#architecture-overview)
2. [Prerequisites](#prerequisites)
3. [Phase 1: Database Setup](#phase-1-database-setup)
4. [Phase 2: Payment Processing](#phase-2-payment-processing)
5. [Phase 3: Backend API](#phase-3-backend-api)
6. [Phase 4: License Validation](#phase-4-license-validation)
7. [Phase 5: Frontend UI](#phase-5-frontend-ui)
8. [Phase 6: Testing](#phase-6-testing)
9. [Phase 7: Deployment](#phase-7-deployment)
10. [API Reference](#api-reference)
11. [Troubleshooting](#troubleshooting)

## Architecture Overview

```
┌─────────────────┐     ┌──────────────┐     ┌─────────────┐
│   Frontend UI   │────▶│  Backend API │────▶│  Stripe API │
└─────────────────┘     └──────────────┘     └─────────────┘
         │                      │                     │
         ▼                      ▼                     ▼
┌─────────────────┐     ┌──────────────┐     ┌─────────────┐
│  CommunityHub   │     │   Database   │     │   Payment   │
│      Pages      │     │   (SQLite)   │     │  Processing │
└─────────────────┘     └──────────────┘     └─────────────┘
         │                      │
         ▼                      ▼
┌─────────────────┐     ┌──────────────┐
│ ImportedPlugin  │────▶│   License    │
│     System      │     │  Validation  │
└─────────────────┘     └──────────────┘
```

### Key Components
- **Payment Processing**: Stripe integration for secure payments
- **License Management**: Generation, validation, and activation tracking
- **Database Models**: Purchase records, activations, and analytics
- **Frontend Components**: Purchase modals, payment forms, license display
- **API Endpoints**: Payment intents, webhooks, license validation

## Prerequisites

### Required Services
- Stripe account (for payment processing)
- Node.js 18+ and Yarn
- SQLite or PostgreSQL database
- Environment variables configured

### Required API Keys
```env
# Add to /server/.env
STRIPE_SECRET_KEY=sk_test_...  # From Stripe Dashboard
STRIPE_WEBHOOK_SECRET=whsec_... # After webhook setup
```

```env
# Add to /frontend/.env
REACT_APP_STRIPE_PUBLIC_KEY=pk_test_... # From Stripe Dashboard
```

## Phase 1: Database Setup

### Step 1.1: Create Migration Files

Create directory structure:
```bash
mkdir -p server/prisma/migrations/add_marketplace_monetization
```

Create migration file: `/server/prisma/migrations/add_marketplace_monetization/migration.sql`

```sql
-- Marketplace Purchases Table
CREATE TABLE "marketplace_purchases" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" INTEGER NOT NULL,
    "hubItemId" TEXT NOT NULL,
    "licenseKey" TEXT NOT NULL,
    "purchasePrice" REAL NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "paymentProvider" TEXT NOT NULL,
    "paymentIntentId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "expiresAt" DATETIME,
    "downloadCount" INTEGER NOT NULL DEFAULT 0,
    "maxDownloads" INTEGER DEFAULT 5,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "marketplace_purchases_userId_fkey" 
        FOREIGN KEY ("userId") REFERENCES "users" ("id") 
        ON DELETE RESTRICT ON UPDATE CASCADE
);

-- Marketplace Activations Table
CREATE TABLE "marketplace_activations" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "purchaseId" TEXT NOT NULL,
    "workspaceId" INTEGER NOT NULL,
    "machineId" TEXT NOT NULL,
    "activatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastCheckedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    CONSTRAINT "marketplace_activations_purchaseId_fkey" 
        FOREIGN KEY ("purchaseId") REFERENCES "marketplace_purchases" ("id") 
        ON DELETE RESTRICT ON UPDATE CASCADE
);

-- Create Indexes for Performance
CREATE UNIQUE INDEX "marketplace_purchases_licenseKey_key" 
    ON "marketplace_purchases"("licenseKey");
CREATE UNIQUE INDEX "marketplace_purchases_paymentIntentId_key" 
    ON "marketplace_purchases"("paymentIntentId");
CREATE INDEX "marketplace_purchases_userId_idx" 
    ON "marketplace_purchases"("userId");
CREATE INDEX "marketplace_purchases_hubItemId_idx" 
    ON "marketplace_purchases"("hubItemId");
CREATE UNIQUE INDEX "marketplace_activations_unique" 
    ON "marketplace_activations"("purchaseId", "workspaceId", "machineId");
```

### Step 1.2: Update Prisma Schema

Add to `/server/prisma/schema.prisma`:

```prisma
model marketplace_purchases {
  id                String   @id @default(uuid())
  userId            Int
  hubItemId         String
  licenseKey        String   @unique
  purchasePrice     Float
  currency          String   @default("USD")
  paymentProvider   String
  paymentIntentId   String   @unique
  status            String   @default("pending")
  expiresAt         DateTime?
  downloadCount     Int      @default(0)
  maxDownloads      Int?     @default(5)
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt
  
  user              users    @relation(fields: [userId], references: [id])
  activations       marketplace_activations[]
  
  @@index([userId])
  @@index([hubItemId])
}

model marketplace_activations {
  id            String   @id @default(uuid())
  purchaseId    String
  workspaceId   Int
  machineId     String
  activatedAt   DateTime @default(now())
  lastCheckedAt DateTime @default(now())
  isActive      Boolean  @default(true)
  
  purchase      marketplace_purchases @relation(fields: [purchaseId], references: [id])
  
  @@unique([purchaseId, workspaceId, machineId])
  @@index([purchaseId])
}
```

### Step 1.3: Run Migration

```bash
cd server
npx prisma migrate dev --name add_marketplace_monetization
npx prisma generate
```

## Phase 2: Payment Processing

### Step 2.1: Install Dependencies

```bash
cd server
yarn add stripe uuid
```

### Step 2.2: Create Payment Processor Module

Create file: `/server/utils/payments/index.js`

```javascript
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const { v4: uuidv4 } = require('uuid');
const prisma = require('../prisma');

class PaymentProcessor {
  /**
   * Create a payment intent for purchasing an item
   * @param {number} userId - User ID making the purchase
   * @param {string} hubItemId - Community Hub item ID
   * @param {object} itemDetails - Item details including price
   * @returns {object} Payment intent details or status
   */
  static async createPaymentIntent(userId, hubItemId, itemDetails) {
    const price = itemDetails.price || 0;
    
    // Handle free items
    if (price === 0) {
      return { free: true };
    }
    
    // Check for existing purchase
    const existingPurchase = await prisma.marketplace_purchases.findFirst({
      where: {
        userId,
        hubItemId,
        status: 'active'
      }
    });
    
    if (existingPurchase) {
      return { 
        alreadyPurchased: true, 
        licenseKey: existingPurchase.licenseKey 
      };
    }
    
    // Create Stripe payment intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(price * 100), // Convert to cents
      currency: 'usd',
      metadata: {
        userId: userId.toString(),
        hubItemId,
        itemName: itemDetails.name
      }
    });
    
    // Generate unique license key
    const licenseKey = this.generateLicenseKey();
    
    // Create pending purchase record
    await prisma.marketplace_purchases.create({
      data: {
        id: uuidv4(),
        userId,
        hubItemId,
        licenseKey,
        purchasePrice: price,
        currency: 'USD',
        paymentProvider: 'stripe',
        paymentIntentId: paymentIntent.id,
        status: 'pending'
      }
    });
    
    return {
      clientSecret: paymentIntent.client_secret,
      licenseKey
    };
  }
  
  /**
   * Generate a unique license key
   * @returns {string} License key in format ALLM-XXXX-XXXX-XXXX-XXXX
   */
  static generateLicenseKey() {
    const segments = [];
    for (let i = 0; i < 4; i++) {
      segments.push(
        Math.random().toString(36).substring(2, 6).toUpperCase()
      );
    }
    return `ALLM-${segments.join('-')}`;
  }
  
  /**
   * Confirm payment and activate license
   * @param {string} paymentIntentId - Stripe payment intent ID
   * @returns {object} Updated purchase record
   */
  static async confirmPayment(paymentIntentId) {
    const purchase = await prisma.marketplace_purchases.update({
      where: { paymentIntentId },
      data: { 
        status: 'active',
        updatedAt: new Date()
      }
    });
    
    // TODO: Notify hub API for revenue sharing
    // await this.notifyHubOfPurchase(purchase);
    
    return purchase;
  }
  
  /**
   * Validate license for an item
   * @param {string} hubItemId - Community Hub item ID
   * @param {number} userId - User ID
   * @param {number} workspaceId - Workspace ID
   * @returns {object} Validation result
   */
  static async validateLicense(hubItemId, userId, workspaceId) {
    const purchase = await prisma.marketplace_purchases.findFirst({
      where: {
        hubItemId,
        userId,
        status: 'active'
      }
    });
    
    if (!purchase) {
      return { valid: false, reason: 'No valid license found' };
    }
    
    // Check expiration
    if (purchase.expiresAt && purchase.expiresAt < new Date()) {
      return { valid: false, reason: 'License expired' };
    }
    
    // Generate machine ID
    const os = require('os');
    const crypto = require('crypto');
    const machineId = crypto
      .createHash('md5')
      .update(os.hostname() + os.platform() + os.arch())
      .digest('hex');
    
    // Check or create activation
    const activation = await prisma.marketplace_activations.findFirst({
      where: {
        purchaseId: purchase.id,
        workspaceId,
        machineId
      }
    });
    
    if (!activation) {
      // Check activation limit
      const activationCount = await prisma.marketplace_activations.count({
        where: { purchaseId: purchase.id }
      });
      
      if (activationCount >= 3) {
        return { 
          valid: false, 
          reason: 'Activation limit reached (max 3 devices)' 
        };
      }
      
      // Create new activation
      await prisma.marketplace_activations.create({
        data: {
          id: uuidv4(),
          purchaseId: purchase.id,
          workspaceId,
          machineId
        }
      });
    } else {
      // Update last checked timestamp
      await prisma.marketplace_activations.update({
        where: { id: activation.id },
        data: { lastCheckedAt: new Date() }
      });
    }
    
    return { valid: true, licenseKey: purchase.licenseKey };
  }
}

module.exports = { PaymentProcessor };
```

## Phase 3: Backend API

### Step 3.1: Create Marketplace Endpoints

Create file: `/server/endpoints/marketplace.js`

```javascript
const express = require('express');
const { validatedRequest } = require("../utils/middleware/validatedRequest");
const { flexUserRoleValid, ROLES } = require("../utils/middleware/multiUserProtected");
const { PaymentProcessor } = require("../utils/payments");
const { CommunityHub } = require("../models/communityHub");
const { reqBody } = require("../utils/http");
const { EventLogs } = require("../models/eventLogs");
const prisma = require("../utils/prisma");

function marketplaceEndpoints(app) {
  if (!app) return;
  
  /**
   * POST /api/marketplace/item/:itemId/payment-intent
   * Create a payment intent for purchasing an item
   */
  app.post(
    "/api/marketplace/item/:itemId/payment-intent",
    [validatedRequest, flexUserRoleValid([ROLES.all])],
    async (request, response) => {
      try {
        const { itemId } = request.params;
        const userId = response.locals.user?.id;
        
        if (!userId) {
          return response.status(401).json({ 
            success: false, 
            error: "User authentication required" 
          });
        }
        
        // Fetch item details from Community Hub
        const { item, error } = await CommunityHub.getItemDetails(itemId);
        if (error) {
          throw new Error(error);
        }
        
        // Create payment intent
        const result = await PaymentProcessor.createPaymentIntent(
          userId,
          itemId,
          item
        );
        
        // Log event
        await EventLogs.logEvent(
          "marketplace_payment_intent_created",
          { itemId, userId },
          userId
        );
        
        response.json({ success: true, ...result });
      } catch (error) {
        console.error("Payment intent error:", error);
        response.status(500).json({ 
          success: false, 
          error: error.message 
        });
      }
    }
  );
  
  /**
   * POST /api/marketplace/webhook/stripe
   * Stripe webhook for payment confirmation
   */
  app.post(
    "/api/marketplace/webhook/stripe",
    express.raw({ type: 'application/json' }),
    async (request, response) => {
      const sig = request.headers['stripe-signature'];
      
      if (!sig) {
        return response.status(400).send('No signature provided');
      }
      
      try {
        const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
        const event = stripe.webhooks.constructEvent(
          request.body,
          sig,
          process.env.STRIPE_WEBHOOK_SECRET
        );
        
        // Handle the event
        switch (event.type) {
          case 'payment_intent.succeeded':
            const paymentIntent = event.data.object;
            await PaymentProcessor.confirmPayment(paymentIntent.id);
            
            // Log successful purchase
            await EventLogs.logEvent(
              "marketplace_purchase_completed",
              { 
                paymentIntentId: paymentIntent.id,
                amount: paymentIntent.amount / 100,
                currency: paymentIntent.currency
              }
            );
            break;
            
          case 'payment_intent.payment_failed':
            // Handle failed payment
            const failedIntent = event.data.object;
            await prisma.marketplace_purchases.update({
              where: { paymentIntentId: failedIntent.id },
              data: { status: 'failed' }
            });
            break;
            
          default:
            console.log(`Unhandled event type ${event.type}`);
        }
        
        response.json({ received: true });
      } catch (err) {
        console.error("Webhook error:", err);
        response.status(400).send(`Webhook Error: ${err.message}`);
      }
    }
  );
  
  /**
   * GET /api/marketplace/purchases
   * Get user's marketplace purchases
   */
  app.get(
    "/api/marketplace/purchases",
    [validatedRequest, flexUserRoleValid([ROLES.all])],
    async (request, response) => {
      try {
        const userId = response.locals.user?.id;
        
        if (!userId) {
          return response.status(401).json({ 
            success: false, 
            error: "User authentication required" 
          });
        }
        
        const purchases = await prisma.marketplace_purchases.findMany({
          where: { 
            userId, 
            status: 'active' 
          },
          select: {
            hubItemId: true,
            licenseKey: true,
            purchasePrice: true,
            currency: true,
            createdAt: true,
            expiresAt: true,
            activations: {
              select: {
                workspaceId: true,
                machineId: true,
                activatedAt: true,
                lastCheckedAt: true
              }
            }
          },
          orderBy: {
            createdAt: 'desc'
          }
        });
        
        response.json({ success: true, purchases });
      } catch (error) {
        console.error("Get purchases error:", error);
        response.status(500).json({ 
          success: false, 
          error: error.message 
        });
      }
    }
  );
  
  /**
   * POST /api/marketplace/item/:itemId/validate
   * Validate license for an item
   */
  app.post(
    "/api/marketplace/item/:itemId/validate",
    [validatedRequest],
    async (request, response) => {
      try {
        const { itemId } = request.params;
        const { workspaceId } = reqBody(request);
        const userId = response.locals.user?.id;
        
        if (!userId || !workspaceId) {
          return response.status(400).json({ 
            success: false, 
            error: "User ID and Workspace ID required" 
          });
        }
        
        const result = await PaymentProcessor.validateLicense(
          itemId,
          userId,
          workspaceId
        );
        
        response.json({ success: true, ...result });
      } catch (error) {
        console.error("License validation error:", error);
        response.status(500).json({ 
          success: false, 
          error: error.message 
        });
      }
    }
  );
}

module.exports = { marketplaceEndpoints };
```

### Step 3.2: Register Endpoints

Update `/server/index.js`:

```javascript
// Add after other endpoint imports
const { marketplaceEndpoints } = require('./endpoints/marketplace');

// Add after other endpoint registrations (before the 404 handler)
marketplaceEndpoints(app);
```

## Phase 4: License Validation

### Step 4.1: Extend ImportedPlugin System

Update `/server/utils/agents/imported.js`:

Add import at top:
```javascript
const { PaymentProcessor } = require('../payments');
```

Add license validation to plugin method:
```javascript
plugin(runtimeArgs = {}) {
  const customFunctions = this.handler.runtime;
  const hubId = this.config.hubId;
  const config = this.config;
  
  return {
    runtimeArgs,
    name: this.name,
    config: this.config,
    setup: async function(aibitat) {
      // Check if this plugin requires a license
      if (config.price && config.price > 0) {
        const userId = aibitat?.handlerProps?.userId;
        const workspaceId = aibitat?.handlerProps?.workspaceId;
        
        if (!userId || !workspaceId) {
          aibitat.introspect(
            `⚠️ Unable to validate license: User or workspace information missing`
          );
          return;
        }
        
        const license = await PaymentProcessor.validateLicense(
          hubId,
          userId,
          workspaceId
        );
        
        if (!license.valid) {
          aibitat.introspect(
            `⚠️ License validation failed for ${config.name}: ${license.reason}`
          );
          
          // Provide purchase instructions
          aibitat.reply(
            `This agent skill requires a valid license. ` +
            `Please purchase it from the Community Hub marketplace.\n\n` +
            `Reason: ${license.reason}`
          );
          return;
        }
        
        aibitat.introspect(
          `✅ License validated successfully for ${config.name}`
        );
      }
      
      // Continue with original setup
      aibitat.function({
        super: aibitat,
        name: this.name,
        config: config,
        runtimeArgs: this.runtimeArgs,
        description: config.description,
        logger: aibitat?.handlerProps?.log || console.log,
        introspect: aibitat?.introspect || console.log,
        runtime: "docker",
        webScraper: sharedWebScraper,
        examples: config.examples ?? [],
        parameters: {
          $schema: "http://json-schema.org/draft-07/schema#",
          type: "object",
          properties: config.entrypoint.params ?? {},
          additionalProperties: false,
        },
        ...customFunctions,
      });
    }
  };
}
```

### Step 4.2: Extend CommunityHub Model

Update `/server/models/communityHub.js`:

Add these methods to the CommunityHub object:
```javascript
/**
 * Get item details including pricing information
 * @param {string} itemId - The hub item ID
 * @returns {object} Item details with pricing
 */
async getItemDetails(itemId) {
  try {
    const response = await fetch(`${this.apiBase}/items/${itemId}/details`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' }
    });
    
    if (!response.ok) {
      throw new Error(`Failed to fetch item details: ${response.statusText}`);
    }
    
    const item = await response.json();
    
    // Add default price if not set (for testing)
    if (typeof item.price === 'undefined') {
      item.price = 0; // Free by default
    }
    
    return { item, error: null };
  } catch (error) {
    console.error(`Error fetching item details for ${itemId}:`, error);
    return { 
      item: null, 
      error: error.message || 'Unknown error' 
    };
  }
},

/**
 * Get item with purchase status for a user
 * @param {string} itemId - The hub item ID
 * @param {number} userId - The user ID
 * @returns {object} Item with purchase status
 */
async getItemWithPurchaseStatus(itemId, userId) {
  const { item, error } = await this.getItemDetails(itemId);
  if (error) return { item: null, error };
  
  // Check if user has purchased this item
  if (item.price > 0 && userId) {
    const { PaymentProcessor } = require('../utils/payments');
    const license = await PaymentProcessor.validateLicense(
      itemId,
      userId,
      null // Workspace will be checked during execution
    );
    
    item.isPurchased = license.valid;
    item.licenseKey = license.valid ? license.licenseKey : null;
  }
  
  return { item, error: null };
}
```

## Phase 5: Frontend UI

### Step 5.1: Install Dependencies

```bash
cd frontend
yarn add @stripe/stripe-js @stripe/react-stripe-js
```

### Step 5.2: Create Purchase Modal Component

Create file: `/frontend/src/components/Modals/MarketplacePurchase/index.jsx`

```jsx
import React, { useState, useEffect } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { 
  Elements, 
  PaymentElement, 
  useStripe, 
  useElements 
} from '@stripe/react-stripe-js';
import { X } from 'react-feather';
import Marketplace from '@/models/marketplace';

// Initialize Stripe
const stripePromise = loadStripe(
  process.env.REACT_APP_STRIPE_PUBLIC_KEY || 'pk_test_xxx'
);

export default function MarketplacePurchaseModal({ 
  item, 
  onClose, 
  onSuccess 
}) {
  const [clientSecret, setClientSecret] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  useEffect(() => {
    async function initializePayment() {
      try {
        const result = await Marketplace.createPaymentIntent(item.id);
        
        if (result.free) {
          // Item is free, proceed directly
          onSuccess();
          return;
        }
        
        if (result.alreadyPurchased) {
          // User already owns this item
          onSuccess(result.licenseKey);
          return;
        }
        
        // Set up payment form
        setClientSecret(result.clientSecret);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    
    initializePayment();
  }, [item.id, onSuccess]);
  
  if (loading) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className="bg-theme-bg-secondary p-6 rounded-lg shadow-xl">
          <div className="flex items-center space-x-2">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-button"></div>
            <p className="text-theme-text-primary">Loading payment details...</p>
          </div>
        </div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className="bg-theme-bg-secondary p-6 rounded-lg shadow-xl max-w-md">
          <h3 className="text-lg font-semibold text-red-500 mb-2">
            Payment Error
          </h3>
          <p className="text-theme-text-secondary mb-4">{error}</p>
          <button 
            onClick={onClose}
            className="w-full bg-theme-bg-primary text-theme-text-primary py-2 rounded hover:bg-opacity-80 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    );
  }
  
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-theme-bg-secondary p-6 rounded-lg shadow-xl max-w-md w-full mx-4">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-theme-text-primary">
            Complete Purchase
          </h2>
          <button 
            onClick={onClose}
            className="text-theme-text-secondary hover:text-theme-text-primary transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>
        
        <div className="mb-6 p-4 bg-theme-bg-primary rounded-lg">
          <p className="text-sm text-theme-text-secondary mb-2">
            You're purchasing:
          </p>
          <h3 className="font-semibold text-theme-text-primary mb-1">
            {item.name}
          </h3>
          <p className="text-sm text-theme-text-secondary mb-3">
            {item.description}
          </p>
          <div className="flex justify-between items-center">
            <span className="text-sm text-theme-text-secondary">Price:</span>
            <span className="text-2xl font-bold text-primary-button">
              ${item.price}
            </span>
          </div>
        </div>
        
        {clientSecret && (
          <Elements 
            stripe={stripePromise} 
            options={{ 
              clientSecret,
              appearance: {
                theme: 'night',
                variables: {
                  colorPrimary: '#3b82f6',
                  colorBackground: '#1a1a1a',
                  colorText: '#ffffff',
                  colorDanger: '#ef4444',
                }
              }
            }}
          >
            <CheckoutForm 
              item={item} 
              onSuccess={onSuccess} 
              onClose={onClose}
            />
          </Elements>
        )}
        
        <div className="mt-4 pt-4 border-t border-theme-border">
          <p className="text-xs text-theme-text-secondary text-center">
            Payments are processed securely by Stripe. 
            Your payment information is never stored on our servers.
          </p>
        </div>
      </div>
    </div>
  );
}

function CheckoutForm({ item, onSuccess, onClose }) {
  const stripe = useStripe();
  const elements = useElements();
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!stripe || !elements) {
      return;
    }
    
    setIsProcessing(true);
    setErrorMessage(null);
    
    try {
      const { error, paymentIntent } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/settings/community-hub`,
        },
        redirect: 'if_required'
      });
      
      if (error) {
        setErrorMessage(error.message);
        setIsProcessing(false);
      } else if (paymentIntent && paymentIntent.status === 'succeeded') {
        // Payment successful
        await onSuccess();
      }
    } catch (err) {
      setErrorMessage('An unexpected error occurred.');
      setIsProcessing(false);
    }
  };
  
  return (
    <form onSubmit={handleSubmit}>
      <PaymentElement />
      
      {errorMessage && (
        <div className="mt-4 p-3 bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-400 rounded-lg">
          {errorMessage}
        </div>
      )}
      
      <div className="flex gap-3 mt-6">
        <button
          type="button"
          onClick={onClose}
          disabled={isProcessing}
          className="flex-1 bg-theme-bg-primary text-theme-text-primary py-2 rounded hover:bg-opacity-80 transition-colors disabled:opacity-50"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={!stripe || isProcessing}
          className="flex-1 bg-primary-button text-white py-2 rounded hover:bg-primary-button-hover transition-colors disabled:opacity-50"
        >
          {isProcessing ? 'Processing...' : `Pay $${item.price}`}
        </button>
      </div>
    </form>
  );
}
```

### Step 5.3: Create Marketplace API Model

Create file: `/frontend/src/models/marketplace.js`

```javascript
import { API_BASE } from '@/utils/constants';
import { baseHeaders } from '@/utils/request';

const Marketplace = {
  /**
   * Create a payment intent for purchasing an item
   * @param {string} itemId - The hub item ID
   * @returns {Promise<object>} Payment intent details
   */
  createPaymentIntent: async function(itemId) {
    return fetch(`${API_BASE}/marketplace/item/${itemId}/payment-intent`, {
      method: 'POST',
      headers: baseHeaders()
    })
    .then(res => res.json())
    .then(res => {
      if (!res.success) {
        throw new Error(res.error || 'Failed to create payment intent');
      }
      return res;
    });
  },
  
  /**
   * Get user's marketplace purchases
   * @returns {Promise<array>} List of purchases
   */
  getUserPurchases: async function() {
    return fetch(`${API_BASE}/marketplace/purchases`, {
      headers: baseHeaders()
    })
    .then(res => res.json())
    .then(res => {
      if (!res.success) {
        throw new Error(res.error || 'Failed to fetch purchases');
      }
      return res.purchases;
    });
  },
  
  /**
   * Validate license for an item in a workspace
   * @param {string} itemId - The hub item ID
   * @param {number} workspaceId - The workspace ID
   * @returns {Promise<object>} Validation result
   */
  validateLicense: async function(itemId, workspaceId) {
    return fetch(`${API_BASE}/marketplace/item/${itemId}/validate`, {
      method: 'POST',
      headers: baseHeaders(),
      body: JSON.stringify({ workspaceId })
    })
    .then(res => res.json())
    .then(res => {
      if (!res.success) {
        throw new Error(res.error || 'Failed to validate license');
      }
      return res;
    });
  }
};

export default Marketplace;
```

### Step 5.4: Update Hub Item Card

Update `/frontend/src/pages/GeneralSettings/CommunityHub/Trending/HubItems/HubItemCard.jsx`:

```jsx
import { useState, useEffect } from 'react';
import { ShoppingCart, Download, Check } from 'react-feather';
import MarketplacePurchaseModal from '@/components/Modals/MarketplacePurchase';
import Marketplace from '@/models/marketplace';
import paths from '@/utils/paths';

export default function HubItemCard({ item, type }) {
  const [showPurchase, setShowPurchase] = useState(false);
  const [isPurchased, setIsPurchased] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  useEffect(() => {
    // Check if user has already purchased this item
    async function checkPurchaseStatus() {
      if (item.price && item.price > 0) {
        try {
          const purchases = await Marketplace.getUserPurchases();
          const hasPurchased = purchases.some(p => p.hubItemId === item.id);
          setIsPurchased(hasPurchased);
        } catch (err) {
          console.error('Failed to check purchase status:', err);
        }
      }
    }
    
    checkPurchaseStatus();
  }, [item.id, item.price]);
  
  const handleInstall = () => {
    if (item.price > 0 && !isPurchased) {
      setShowPurchase(true);
    } else {
      // Proceed with installation
      window.location.href = paths.communityHub.importItem(item.importId);
    }
  };
  
  const handlePurchaseSuccess = async (licenseKey) => {
    setIsPurchased(true);
    setShowPurchase(false);
    
    // Show success message
    const message = licenseKey 
      ? `Purchase successful! License key: ${licenseKey}`
      : 'Item ready to install!';
    
    // You might want to show a toast notification here
    console.log(message);
    
    // Proceed with installation
    setTimeout(() => {
      window.location.href = paths.communityHub.importItem(item.importId);
    }, 1000);
  };
  
  return (
    <>
      <div className="bg-theme-bg-primary rounded-lg p-4 hover:shadow-lg transition-shadow duration-200 border border-theme-border">
        <div className="flex justify-between items-start mb-3">
          <h4 className="font-semibold text-theme-text-primary line-clamp-1">
            {item.name}
          </h4>
          {item.price > 0 ? (
            <div className="flex items-center gap-1">
              {isPurchased && (
                <Check className="w-4 h-4 text-green-500" />
              )}
              <span className={`px-2 py-1 rounded text-xs font-medium ${
                isPurchased 
                  ? 'bg-green-500/20 text-green-500' 
                  : 'bg-primary-button/20 text-primary-button'
              }`}>
                ${item.price}
              </span>
            </div>
          ) : (
            <span className="bg-green-500/20 text-green-500 px-2 py-1 rounded text-xs font-medium">
              Free
            </span>
          )}
        </div>
        
        <p className="text-sm text-theme-text-secondary mb-4 line-clamp-2">
          {item.description}
        </p>
        
        <div className="flex items-center justify-between text-xs text-theme-text-secondary mb-3">
          <span>by {item.author || 'Community'}</span>
          <span>{item.downloads || 0} downloads</span>
        </div>
        
        <button
          onClick={handleInstall}
          disabled={isLoading}
          className={`w-full py-2 rounded font-medium transition-colors flex items-center justify-center gap-2 ${
            item.price > 0 && !isPurchased
              ? 'bg-primary-button text-white hover:bg-primary-button-hover'
              : 'bg-theme-bg-secondary text-theme-text-primary hover:bg-opacity-80'
          } disabled:opacity-50`}
        >
          {isLoading ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              Processing...
            </>
          ) : item.price > 0 && !isPurchased ? (
            <>
              <ShoppingCart className="w-4 h-4" />
              Purchase & Install
            </>
          ) : (
            <>
              <Download className="w-4 h-4" />
              {isPurchased ? 'Install (Purchased)' : 'Install'}
            </>
          )}
        </button>
      </div>
      
      {showPurchase && (
        <MarketplacePurchaseModal
          item={item}
          onClose={() => setShowPurchase(false)}
          onSuccess={handlePurchaseSuccess}
        />
      )}
    </>
  );
}
```

## Phase 6: Testing

### Step 6.1: Configure Test Environment

Add to `/server/.env`:
```env
# Stripe Test Configuration
STRIPE_SECRET_KEY=sk_test_51... # Get from Stripe Dashboard
STRIPE_WEBHOOK_SECRET=whsec_... # Get after setting up webhook

# Optional: Enable marketplace features
MARKETPLACE_ENABLED=true
MARKETPLACE_MAX_ACTIVATIONS=3
```

Add to `/frontend/.env`:
```env
# Stripe Public Key
REACT_APP_STRIPE_PUBLIC_KEY=pk_test_51... # Get from Stripe Dashboard
```

### Step 6.2: Test Payment Flow

1. **Start Development Server**:
```bash
# Terminal 1: Start backend
cd server
yarn dev

# Terminal 2: Start frontend
cd frontend
yarn dev
```

2. **Test with Stripe Test Cards**:
- Success: `4242 4242 4242 4242`
- Declined: `4000 0000 0000 0002`
- Authentication Required: `4000 0025 0000 3155`

3. **Verify Database Records**:
```sql
-- Check purchases
SELECT * FROM marketplace_purchases WHERE userId = ?;

-- Check activations
SELECT * FROM marketplace_activations WHERE purchaseId = ?;
```

### Step 6.3: Test License Validation

```javascript
// Test script: server/test/marketplace.test.js
const { PaymentProcessor } = require('../utils/payments');

async function testLicenseValidation() {
  // Test free item
  const freeResult = await PaymentProcessor.validateLicense(
    'free-item-id',
    1, // userId
    1  // workspaceId
  );
  console.log('Free item:', freeResult);
  
  // Test paid item without license
  const unpurchasedResult = await PaymentProcessor.validateLicense(
    'paid-item-id',
    1,
    1
  );
  console.log('Unpurchased item:', unpurchasedResult);
  
  // Test with valid license
  // First create a test purchase...
}

testLicenseValidation();
```

## Phase 7: Deployment

### Step 7.1: Production Configuration

1. **Get Production Stripe Keys**:
   - Log into Stripe Dashboard
   - Switch to Production mode
   - Copy production keys

2. **Configure Webhook**:
   - In Stripe Dashboard, go to Webhooks
   - Add endpoint: `https://yourdomain.com/api/marketplace/webhook/stripe`
   - Select events: `payment_intent.succeeded`, `payment_intent.payment_failed`
   - Copy webhook secret

3. **Update Production Environment**:
```env
# Production .env
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
NODE_ENV=production
```

### Step 7.2: Database Migration

```bash
# Backup database
cp storage/anythingllm.db storage/backup/anythingllm-$(date +%Y%m%d).db

# Run migrations
NODE_ENV=production npx prisma migrate deploy

# Verify migration
npx prisma studio
```

### Step 7.3: Deploy Application

```bash
# Build frontend
cd frontend
yarn build

# Deploy with PM2
pm2 start ecosystem.config.js --env production

# Or with Docker
docker-compose -f docker/docker-compose.yml up -d
```

### Step 7.4: Monitor and Verify

1. **Check Application Logs**:
```bash
pm2 logs
tail -f server/storage/logs/server.log
```

2. **Verify Stripe Webhook**:
   - Make a test purchase
   - Check Stripe Dashboard webhook logs
   - Verify database records are created

3. **Monitor Performance**:
```bash
# Check database size
du -h storage/anythingllm.db

# Monitor API response times
curl -w "@curl-format.txt" -o /dev/null -s https://yourdomain.com/api/health
```

## API Reference

### Endpoints

#### POST `/api/marketplace/item/:itemId/payment-intent`
Create payment intent for purchasing an item.

**Request**:
```json
{
  // No body required, uses authenticated user
}
```

**Response**:
```json
{
  "success": true,
  "clientSecret": "pi_xxx_secret_xxx",
  "licenseKey": "ALLM-XXXX-XXXX-XXXX-XXXX"
}
```

#### GET `/api/marketplace/purchases`
Get user's marketplace purchases.

**Response**:
```json
{
  "success": true,
  "purchases": [
    {
      "hubItemId": "skill-123",
      "licenseKey": "ALLM-XXXX-XXXX-XXXX-XXXX",
      "purchasePrice": 29.99,
      "currency": "USD",
      "createdAt": "2024-01-01T00:00:00Z",
      "activations": []
    }
  ]
}
```

#### POST `/api/marketplace/item/:itemId/validate`
Validate license for an item.

**Request**:
```json
{
  "workspaceId": 1
}
```

**Response**:
```json
{
  "success": true,
  "valid": true,
  "licenseKey": "ALLM-XXXX-XXXX-XXXX-XXXX"
}
```

## Troubleshooting

### Common Issues

#### Payment Intent Creation Fails
- Check Stripe API keys are correct
- Verify user is authenticated
- Check item has valid price information

#### License Validation Fails
- Verify purchase record exists in database
- Check activation limits haven't been exceeded
- Ensure workspace ID is valid

#### Webhook Not Receiving Events
- Verify webhook secret is correct
- Check firewall/proxy settings
- Ensure endpoint URL is publicly accessible
- Check Stripe webhook logs for errors

#### Database Migration Issues
- Backup database before migration
- Check disk space availability
- Verify Prisma schema is valid
- Run `npx prisma format` to fix formatting

### Debug Mode

Enable debug logging:
```javascript
// server/utils/payments/index.js
const DEBUG = process.env.MARKETPLACE_DEBUG === 'true';

if (DEBUG) {
  console.log('[PaymentProcessor]', ...);
}
```

### Support

For issues or questions:
- Check server logs: `/server/storage/logs/`
- Review Stripe Dashboard logs
- Enable debug mode for detailed logging
- Contact support with error messages and logs

## Security Considerations

1. **API Key Security**:
   - Never commit API keys to version control
   - Use environment variables for all secrets
   - Rotate keys periodically

2. **Payment Security**:
   - Always use HTTPS in production
   - Validate webhook signatures
   - Implement rate limiting on payment endpoints

3. **License Security**:
   - Use cryptographically secure random keys
   - Implement machine fingerprinting
   - Regular audit of activation patterns

4. **Database Security**:
   - Regular backups
   - Encrypt sensitive data
   - Implement proper access controls

## Conclusion

This marketplace implementation provides a complete solution for monetizing agent skills in AnythingLLM. The system leverages existing infrastructure while adding robust payment processing, license management, and a seamless user experience.

For additional customization or support, refer to the individual component documentation or contact the development team.