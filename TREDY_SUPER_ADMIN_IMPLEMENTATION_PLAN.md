# 🎯 TREDY SUPER ADMIN - COMPLETE IMPLEMENTATION PLAN

**Version**: 2.0
**Timeline**: 6-7 days
**Last Updated**: 2025-09-30

---

## 📋 TABLE OF CONTENTS

1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Role Hierarchy](#role-hierarchy)
4. [Phase 1: Database Schema](#phase-1-database-schema)
5. [Phase 2: Backend Models & API](#phase-2-backend-models--api)
6. [Phase 3: Super Admin Dashboard](#phase-3-super-admin-dashboard)
7. [Phase 4: Payment & Billing](#phase-4-payment--billing)
8. [Phase 5: Analytics & Monitoring](#phase-5-analytics--monitoring)
9. [Phase 6: Testing & Deployment](#phase-6-testing--deployment)

---

## 🎯 OVERVIEW {#overview}

### Goal
Build a **comprehensive Super Admin panel** to manage the entire Tredy platform:
- ✅ Multi-tenant organization management
- ✅ User management across all organizations
- ✅ Marketplace catalog & purchases
- ✅ Billing & subscription management
- ✅ Analytics & usage monitoring
- ✅ System health & performance

### Three-Tier User Hierarchy

```
┌─────────────────────────────────────────────────────┐
│            SUPER ADMIN (Tredy Team)                  │
│  • Manage all organizations                          │
│  • View all purchases & billing                      │
│  • Create/Edit marketplace items                     │
│  • Platform-wide analytics                           │
└─────────────────────────────────────────────────────┘
                        │
        ┌───────────────┼───────────────┐
        ▼               ▼               ▼
┌──────────────┐ ┌──────────────┐ ┌──────────────┐
│ ORG ADMIN    │ │ ORG ADMIN    │ │ ORG ADMIN    │
│ (Agency)     │ │ (Factory)    │ │ (Startup)    │
│              │ │              │ │              │
│ • Manage     │ │ • Manage     │ │ • Manage     │
│   org users  │ │   org users  │ │   org users  │
│ • Buy items  │ │ • Buy items  │ │ • Buy items  │
│ • View org   │ │ • View org   │ │ • View org   │
│   analytics  │ │   analytics  │ │   analytics  │
└──────────────┘ └──────────────┘ └──────────────┘
        │               │               │
        ▼               ▼               ▼
┌──────────────┐ ┌──────────────┐ ┌──────────────┐
│ END USERS    │ │ END USERS    │ │ END USERS    │
│ (Clients)    │ │ (Teams)      │ │ (Customers)  │
│              │ │              │ │              │
│ • Use AI     │ │ • Use AI     │ │ • Use AI     │
│ • Chat       │ │ • Chat       │ │ • Chat       │
│ • Workflows  │ │ • Workflows  │ │ • Workflows  │
└──────────────┘ └──────────────┘ └──────────────┘
```

---

## 🏗️ ARCHITECTURE {#architecture}

### Data Flow

```
┌─────────────────────────────────────────────────────────┐
│                  TREDY SUPER ADMIN                       │
│  /super-admin/* endpoints                                │
│  • Organizations CRUD                                    │
│  • Marketplace Catalog Management                        │
│  • Platform Analytics                                    │
│  • Billing Overview                                      │
└──────────────────┬──────────────────────────────────────┘
                   │
         ┌─────────┴─────────┐
         │                   │
         ▼                   ▼
┌─────────────────┐  ┌─────────────────┐
│  LOCAL DB       │  │  SUPABASE       │
│  (Prisma)       │  │  (Catalog)      │
│                 │  │                 │
│ • organizations │  │ • items         │
│ • users         │  │ • receipts      │
│ • purchases     │  │ • files         │
│ • workspaces    │  │                 │
└─────────────────┘  └─────────────────┘
         │
         ▼
┌─────────────────────────────────────────────────────────┐
│                  ORG ADMIN PANEL                         │
│  /admin/* endpoints (existing)                           │
│  • Manage org users                                      │
│  • Purchase marketplace items                            │
│  • View org analytics                                    │
└─────────────────────────────────────────────────────────┘
```

---

## 👥 ROLE HIERARCHY {#role-hierarchy}

### Updated Role System

```javascript
// server/utils/middleware/multiUserProtected.js
const ROLES = {
  all: "<all>",
  super_admin: "super_admin",  // NEW: Platform owner (Tredy team)
  admin: "admin",              // Organization admin
  manager: "manager",          // Organization manager
  default: "default",          // End user
};
```

### Role Permissions Matrix

| Feature | Super Admin | Org Admin | Manager | Default |
|---------|------------|-----------|---------|---------|
| **Platform Management** |
| View all organizations | ✅ | ❌ | ❌ | ❌ |
| Create organizations | ✅ | ❌ | ❌ | ❌ |
| Edit any organization | ✅ | ❌ | ❌ | ❌ |
| Delete organizations | ✅ | ❌ | ❌ | ❌ |
| **Marketplace** |
| Create marketplace items | ✅ | ❌ | ❌ | ❌ |
| Edit marketplace items | ✅ | ❌ | ❌ | ❌ |
| View all purchases | ✅ | Own org | Own org | ❌ |
| Purchase items | ✅ | ✅ | ❌ | ❌ |
| **User Management** |
| View all users | ✅ | Own org | Own org | ❌ |
| Create users in any org | ✅ | Own org | Own org | ❌ |
| Edit users in any org | ✅ | Own org | Own org | ❌ |
| Delete users | ✅ | Own org | Own org | ❌ |
| **Analytics** |
| Platform analytics | ✅ | ❌ | ❌ | ❌ |
| Organization analytics | ✅ | Own org | Own org | ❌ |
| **Billing** |
| View all billing | ✅ | ❌ | ❌ | ❌ |
| Manage org subscription | ✅ | Own org | ❌ | ❌ |

---

## 📦 PHASE 1: DATABASE SCHEMA {#phase-1-database-schema}

### 1.1 Prisma Schema Updates

```prisma
// Add to server/prisma/schema.prisma

// ========================================
// ORGANIZATIONS
// ========================================
model organizations {
  id                Int       @id @default(autoincrement())
  name              String
  slug              String    @unique

  // Organization tier
  tier              String    @default("internal")  // "internal", "agency", "startup"

  // Subscription & billing
  stripe_customer_id String?  @unique
  subscription_status String? @default("trial")     // "trial", "active", "cancelled", "past_due"
  subscription_tier  String?  @default("free")      // "free", "starter", "pro", "enterprise"
  trial_ends_at     DateTime?
  subscription_renews_at DateTime?
  monthly_spend_limit_cents Int? @default(10000)   // $100 default

  // White-label settings
  custom_domain      String?
  logo_filename      String?
  primary_color      String?  @default("#3B82F6")
  custom_app_name    String?  @default("Tredy AI")

  // Metadata
  company_size       String?  // "1-10", "11-50", "51-200", "201+"
  industry           String?  // "Manufacturing", "Logistics", "Finance", etc.
  country            String?
  contact_email      String?

  // Status
  active            Boolean   @default(true)
  suspended         Boolean   @default(false)
  suspension_reason String?

  createdAt         DateTime  @default(now())
  lastUpdatedAt     DateTime  @default(now())

  // Relations
  workspaces        workspaces[]
  users             users[]
  marketplace_purchases marketplace_purchases[]
  usage_logs        usage_logs[]

  @@index([tier])
  @@index([subscription_status])
  @@index([active])
}

// ========================================
// USERS (Extended)
// ========================================
model users {
  id                          Int                           @id @default(autoincrement())
  username                    String?                       @unique
  password                    String
  pfpFilename                 String?
  role                        String                        @default("default")
  suspended                   Int                           @default(0)
  seen_recovery_codes         Boolean?                      @default(false)
  supabase_id                 String?                       @unique

  // NEW: Organization link
  organizationId              Int?
  organization                organizations?                @relation(fields: [organizationId], references: [id], onDelete: Cascade)

  // NEW: Usage tracking
  last_active_at              DateTime?
  total_messages_sent         Int                           @default(0)

  createdAt                   DateTime                      @default(now())
  lastUpdatedAt               DateTime                      @default(now())
  dailyMessageLimit           Int?
  bio                         String?                       @default("")

  // Existing relations...
  workspace_chats             workspace_chats[]
  workspace_users             workspace_users[]
  // ... (all other existing relations)

  @@index([organizationId])
  @@index([role])
  @@index([suspended])
}

// ========================================
// WORKSPACES (Extended)
// ========================================
model workspaces {
  id                   Int                    @id @default(autoincrement())
  name                 String
  slug                 String                 @unique

  // NEW: Organization link
  organizationId       Int?
  organization         organizations?         @relation(fields: [organizationId], references: [id], onDelete: Cascade)

  // Existing fields...
  openAiPrompt         String?
  openAiTemp           Float?
  openAiHistory        Int                    @default(20)
  // ... (all other existing fields)

  @@index([organizationId])
  @@index([slug])
}

// ========================================
// MARKETPLACE PURCHASES
// ========================================
model marketplace_purchases {
  id                         Int           @id @default(autoincrement())
  organizationId             Int           // Organization that owns this purchase
  hubId                      String        // Item UUID from Supabase
  itemType                   String        // 'agent-skill', 'system-prompt', 'slash-command'
  itemName                   String?       // Cached item name

  // Payment details
  stripe_payment_intent_id   String?       @unique
  stripe_checkout_session_id String?       @unique
  amount_paid_cents          Int?
  currency                   String        @default("usd")

  // Metadata
  purchasedBy                Int?          // User ID who made purchase
  purchasedAt                DateTime      @default(now())
  status                     String        @default("completed")  // "completed", "refunded", "failed"
  refunded_at                DateTime?
  refund_reason              String?

  // Relations
  organization               organizations @relation(fields: [organizationId], references: [id], onDelete: Cascade)

  @@unique([organizationId, hubId])
  @@index([organizationId])
  @@index([hubId])
  @@index([status])
  @@index([purchasedAt])
}

// ========================================
// MARKETPLACE INSTALLATIONS
// ========================================
model marketplace_installations {
  id              Int       @id @default(autoincrement())
  hubId           String    // Item UUID
  itemType        String    // 'agent-skill', 'system-prompt', 'slash-command'

  // Scope: organization-wide OR workspace-specific OR user-specific
  organizationId  Int?      // If set, available to entire org
  workspaceId     Int?      // If set, available only to this workspace
  userId          Int?      // If set, available only to this user (for slash commands)

  active          Boolean   @default(true)
  installedAt     DateTime  @default(now())
  installedBy     Int?      // User who installed it
  lastUsedAt      DateTime?
  usageCount      Int       @default(0)

  workspace       workspaces? @relation(fields: [workspaceId], references: [id], onDelete: Cascade)
  user            users?      @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([hubId, organizationId, workspaceId, userId])
  @@index([workspaceId])
  @@index([userId])
  @@index([organizationId])
  @@index([hubId])
}

// ========================================
// USAGE LOGS (For billing & analytics)
// ========================================
model usage_logs {
  id              Int           @id @default(autoincrement())
  organizationId  Int
  organization    organizations @relation(fields: [organizationId], references: [id], onDelete: Cascade)

  // What was used
  event_type      String        // "message_sent", "agent_invoked", "workflow_run", "document_uploaded"
  resource_type   String?       // "llm", "agent-skill", "connector"
  resource_id     String?       // Item ID or model name

  // Who used it
  userId          Int?
  workspaceId     Int?

  // Cost tracking
  tokens_used     Int?          // For LLM calls
  cost_cents      Int?          // Estimated cost in cents

  // Metadata
  metadata        String?       // JSON string for additional context
  created_at      DateTime      @default(now())

  @@index([organizationId, created_at])
  @@index([event_type])
  @@index([created_at])
}
```

### 1.2 Supabase Schema (Marketplace Catalog)

```sql
-- Run in Supabase SQL Editor

-- ========================================
-- MARKETPLACE ITEMS
-- ========================================
CREATE TABLE tredy_marketplace_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  long_description TEXT,  -- Markdown for detailed page
  item_type TEXT NOT NULL CHECK (item_type IN ('agent-skill', 'system-prompt', 'slash-command')),

  -- Categorization
  category TEXT,           -- "Procurement", "HR", "Finance", etc.
  tags TEXT[] DEFAULT '{}',
  use_cases TEXT[],        -- ["RFQ Processing", "Vendor Comparison"]

  -- Pricing
  price_cents INTEGER DEFAULT 0 CHECK (price_cents >= 0),
  stripe_price_id TEXT,
  stripe_product_id TEXT,

  -- Media
  icon_url TEXT,
  screenshot_urls TEXT[],
  demo_video_url TEXT,

  -- Files (for agent skills)
  download_url TEXT,       -- Signed URL to ZIP file
  storage_path TEXT,       -- Path in Supabase storage
  file_size_bytes BIGINT,

  -- Content (for prompts/commands)
  content JSONB,           -- { prompt: "...", command: "...", config: {...} }

  -- Metadata
  version TEXT DEFAULT '1.0.0',
  author TEXT DEFAULT 'Tredy',
  author_avatar_url TEXT,
  downloads_count INTEGER DEFAULT 0,
  rating_avg DECIMAL(2,1) DEFAULT 0.0,
  rating_count INTEGER DEFAULT 0,

  -- Status
  active BOOLEAN DEFAULT true,
  featured BOOLEAN DEFAULT false,
  verified BOOLEAN DEFAULT true,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ========================================
-- PURCHASE RECEIPTS (Lightweight copy)
-- ========================================
CREATE TABLE tredy_marketplace_receipts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  item_id UUID REFERENCES tredy_marketplace_items(id) ON DELETE CASCADE,

  -- Organization identifier (from your Prisma DB)
  organization_slug TEXT NOT NULL,
  organization_name TEXT,

  -- Payment
  stripe_payment_intent_id TEXT UNIQUE,
  stripe_checkout_session_id TEXT UNIQUE,
  amount_paid_cents INTEGER,
  currency TEXT DEFAULT 'usd',

  -- Timestamps
  purchased_at TIMESTAMPTZ DEFAULT NOW()
);

-- ========================================
-- ITEM REVIEWS
-- ========================================
CREATE TABLE tredy_marketplace_reviews (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  item_id UUID REFERENCES tredy_marketplace_items(id) ON DELETE CASCADE,
  organization_slug TEXT NOT NULL,
  user_email TEXT,

  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  review_text TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(item_id, organization_slug)
);

-- ========================================
-- INDEXES
-- ========================================
CREATE INDEX idx_items_type ON tredy_marketplace_items(item_type);
CREATE INDEX idx_items_active ON tredy_marketplace_items(active);
CREATE INDEX idx_items_featured ON tredy_marketplace_items(featured);
CREATE INDEX idx_items_category ON tredy_marketplace_items(category);
CREATE INDEX idx_receipts_org ON tredy_marketplace_receipts(organization_slug);
CREATE INDEX idx_receipts_item ON tredy_marketplace_receipts(item_id);

-- ========================================
-- RLS POLICIES
-- ========================================
ALTER TABLE tredy_marketplace_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE tredy_marketplace_receipts ENABLE ROW LEVEL SECURITY;
ALTER TABLE tredy_marketplace_reviews ENABLE ROW LEVEL SECURITY;

-- Service role has full access
CREATE POLICY "Service role full access items" ON tredy_marketplace_items
FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "Service role full access receipts" ON tredy_marketplace_receipts
FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "Service role full access reviews" ON tredy_marketplace_reviews
FOR ALL TO service_role USING (true) WITH CHECK (true);
```

### 1.3 Migration Commands

```bash
# 1. Run Prisma migration
cd server
yarn prisma migrate dev --name add_super_admin_multi_tenant

# 2. Generate Prisma client
yarn prisma generate

# 3. Update user roles
yarn prisma studio
# Manually set your user role to 'super_admin'

# Or via SQL:
sqlite3 server/storage/anythingllm.db
# UPDATE users SET role = 'super_admin' WHERE id = 1;
```

---

## 🔧 PHASE 2: BACKEND MODELS & API {#phase-2-backend-models--api}

### 2.1 Organization Model

**File**: `server/models/organization.js`

```javascript
const prisma = require("../utils/prisma");
const slugify = require("slugify");
const { v4: uuidv4 } = require("uuid");

const Organization = {
  validTiers: ["internal", "agency", "startup"],
  validSubscriptionTiers: ["free", "starter", "pro", "enterprise"],
  validSubscriptionStatuses: ["trial", "active", "cancelled", "past_due"],

  create: async function ({
    name,
    tier = "internal",
    subscriptionTier = "free",
    contactEmail = null,
    createdBy = null,
  }) {
    try {
      const slug = slugify(name, { lower: true, strict: true }) || uuidv4();

      const org = await prisma.organizations.create({
        data: {
          name,
          slug,
          tier,
          subscription_tier: subscriptionTier,
          contact_email: contactEmail,
          subscription_status: "trial",
          trial_ends_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
        },
      });

      // If created by a user, assign them as org admin
      if (createdBy) {
        await prisma.users.update({
          where: { id: createdBy },
          data: {
            organizationId: org.id,
            role: "admin",
          },
        });
      }

      return { organization: org, error: null };
    } catch (error) {
      console.error("Failed to create organization:", error);
      return { organization: null, error: error.message };
    }
  },

  get: async function (clause = {}) {
    try {
      return await prisma.organizations.findFirst({
        where: clause,
        include: {
          users: { select: { id: true, username: true, role: true } },
          workspaces: { select: { id: true, name: true, slug: true } },
          _count: {
            select: {
              users: true,
              workspaces: true,
              marketplace_purchases: true,
            },
          },
        },
      });
    } catch (error) {
      console.error(error);
      return null;
    }
  },

  where: async function (clause = {}, limit = null) {
    try {
      return await prisma.organizations.findMany({
        where: clause,
        ...(limit ? { take: limit } : {}),
        include: {
          _count: {
            select: {
              users: true,
              workspaces: true,
              marketplace_purchases: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
      });
    } catch (error) {
      console.error(error);
      return [];
    }
  },

  update: async function (orgId, updates = {}) {
    try {
      const org = await prisma.organizations.update({
        where: { id: Number(orgId) },
        data: {
          ...updates,
          lastUpdatedAt: new Date(),
        },
      });
      return { organization: org, error: null };
    } catch (error) {
      console.error("Failed to update organization:", error);
      return { organization: null, error: error.message };
    }
  },

  delete: async function (orgId) {
    try {
      await prisma.organizations.delete({
        where: { id: Number(orgId) },
      });
      return { success: true, error: null };
    } catch (error) {
      console.error("Failed to delete organization:", error);
      return { success: false, error: error.message };
    }
  },

  // Check if org has purchased an item
  hasPurchased: async function (orgId, itemHubId) {
    const purchase = await prisma.marketplace_purchases.findFirst({
      where: {
        organizationId: orgId,
        hubId: itemHubId,
        status: "completed",
      },
    });
    return !!purchase;
  },

  // Get organization stats
  getStats: async function (orgId) {
    try {
      const [
        userCount,
        workspaceCount,
        purchaseCount,
        messageCount,
      ] = await Promise.all([
        prisma.users.count({ where: { organizationId: orgId } }),
        prisma.workspaces.count({ where: { organizationId: orgId } }),
        prisma.marketplace_purchases.count({
          where: { organizationId: orgId, status: "completed" },
        }),
        prisma.workspace_chats.count({
          where: {
            user: { organizationId: orgId },
          },
        }),
      ]);

      // Calculate usage in last 30 days
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const recentUsage = await prisma.usage_logs.count({
        where: {
          organizationId: orgId,
          created_at: { gte: thirtyDaysAgo },
        },
      });

      return {
        userCount,
        workspaceCount,
        purchaseCount,
        messageCount,
        recentUsage,
      };
    } catch (error) {
      console.error("Failed to get org stats:", error);
      return null;
    }
  },
};

module.exports = { Organization };
```

### 2.2 Super Admin Endpoints

**File**: `server/endpoints/superAdmin.js`

```javascript
const { Organization } = require("../models/organization");
const { User } = require("../models/user");
const { Workspace } = require("../models/workspace");
const { reqBody } = require("../utils/http");
const { validatedRequest } = require("../utils/middleware/validatedRequest");
const { strictMultiUserRoleValid, ROLES } = require("../utils/middleware/multiUserProtected");
const prisma = require("../utils/prisma");

function superAdminEndpoints(app) {
  if (!app) return;

  // ========================================
  // ORGANIZATIONS
  // ========================================

  // List all organizations
  app.get(
    "/super-admin/organizations",
    [validatedRequest, strictMultiUserRoleValid([ROLES.super_admin])],
    async (request, response) => {
      try {
        const organizations = await Organization.where();
        response.status(200).json({ success: true, organizations });
      } catch (error) {
        console.error("Failed to fetch organizations:", error);
        response.status(500).json({ success: false, error: error.message });
      }
    }
  );

  // Get single organization with details
  app.get(
    "/super-admin/organizations/:id",
    [validatedRequest, strictMultiUserRoleValid([ROLES.super_admin])],
    async (request, response) => {
      try {
        const { id } = request.params;
        const organization = await Organization.get({ id: Number(id) });
        const stats = await Organization.getStats(Number(id));

        if (!organization) {
          return response.status(404).json({
            success: false,
            error: "Organization not found",
          });
        }

        response.status(200).json({
          success: true,
          organization: {
            ...organization,
            stats,
          },
        });
      } catch (error) {
        console.error("Failed to fetch organization:", error);
        response.status(500).json({ success: false, error: error.message });
      }
    }
  );

  // Create new organization
  app.post(
    "/super-admin/organizations",
    [validatedRequest, strictMultiUserRoleValid([ROLES.super_admin])],
    async (request, response) => {
      try {
        const { name, tier, subscriptionTier, contactEmail } = reqBody(request);

        if (!name) {
          return response.status(400).json({
            success: false,
            error: "Organization name is required",
          });
        }

        const { organization, error } = await Organization.create({
          name,
          tier,
          subscriptionTier,
          contactEmail,
        });

        if (error) {
          return response.status(400).json({ success: false, error });
        }

        response.status(201).json({ success: true, organization });
      } catch (error) {
        console.error("Failed to create organization:", error);
        response.status(500).json({ success: false, error: error.message });
      }
    }
  );

  // Update organization
  app.patch(
    "/super-admin/organizations/:id",
    [validatedRequest, strictMultiUserRoleValid([ROLES.super_admin])],
    async (request, response) => {
      try {
        const { id } = request.params;
        const updates = reqBody(request);

        const { organization, error } = await Organization.update(id, updates);

        if (error) {
          return response.status(400).json({ success: false, error });
        }

        response.status(200).json({ success: true, organization });
      } catch (error) {
        console.error("Failed to update organization:", error);
        response.status(500).json({ success: false, error: error.message });
      }
    }
  );

  // Suspend/Unsuspend organization
  app.post(
    "/super-admin/organizations/:id/suspend",
    [validatedRequest, strictMultiUserRoleValid([ROLES.super_admin])],
    async (request, response) => {
      try {
        const { id } = request.params;
        const { suspended, reason } = reqBody(request);

        const { organization, error } = await Organization.update(id, {
          suspended: !!suspended,
          suspension_reason: reason || null,
        });

        if (error) {
          return response.status(400).json({ success: false, error });
        }

        response.status(200).json({ success: true, organization });
      } catch (error) {
        console.error("Failed to suspend organization:", error);
        response.status(500).json({ success: false, error: error.message });
      }
    }
  );

  // Delete organization
  app.delete(
    "/super-admin/organizations/:id",
    [validatedRequest, strictMultiUserRoleValid([ROLES.super_admin])],
    async (request, response) => {
      try {
        const { id } = request.params;

        // Check if org has users/workspaces
        const org = await Organization.get({ id: Number(id) });
        if (!org) {
          return response.status(404).json({
            success: false,
            error: "Organization not found",
          });
        }

        const { success, error } = await Organization.delete(id);

        if (error) {
          return response.status(400).json({ success: false, error });
        }

        response.status(200).json({ success: true });
      } catch (error) {
        console.error("Failed to delete organization:", error);
        response.status(500).json({ success: false, error: error.message });
      }
    }
  );

  // ========================================
  // USERS (Cross-organization)
  // ========================================

  // List all users across all organizations
  app.get(
    "/super-admin/users",
    [validatedRequest, strictMultiUserRoleValid([ROLES.super_admin])],
    async (request, response) => {
      try {
        const users = await prisma.users.findMany({
          include: {
            organization: {
              select: { id: true, name: true, slug: true },
            },
          },
          orderBy: { createdAt: "desc" },
        });

        response.status(200).json({
          success: true,
          users: users.map(u => User.filterFields(u)),
        });
      } catch (error) {
        console.error("Failed to fetch users:", error);
        response.status(500).json({ success: false, error: error.message });
      }
    }
  );

  // Get users by organization
  app.get(
    "/super-admin/organizations/:id/users",
    [validatedRequest, strictMultiUserRoleValid([ROLES.super_admin])],
    async (request, response) => {
      try {
        const { id } = request.params;

        const users = await User.where({ organizationId: Number(id) });

        response.status(200).json({ success: true, users });
      } catch (error) {
        console.error("Failed to fetch users:", error);
        response.status(500).json({ success: false, error: error.message });
      }
    }
  );

  // ========================================
  // MARKETPLACE PURCHASES
  // ========================================

  // List all purchases
  app.get(
    "/super-admin/purchases",
    [validatedRequest, strictMultiUserRoleValid([ROLES.super_admin])],
    async (request, response) => {
      try {
        const purchases = await prisma.marketplace_purchases.findMany({
          include: {
            organization: {
              select: { id: true, name: true, slug: true },
            },
          },
          orderBy: { purchasedAt: "desc" },
        });

        response.status(200).json({ success: true, purchases });
      } catch (error) {
        console.error("Failed to fetch purchases:", error);
        response.status(500).json({ success: false, error: error.message });
      }
    }
  );

  // Get purchases by organization
  app.get(
    "/super-admin/organizations/:id/purchases",
    [validatedRequest, strictMultiUserRoleValid([ROLES.super_admin])],
    async (request, response) => {
      try {
        const { id } = request.params;

        const purchases = await prisma.marketplace_purchases.findMany({
          where: { organizationId: Number(id) },
          orderBy: { purchasedAt: "desc" },
        });

        response.status(200).json({ success: true, purchases });
      } catch (error) {
        console.error("Failed to fetch purchases:", error);
        response.status(500).json({ success: false, error: error.message });
      }
    }
  );

  // ========================================
  // ANALYTICS
  // ========================================

  // Platform-wide analytics
  app.get(
    "/super-admin/analytics/platform",
    [validatedRequest, strictMultiUserRoleValid([ROLES.super_admin])],
    async (request, response) => {
      try {
        const [
          totalOrgs,
          totalUsers,
          totalWorkspaces,
          totalPurchases,
          totalRevenue,
        ] = await Promise.all([
          prisma.organizations.count(),
          prisma.users.count(),
          prisma.workspaces.count(),
          prisma.marketplace_purchases.count({
            where: { status: "completed" },
          }),
          prisma.marketplace_purchases.aggregate({
            where: { status: "completed" },
            _sum: { amount_paid_cents: true },
          }),
        ]);

        // Get growth metrics (last 30 days)
        const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        const [newOrgs, newUsers, newPurchases] = await Promise.all([
          prisma.organizations.count({
            where: { createdAt: { gte: thirtyDaysAgo } },
          }),
          prisma.users.count({
            where: { createdAt: { gte: thirtyDaysAgo } },
          }),
          prisma.marketplace_purchases.count({
            where: {
              status: "completed",
              purchasedAt: { gte: thirtyDaysAgo },
            },
          }),
        ]);

        // Organization breakdown by tier
        const orgsByTier = await prisma.organizations.groupBy({
          by: ["tier"],
          _count: true,
        });

        // Subscription breakdown
        const orgsBySubscription = await prisma.organizations.groupBy({
          by: ["subscription_tier"],
          _count: true,
        });

        response.status(200).json({
          success: true,
          analytics: {
            totals: {
              organizations: totalOrgs,
              users: totalUsers,
              workspaces: totalWorkspaces,
              purchases: totalPurchases,
              revenue: (totalRevenue._sum.amount_paid_cents || 0) / 100,
            },
            growth: {
              newOrgsLast30Days: newOrgs,
              newUsersLast30Days: newUsers,
              newPurchasesLast30Days: newPurchases,
            },
            breakdown: {
              byTier: orgsByTier,
              bySubscription: orgsBySubscription,
            },
          },
        });
      } catch (error) {
        console.error("Failed to fetch platform analytics:", error);
        response.status(500).json({ success: false, error: error.message });
      }
    }
  );

  // Organization-specific analytics
  app.get(
    "/super-admin/analytics/organizations/:id",
    [validatedRequest, strictMultiUserRoleValid([ROLES.super_admin])],
    async (request, response) => {
      try {
        const { id } = request.params;
        const stats = await Organization.getStats(Number(id));

        // Get usage logs for last 30 days
        const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        const usageLogs = await prisma.usage_logs.findMany({
          where: {
            organizationId: Number(id),
            created_at: { gte: thirtyDaysAgo },
          },
          orderBy: { created_at: "desc" },
          take: 100,
        });

        // Get total spend
        const totalSpend = await prisma.marketplace_purchases.aggregate({
          where: {
            organizationId: Number(id),
            status: "completed",
          },
          _sum: { amount_paid_cents: true },
        });

        response.status(200).json({
          success: true,
          analytics: {
            ...stats,
            totalSpendCents: totalSpend._sum.amount_paid_cents || 0,
            recentUsageLogs: usageLogs,
          },
        });
      } catch (error) {
        console.error("Failed to fetch org analytics:", error);
        response.status(500).json({ success: false, error: error.message });
      }
    }
  );
}

module.exports = { superAdminEndpoints };
```

**Register in `server/index.js`**:

```javascript
const { superAdminEndpoints } = require("./endpoints/superAdmin");

// After other endpoints
superAdminEndpoints(app);
```

---

## 🎨 PHASE 3: SUPER ADMIN DASHBOARD {#phase-3-super-admin-dashboard}

### 3.1 Frontend Structure

```
frontend/src/pages/SuperAdmin/
├── index.jsx                     # Main dashboard
├── Organizations/
│   ├── index.jsx                 # Organization list
│   ├── OrganizationRow.jsx       # Table row component
│   ├── CreateOrgModal.jsx        # Create new org
│   ├── EditOrgModal.jsx          # Edit org details
│   └── OrgDetailsPage.jsx        # Single org view
├── Users/
│   ├── index.jsx                 # All users list
│   └── UserRow.jsx               # User row with org badge
├── Marketplace/
│   ├── index.jsx                 # Marketplace catalog management
│   ├── CreateItem/
│   │   ├── CreateSkill.jsx       # Create agent skill
│   │   ├── CreatePrompt.jsx      # Create system prompt
│   │   └── CreateCommand.jsx     # Create slash command
│   ├── EditItem.jsx              # Edit marketplace item
│   └── ItemRow.jsx               # Catalog item row
├── Purchases/
│   ├── index.jsx                 # All purchases
│   └── PurchaseRow.jsx           # Purchase details
├── Analytics/
│   ├── index.jsx                 # Platform analytics
│   ├── PlatformOverview.jsx      # Key metrics
│   ├── OrganizationChart.jsx     # Org growth chart
│   └── RevenueChart.jsx          # Revenue over time
└── Settings/
    ├── index.jsx                 # Platform settings
    └── BillingConfig.jsx         # Stripe configuration
```

### 3.2 Main Dashboard Component

**File**: `frontend/src/pages/SuperAdmin/index.jsx`

```javascript
import { useEffect, useState } from "react";
import Sidebar from "@/components/SettingsSidebar";
import { isMobile } from "react-device-detect";
import SuperAdminAPI from "@/models/superAdmin";
import {
  Buildings,
  Users,
  ShoppingCart,
  ChartLine,
  Package,
} from "@phosphor-icons/react";
import paths from "@/utils/paths";
import { useNavigate } from "react-router-dom";

export default function SuperAdminDashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStats() {
      const { success, analytics } = await SuperAdminAPI.getPlatformAnalytics();
      if (success) {
        setStats(analytics);
      }
      setLoading(false);
    }
    fetchStats();
  }, []);

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="w-screen h-screen overflow-hidden bg-theme-bg-container flex">
      <Sidebar />
      <div className="relative md:ml-[2px] md:mr-[16px] md:my-[16px] md:rounded-[16px] bg-theme-bg-secondary w-full h-full overflow-y-scroll p-4 md:p-0">
        <div className="flex flex-col w-full px-1 md:pl-6 md:pr-[50px] md:py-6 py-16">
          {/* Header */}
          <div className="w-full flex flex-col gap-y-1 pb-6 border-white/10 border-b-2">
            <div className="items-center flex gap-x-4">
              <p className="text-lg leading-6 font-bold text-theme-text-primary">
                Tredy Super Admin
              </p>
            </div>
            <p className="text-xs leading-[18px] font-base text-theme-text-secondary">
              Manage organizations, users, marketplace, and platform analytics
            </p>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
            <StatCard
              icon={<Buildings className="h-8 w-8" />}
              label="Organizations"
              value={stats?.totals?.organizations || 0}
              growth={stats?.growth?.newOrgsLast30Days}
              onClick={() => navigate(paths.superAdmin.organizations())}
            />
            <StatCard
              icon={<Users className="h-8 w-8" />}
              label="Total Users"
              value={stats?.totals?.users || 0}
              growth={stats?.growth?.newUsersLast30Days}
              onClick={() => navigate(paths.superAdmin.users())}
            />
            <StatCard
              icon={<ShoppingCart className="h-8 w-8" />}
              label="Purchases"
              value={stats?.totals?.purchases || 0}
              growth={stats?.growth?.newPurchasesLast30Days}
              onClick={() => navigate(paths.superAdmin.purchases())}
            />
            <StatCard
              icon={<ChartLine className="h-8 w-8" />}
              label="Revenue"
              value={`$${stats?.totals?.revenue?.toFixed(2) || "0.00"}`}
              isCurrency={true}
              onClick={() => navigate(paths.superAdmin.analytics())}
            />
          </div>

          {/* Quick Actions */}
          <div className="mt-8">
            <h3 className="text-md font-semibold text-theme-text-primary mb-4">
              Quick Actions
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <QuickActionCard
                icon={<Buildings />}
                title="Create Organization"
                description="Add a new customer organization"
                onClick={() => navigate(paths.superAdmin.organizations())}
              />
              <QuickActionCard
                icon={<Package />}
                title="Add Marketplace Item"
                description="Create a new skill, prompt, or command"
                onClick={() => navigate(paths.superAdmin.marketplace())}
              />
              <QuickActionCard
                icon={<ChartLine />}
                title="View Analytics"
                description="Platform-wide insights and trends"
                onClick={() => navigate(paths.superAdmin.analytics())}
              />
            </div>
          </div>

          {/* Recent Activity */}
          <div className="mt-8">
            <h3 className="text-md font-semibold text-theme-text-primary mb-4">
              Recent Organizations
            </h3>
            <RecentOrganizations />
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon, label, value, growth, isCurrency, onClick }) {
  return (
    <div
      onClick={onClick}
      className="bg-theme-bg-primary p-6 rounded-lg border border-white/10 hover:border-primary-button/50 cursor-pointer transition-all"
    >
      <div className="flex items-center justify-between mb-4">
        <div className="text-theme-text-secondary">{icon}</div>
        {growth !== undefined && (
          <span className="text-xs text-green-500">+{growth} this month</span>
        )}
      </div>
      <div className="text-2xl font-bold text-theme-text-primary mb-1">
        {value}
      </div>
      <div className="text-xs text-theme-text-secondary">{label}</div>
    </div>
  );
}

function QuickActionCard({ icon, title, description, onClick }) {
  return (
    <div
      onClick={onClick}
      className="bg-theme-bg-primary p-6 rounded-lg border border-white/10 hover:border-primary-button cursor-pointer transition-all"
    >
      <div className="text-primary-button mb-3">{icon}</div>
      <h4 className="text-sm font-semibold text-theme-text-primary mb-2">
        {title}
      </h4>
      <p className="text-xs text-theme-text-secondary">{description}</p>
    </div>
  );
}

function RecentOrganizations() {
  const [orgs, setOrgs] = useState([]);

  useEffect(() => {
    async function fetchOrgs() {
      const { success, organizations } = await SuperAdminAPI.getOrganizations();
      if (success) {
        setOrgs(organizations.slice(0, 5)); // Show only 5 most recent
      }
    }
    fetchOrgs();
  }, []);

  return (
    <div className="bg-theme-bg-primary rounded-lg border border-white/10">
      <table className="w-full">
        <thead className="border-b border-white/10">
          <tr className="text-xs text-theme-text-secondary">
            <th className="text-left p-4">Organization</th>
            <th className="text-left p-4">Tier</th>
            <th className="text-left p-4">Users</th>
            <th className="text-left p-4">Created</th>
          </tr>
        </thead>
        <tbody>
          {orgs.map((org) => (
            <tr
              key={org.id}
              className="border-b border-white/5 hover:bg-white/5 cursor-pointer"
            >
              <td className="p-4 text-sm text-theme-text-primary">
                {org.name}
              </td>
              <td className="p-4">
                <span className="px-2 py-1 bg-primary-button/20 text-primary-button text-xs rounded">
                  {org.tier}
                </span>
              </td>
              <td className="p-4 text-sm text-theme-text-secondary">
                {org._count?.users || 0}
              </td>
              <td className="p-4 text-xs text-theme-text-secondary">
                {new Date(org.createdAt).toLocaleDateString()}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
```

### 3.3 API Client

**File**: `frontend/src/models/superAdmin.js`

```javascript
import { API_BASE } from "@/utils/constants";
import { baseHeaders } from "@/utils/request";

const SuperAdmin = {
  // Organizations
  getOrganizations: async () => {
    return await fetch(`${API_BASE}/super-admin/organizations`, {
      method: "GET",
      headers: baseHeaders(),
    })
      .then((res) => res.json())
      .catch((e) => ({ success: false, error: e.message }));
  },

  getOrganization: async (orgId) => {
    return await fetch(`${API_BASE}/super-admin/organizations/${orgId}`, {
      method: "GET",
      headers: baseHeaders(),
    })
      .then((res) => res.json())
      .catch((e) => ({ success: false, error: e.message }));
  },

  createOrganization: async (data) => {
    return await fetch(`${API_BASE}/super-admin/organizations`, {
      method: "POST",
      headers: baseHeaders(),
      body: JSON.stringify(data),
    })
      .then((res) => res.json())
      .catch((e) => ({ success: false, error: e.message }));
  },

  updateOrganization: async (orgId, updates) => {
    return await fetch(`${API_BASE}/super-admin/organizations/${orgId}`, {
      method: "PATCH",
      headers: baseHeaders(),
      body: JSON.stringify(updates),
    })
      .then((res) => res.json())
      .catch((e) => ({ success: false, error: e.message }));
  },

  deleteOrganization: async (orgId) => {
    return await fetch(`${API_BASE}/super-admin/organizations/${orgId}`, {
      method: "DELETE",
      headers: baseHeaders(),
    })
      .then((res) => res.json())
      .catch((e) => ({ success: false, error: e.message }));
  },

  // Users
  getAllUsers: async () => {
    return await fetch(`${API_BASE}/super-admin/users`, {
      method: "GET",
      headers: baseHeaders(),
    })
      .then((res) => res.json())
      .catch((e) => ({ success: false, error: e.message }));
  },

  getUsersByOrg: async (orgId) => {
    return await fetch(`${API_BASE}/super-admin/organizations/${orgId}/users`, {
      method: "GET",
      headers: baseHeaders(),
    })
      .then((res) => res.json())
      .catch((e) => ({ success: false, error: e.message }));
  },

  // Purchases
  getAllPurchases: async () => {
    return await fetch(`${API_BASE}/super-admin/purchases`, {
      method: "GET",
      headers: baseHeaders(),
    })
      .then((res) => res.json())
      .catch((e) => ({ success: false, error: e.message }));
  },

  getPurchasesByOrg: async (orgId) => {
    return await fetch(
      `${API_BASE}/super-admin/organizations/${orgId}/purchases`,
      {
        method: "GET",
        headers: baseHeaders(),
      }
    )
      .then((res) => res.json())
      .catch((e) => ({ success: false, error: e.message }));
  },

  // Analytics
  getPlatformAnalytics: async () => {
    return await fetch(`${API_BASE}/super-admin/analytics/platform`, {
      method: "GET",
      headers: baseHeaders(),
    })
      .then((res) => res.json())
      .catch((e) => ({ success: false, error: e.message }));
  },

  getOrgAnalytics: async (orgId) => {
    return await fetch(
      `${API_BASE}/super-admin/analytics/organizations/${orgId}`,
      {
        method: "GET",
        headers: baseHeaders(),
      }
    )
      .then((res) => res.json())
      .catch((e) => ({ success: false, error: e.message }));
  },
};

export default SuperAdmin;
```

### 3.4 Add Routes

**Update**: `frontend/src/App.jsx`

```javascript
import SuperAdminDashboard from "@/pages/SuperAdmin";
import SuperAdminOrganizations from "@/pages/SuperAdmin/Organizations";
import SuperAdminUsers from "@/pages/SuperAdmin/Users";
import SuperAdminMarketplace from "@/pages/SuperAdmin/Marketplace";
import SuperAdminPurchases from "@/pages/SuperAdmin/Purchases";
import SuperAdminAnalytics from "@/pages/SuperAdmin/Analytics";

// Add routes
<Route path="/super-admin" element={<SuperAdminDashboard />} />
<Route path="/super-admin/organizations" element={<SuperAdminOrganizations />} />
<Route path="/super-admin/users" element={<SuperAdminUsers />} />
<Route path="/super-admin/marketplace" element={<SuperAdminMarketplace />} />
<Route path="/super-admin/purchases" element={<SuperAdminPurchases />} />
<Route path="/super-admin/analytics" element={<SuperAdminAnalytics />} />
```

**Update**: `frontend/src/utils/paths.js`

```javascript
export default {
  // ... existing paths
  superAdmin: {
    dashboard: () => "/super-admin",
    organizations: () => "/super-admin/organizations",
    users: () => "/super-admin/users",
    marketplace: () => "/super-admin/marketplace",
    purchases: () => "/super-admin/purchases",
    analytics: () => "/super-admin/analytics",
  },
};
```

---

## 💳 PHASE 4: PAYMENT & BILLING {#phase-4-payment--billing}

### 4.1 Subscription Management

**Add to `server/endpoints/superAdmin.js`**:

```javascript
// Stripe customer portal for subscription management
app.post(
  "/super-admin/organizations/:id/billing-portal",
  [validatedRequest, strictMultiUserRoleValid([ROLES.super_admin])],
  async (request, response) => {
    try {
      const { id } = request.params;
      const org = await Organization.get({ id: Number(id) });

      if (!org || !org.stripe_customer_id) {
        return response.status(404).json({
          success: false,
          error: "Organization or Stripe customer not found",
        });
      }

      const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
      const session = await stripe.billingPortal.sessions.create({
        customer: org.stripe_customer_id,
        return_url: `${process.env.SERVER_URL}/super-admin/organizations/${id}`,
      });

      response.status(200).json({
        success: true,
        portalUrl: session.url,
      });
    } catch (error) {
      console.error("Failed to create billing portal:", error);
      response.status(500).json({ success: false, error: error.message });
    }
  }
);

// Update subscription tier manually
app.post(
  "/super-admin/organizations/:id/subscription",
  [validatedRequest, strictMultiUserRoleValid([ROLES.super_admin])],
  async (request, response) => {
    try {
      const { id } = request.params;
      const { tier, status } = reqBody(request);

      const { organization, error } = await Organization.update(id, {
        subscription_tier: tier,
        subscription_status: status,
      });

      if (error) {
        return response.status(400).json({ success: false, error });
      }

      response.status(200).json({ success: true, organization });
    } catch (error) {
      console.error("Failed to update subscription:", error);
      response.status(500).json({ success: false, error: error.message });
    }
  }
);
```

---

## 📊 PHASE 5: ANALYTICS & MONITORING {#phase-5-analytics--monitoring}

### 5.1 Usage Logging

**File**: `server/models/usageLog.js`

```javascript
const prisma = require("../utils/prisma");

const UsageLog = {
  /**
   * Log a usage event
   */
  log: async function ({
    organizationId,
    eventType,
    resourceType = null,
    resourceId = null,
    userId = null,
    workspaceId = null,
    tokensUsed = null,
    costCents = null,
    metadata = null,
  }) {
    try {
      await prisma.usage_logs.create({
        data: {
          organizationId,
          event_type: eventType,
          resource_type: resourceType,
          resource_id: resourceId,
          userId,
          workspaceId,
          tokens_used: tokensUsed,
          cost_cents: costCents,
          metadata: metadata ? JSON.stringify(metadata) : null,
        },
      });
    } catch (error) {
      console.error("Failed to log usage:", error);
    }
  },

  /**
   * Get usage for an organization
   */
  getByOrganization: async function (organizationId, startDate, endDate) {
    try {
      return await prisma.usage_logs.findMany({
        where: {
          organizationId,
          created_at: {
            gte: startDate,
            lte: endDate,
          },
        },
        orderBy: { created_at: "desc" },
      });
    } catch (error) {
      console.error("Failed to fetch usage logs:", error);
      return [];
    }
  },

  /**
   * Get aggregated usage stats
   */
  getStats: async function (organizationId, startDate, endDate) {
    try {
      const stats = await prisma.usage_logs.groupBy({
        by: ["event_type"],
        where: {
          organizationId,
          created_at: {
            gte: startDate,
            lte: endDate,
          },
        },
        _count: true,
        _sum: {
          tokens_used: true,
          cost_cents: true,
        },
      });

      return stats;
    } catch (error) {
      console.error("Failed to get usage stats:", error);
      return [];
    }
  },
};

module.exports = { UsageLog };
```

### 5.2 Integrate Usage Logging

**Update chat endpoint** to log usage:

```javascript
// server/endpoints/chat.js
const { UsageLog } = require("../models/usageLog");

// After successful message send
await UsageLog.log({
  organizationId: workspace.organizationId,
  eventType: "message_sent",
  resourceType: "llm",
  resourceId: workspace.chatModel,
  userId: user?.id,
  workspaceId: workspace.id,
  tokensUsed: result.tokensUsed,
  costCents: estimateCost(result.tokensUsed, workspace.chatModel),
});
```

---

## 🧪 PHASE 6: TESTING & DEPLOYMENT {#phase-6-testing--deployment}

### 6.1 Testing Checklist

**Super Admin Functions:**
- [ ] Can view all organizations
- [ ] Can create new organization
- [ ] Can edit organization details
- [ ] Can suspend/unsuspend organization
- [ ] Can delete organization
- [ ] Can view all users across organizations
- [ ] Can view platform analytics
- [ ] Can view org-specific analytics
- [ ] Can create marketplace items
- [ ] Can view all purchases
- [ ] Can access billing portal

**Organization Admin Functions:**
- [ ] Can only see own organization
- [ ] Can manage users in own org
- [ ] Can purchase marketplace items
- [ ] Can view own org analytics
- [ ] Cannot access super admin features

**Security:**
- [ ] Super admin endpoints reject non-super-admin users
- [ ] Organization data is isolated
- [ ] Payment webhooks verified
- [ ] User cannot access other orgs' data

### 6.2 Deployment Steps

```bash
# 1. Run migrations
cd server
yarn prisma migrate deploy

# 2. Seed data (optional)
yarn prisma db seed

# 3. Set environment variables
# Add to .env:
# STRIPE_SECRET_KEY=
# STRIPE_WEBHOOK_SECRET=
# SUPABASE_URL=
# SUPABASE_SERVICE_ROLE_KEY=

# 4. Build frontend
cd ../frontend
yarn build

# 5. Start production server
cd ../server
yarn prod:server
```

---

## 📝 SUMMARY

### What's Included

✅ **Multi-Tenant Architecture**
- Organizations table with tier & subscription management
- User-to-org and workspace-to-org relationships
- Isolated data per organization

✅ **Super Admin Panel**
- Dashboard with platform-wide stats
- Organization management (CRUD)
- User management across all orgs
- Marketplace catalog management
- Purchase history & analytics
- Billing & subscription overview

✅ **Three-Tier User System**
- Super Admin (Tredy team) - full platform control
- Org Admin - manage own organization
- End Users - use the platform

✅ **Usage Tracking**
- Log every message, agent call, workflow
- Track costs per organization
- Billing-ready analytics

✅ **Marketplace**
- Create/edit skills, prompts, commands
- Per-organization purchases
- Installation scoping (org/workspace/user level)

---

## 🚀 NEXT STEPS

1. Review this plan and confirm architecture
2. Start with Phase 1 (Database Schema)
3. Implement Phase 2 (Backend Models)
4. Build Phase 3 (Frontend Dashboard)
5. Integrate Phases 4-6 (Billing, Analytics, Testing)

Ready to start implementation?
