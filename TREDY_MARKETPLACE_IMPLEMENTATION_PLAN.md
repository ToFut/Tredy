# 🎯 TREDY MARKETPLACE - COMPLETE IMPLEMENTATION PLAN

**Version**: 1.0
**Timeline**: 4-5 days
**Last Updated**: 2025-09-30

---

## 📋 TABLE OF CONTENTS

1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Phase 1: Database Setup](#phase-1-database-setup)
4. [Phase 2: Backend Models & API](#phase-2-backend-models--api)
5. [Phase 3: Payment Integration](#phase-3-payment-integration)
6. [Phase 4: Admin Panel](#phase-4-admin-panel)
7. [Phase 5: Customer Frontend](#phase-5-customer-frontend)
8. [Phase 6: Testing & Deployment](#phase-6-testing--deployment)
9. [Security Checklist](#security-checklist)
10. [Monitoring & Analytics](#monitoring--analytics)

---

## 🎯 OVERVIEW {#overview}

### Goal
Build production-ready marketplace for Tredy-branded paid/free skills, system prompts, and slash commands with:
- ✅ Stripe payment integration
- ✅ Supabase item storage
- ✅ Admin panel for item management
- ✅ Customer purchase & install flow
- ✅ **100% leveraging existing codebase**

### Key Principle: **LEVERAGE, DON'T DUPLICATE**

**Existing Infrastructure We'll Reuse:**
- `CommunityHub` model → Extend for Tredy items
- `ImportedPlugin` class → Reuse for agent skill installation
- `SlashCommandPresets` model → Reuse for slash command installation
- `Workspace` model → Reuse for system prompt installation
- Prisma patterns → Follow same model structure
- Existing middleware → Use `flexUserRoleValid`, `validatedRequest`
- Existing UI components → Reuse marketplace UI already built

---

## 🏗️ ARCHITECTURE {#architecture}

```
┌─────────────────────────────────────────────────────────┐
│                   DATA SOURCES                           │
├──────────────────────────┬──────────────────────────────┤
│  Community Hub API       │  Tredy Marketplace           │
│  (External - Free)       │  (Supabase - Free + Paid)    │
│  • Agent Skills          │  • Agent Skills              │
│  • System Prompts        │  • System Prompts            │
│  • Slash Commands        │  • Slash Commands            │
│  • Limit: 5 per category │  • Unlimited                 │
└──────────────────────────┴──────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────────────────────┐
│            CommunityHub.fetchAllMarketplaceItems()      │
│            (Merges both sources)                         │
└──────────────────┬──────────────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────────────┐
│                 BACKEND API                              │
│  /community-hub/explore (extended)                       │
│  /community-hub/import (extended)                        │
│  /community-hub/apply (extended)                         │
│  /tredy-admin/* (new)                                    │
│  /webhooks/stripe (new)                                  │
└──────────────────┬──────────────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────────────┐
│              INSTALLATION HANDLERS                       │
│  • ImportedPlugin.importCommunityItemFromUrl() [REUSE]  │
│  • SlashCommandPresets.create() [REUSE]                 │
│  • Workspace.update() [REUSE]                           │
└─────────────────────────────────────────────────────────┘
```

### Data Flow

**1. Admin Creates Item**
```
Admin UI → Upload → Validate → Stripe Product/Price →
Supabase Storage → Save to tredy_marketplace_items
```

**2. Customer Browses**
```
Frontend → Backend → Merge (Community + Tredy) →
Check Purchases → Display with Price Tags
```

**3. Customer Purchases**
```
Click "Buy" → Stripe Checkout → Payment → Webhook →
Record in tredy_marketplace_purchases → Enable Install Button
```

**4. Customer Installs**
```
Click "Install" → Verify Purchase →
Use EXISTING install logic → Record in marketplace_installations
```

---

## 📦 PHASE 1: DATABASE SETUP (4 hours) {#phase-1-database-setup}

### 1.1 Supabase Setup (1 hour)

**Steps:**
1. Create Supabase project at https://supabase.com/dashboard
2. Save credentials to `server/.env`:

```bash
# Add to server/.env
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_ANON_KEY=eyJhbG...
SUPABASE_SERVICE_ROLE_KEY=eyJhbG...
```

### 1.2 Create Supabase Tables (1 hour)

**Run in Supabase SQL Editor:**

```sql
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Marketplace items (source of truth for Tredy items)
CREATE TABLE tredy_marketplace_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  item_type TEXT NOT NULL CHECK (item_type IN ('agent-skill', 'system-prompt', 'slash-command')),
  category TEXT,
  tags TEXT[] DEFAULT '{}',
  price_cents INTEGER DEFAULT 0 CHECK (price_cents >= 0),
  stripe_price_id TEXT,
  stripe_product_id TEXT,
  download_url TEXT, -- For agent-skills (signed URL)
  content JSONB, -- For system-prompts/slash-commands
  active BOOLEAN DEFAULT true,
  version TEXT DEFAULT '1.0.0',
  author TEXT DEFAULT 'Tredy',
  downloads_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Purchase tracking
CREATE TABLE tredy_marketplace_purchases (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  item_id UUID REFERENCES tredy_marketplace_items(id) ON DELETE CASCADE,
  user_supabase_id TEXT NOT NULL,
  stripe_payment_intent_id TEXT UNIQUE,
  stripe_checkout_session_id TEXT UNIQUE,
  amount_paid_cents INTEGER,
  status TEXT DEFAULT 'completed' CHECK (status IN ('completed', 'refunded', 'failed')),
  purchased_at TIMESTAMPTZ DEFAULT NOW(),
  refunded_at TIMESTAMPTZ
);

-- File storage metadata
CREATE TABLE tredy_marketplace_files (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  item_id UUID REFERENCES tredy_marketplace_items(id) ON DELETE CASCADE,
  storage_path TEXT NOT NULL,
  file_size_bytes BIGINT,
  checksum TEXT,
  uploaded_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_items_type ON tredy_marketplace_items(item_type);
CREATE INDEX idx_items_active ON tredy_marketplace_items(active);
CREATE INDEX idx_items_type_active ON tredy_marketplace_items(item_type, active);
CREATE INDEX idx_purchases_user ON tredy_marketplace_purchases(user_supabase_id);
CREATE INDEX idx_purchases_item ON tredy_marketplace_purchases(item_id);
CREATE INDEX idx_purchases_user_item ON tredy_marketplace_purchases(user_supabase_id, item_id);

-- RLS Policies
ALTER TABLE tredy_marketplace_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE tredy_marketplace_purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE tredy_marketplace_files ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role full access items" ON tredy_marketplace_items
FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "Service role full access purchases" ON tredy_marketplace_purchases
FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "Service role full access files" ON tredy_marketplace_files
FOR ALL TO service_role USING (true) WITH CHECK (true);
```

### 1.3 Create Supabase Storage Bucket (30 min)

```sql
-- Run in Supabase SQL Editor
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'marketplace-files',
  'marketplace-files',
  false,
  52428800, -- 50MB
  ARRAY['application/zip']
);

-- RLS Policies for storage
CREATE POLICY "Service role upload" ON storage.objects
FOR INSERT TO service_role
WITH CHECK (bucket_id = 'marketplace-files');

CREATE POLICY "Service role read" ON storage.objects
FOR SELECT TO service_role
USING (bucket_id = 'marketplace-files');
```

### 1.4 Update Prisma Schema (1 hour)

**Following existing pattern from `slash_command_presets` model:**

```prisma
// Add to server/prisma/schema.prisma

// Add to users model
model users {
  // ... existing fields
  marketplace_installations marketplace_installations[]
}

// Add to workspaces model
model workspaces {
  // ... existing fields
  marketplace_installations marketplace_installations[]
}

// NEW MODEL - follows same pattern as slash_command_presets
model marketplace_installations {
  id              Int       @id @default(autoincrement())
  hubId           String    // UUID from Supabase
  itemType        String    // 'agent-skill', 'system-prompt', 'slash-command'
  workspaceId     Int?      // NULL for user-level
  userId          Int?      // NULL for workspace-level
  active          Boolean   @default(true)
  installedAt     DateTime  @default(now())
  lastUsedAt      DateTime?

  workspace       workspaces? @relation(fields: [workspaceId], references: [id], onDelete: Cascade)
  user            users?      @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([hubId, workspaceId, userId])
  @@index([workspaceId])
  @@index([userId])
  @@index([hubId])
}
```

**Run migration:**
```bash
cd server
yarn prisma migrate dev --name add_marketplace_installations
yarn prisma generate
```

### 1.5 Update User Roles (30 min)

**Add `tredy_admin` role following existing pattern:**

```javascript
// server/utils/middleware/multiUserProtected.js
const ROLES = {
  all: "<all>",
  admin: "admin",
  manager: "manager",
  default: "default",
  tredy_admin: "tredy_admin", // ADD THIS
};
```

```javascript
// server/models/user.js (line 40)
const VALID_ROLES = ["default", "admin", "manager", "tredy_admin"];
```

---

## 🔧 PHASE 2: BACKEND MODELS & API (8 hours) {#phase-2-backend-models--api}

### 2.1 Create MarketplaceInstallation Model (1 hour)

**Follow existing pattern from `SlashCommandPresets` model:**

**File**: `server/models/marketplaceInstallation.js`

```javascript
const prisma = require("../utils/prisma");

const MarketplaceInstallation = {
  // Following SlashCommandPresets pattern

  get: async function (clause = {}) {
    try {
      const installation = await prisma.marketplace_installations.findFirst({
        where: clause,
      });
      return installation || null;
    } catch (error) {
      console.error(error.message);
      return null;
    }
  },

  where: async function (clause = {}, limit) {
    try {
      const installations = await prisma.marketplace_installations.findMany({
        where: clause,
        take: limit || undefined,
      });
      return installations;
    } catch (error) {
      console.error(error.message);
      return [];
    }
  },

  create: async function (data = {}) {
    try {
      const existing = await this.get({
        hubId: data.hubId,
        workspaceId: data.workspaceId || null,
        userId: data.userId || null,
      });

      if (existing) {
        console.log("Installation already exists - will not create");
        return existing;
      }

      const installation = await prisma.marketplace_installations.create({
        data,
      });
      return installation;
    } catch (error) {
      console.error("Failed to create installation", error.message);
      return null;
    }
  },

  getByWorkspace: async function (workspaceId) {
    return await this.where({ workspaceId, active: true });
  },

  getByUser: async function (userId) {
    return await this.where({ userId, active: true });
  },

  toggle: async function (id, active) {
    try {
      const installation = await prisma.marketplace_installations.update({
        where: { id: Number(id) },
        data: { active },
      });
      return installation;
    } catch (error) {
      console.error("Failed to toggle installation", error.message);
      return null;
    }
  },

  delete: async function (id) {
    try {
      await prisma.marketplace_installations.delete({
        where: { id: Number(id) },
      });
      return true;
    } catch (error) {
      console.error("Failed to delete installation", error.message);
      return false;
    }
  },
};

module.exports = { MarketplaceInstallation };
```

### 2.2 Create TredyMarketplace Model (2 hours)

**File**: `server/models/tredyMarketplace.js`

```javascript
const { createClient } = require("@supabase/supabase-js");

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const TredyMarketplace = {
  /**
   * Fetch all active Tredy marketplace items
   */
  fetchItems: async function () {
    const { data, error } = await supabase
      .from("tredy_marketplace_items")
      .select("*")
      .eq("active", true)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching Tredy items:", error);
      return [];
    }
    return data;
  },

  /**
   * Check if user has purchased an item
   */
  hasPurchased: async function (itemId, userSupabaseId) {
    if (!userSupabaseId) return false;

    const { data } = await supabase
      .from("tredy_marketplace_purchases")
      .select("id")
      .eq("item_id", itemId)
      .eq("user_supabase_id", userSupabaseId)
      .eq("status", "completed")
      .maybeSingle();

    return !!data;
  },

  /**
   * Record purchase (called by Stripe webhook)
   */
  recordPurchase: async function (itemId, userSupabaseId, paymentData) {
    const { data, error } = await supabase
      .from("tredy_marketplace_purchases")
      .insert({
        item_id: itemId,
        user_supabase_id: userSupabaseId,
        stripe_payment_intent_id: paymentData.paymentIntentId,
        stripe_checkout_session_id: paymentData.checkoutSessionId,
        amount_paid_cents: paymentData.amountCents,
        status: "completed",
      })
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data;
  },

  /**
   * Get signed download URL (regenerate expired URLs)
   */
  getSignedUrl: async function (storagePath, expiresIn = 3600) {
    const { data, error } = await supabase.storage
      .from("marketplace-files")
      .createSignedUrl(storagePath, expiresIn);

    if (error) throw new Error(error.message);
    return data.signedUrl;
  },

  /**
   * Upload file to storage
   */
  uploadFile: async function (buffer, storagePath) {
    const { error } = await supabase.storage
      .from("marketplace-files")
      .upload(storagePath, buffer, {
        contentType: "application/zip",
        upsert: false,
      });

    if (error) throw new Error(error.message);
    return storagePath;
  },
};

module.exports = { TredyMarketplace };
```

### 2.3 Extend CommunityHub Model (2 hours)

**Add to**: `server/models/communityHub.js`

```javascript
// Add at top
const { TredyMarketplace } = require("./tredyMarketplace");

// Add new method (EXTENDS existing, doesn't replace)
CommunityHub.fetchAllMarketplaceItems = async function (userSupabaseId = null) {
  // Fetch from both sources in parallel
  const [communityItems, tredyItems] = await Promise.all([
    this.fetchExploreItems({ limit: 1000 }),
    TredyMarketplace.fetchItems(),
  ]);

  // Format Tredy items to match Community Hub structure
  const formattedTredyItems = await Promise.all(
    tredyItems.map(async (item) => {
      const isPaid = item.price_cents > 0;
      const hasPurchased = isPaid && userSupabaseId
        ? await TredyMarketplace.hasPurchased(item.id, userSupabaseId)
        : true;

      return {
        id: item.id,
        name: item.name,
        description: item.description,
        itemType: item.item_type,
        category: item.category,
        tags: item.tags || [],
        price: item.price_cents,
        priceDollars: (item.price_cents / 100).toFixed(2),
        isPaid,
        canInstall: hasPurchased,
        source: "tredy", // Mark as Tredy item
        version: item.version,
        author: item.author,
        downloadsCount: item.downloads_count,
        // For agent-skills
        manifest: item.item_type === "agent-skill"
          ? { files: [{ name: "plugin.json" }] }
          : undefined,
        // For system-prompts/slash-commands
        prompt: item.content?.prompt,
        command: item.content?.command,
        // Storage path for regenerating signed URLs
        storagePath: item.content?.storage_path,
      };
    })
  );

  // Categorize by type
  const agentSkills = formattedTredyItems.filter(i => i.itemType === "agent-skill");
  const systemPrompts = formattedTredyItems.filter(i => i.itemType === "system-prompt");
  const slashCommands = formattedTredyItems.filter(i => i.itemType === "slash-command");

  // Merge with Community Hub items
  return {
    agentSkills: {
      items: [...communityItems.agentSkills.items, ...agentSkills],
      hasMore: false,
      totalCount: communityItems.agentSkills.totalCount + agentSkills.length,
    },
    systemPrompts: {
      items: [...communityItems.systemPrompts.items, ...systemPrompts],
      hasMore: false,
      totalCount: communityItems.systemPrompts.totalCount + systemPrompts.length,
    },
    slashCommands: {
      items: [...communityItems.slashCommands.items, ...slashCommands],
      hasMore: false,
      totalCount: communityItems.slashCommands.totalCount + slashCommands.length,
    },
  };
};
```

### 2.4 Create Admin Endpoints (3 hours)

**File**: `server/endpoints/tredyAdmin.js`

```javascript
const { createClient } = require("@supabase/supabase-js");
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
const multer = require("multer");
const AdmZip = require("adm-zip");
const crypto = require("crypto");
const { validatedRequest } = require("../utils/middleware/validatedRequest");
const { flexUserRoleValid, ROLES } = require("../utils/middleware/multiUserProtected");
const { TredyMarketplace } = require("../models/tredyMarketplace");
const { reqBody } = require("../utils/http");

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === "application/zip") {
      cb(null, true);
    } else {
      cb(new Error("Only ZIP files allowed"));
    }
  },
});

function tredyAdminEndpoints(app) {
  if (!app) return;

  // CREATE AGENT SKILL (with ZIP upload)
  app.post(
    "/tredy-admin/marketplace/create-skill",
    [validatedRequest, flexUserRoleValid(["tredy_admin"]), upload.single("skillZip")],
    async (req, res) => {
      try {
        const { name, description, category, tags, priceCents } = req.body;
        const zipFile = req.file;

        if (!zipFile) throw new Error("No ZIP file uploaded");

        // Validate ZIP structure
        const zip = new AdmZip(zipFile.buffer);
        const entries = zip.getEntries();
        const hasPluginJson = entries.some(e => e.entryName === "plugin.json");
        const hasHandler = entries.some(e => e.entryName === "handler.js");

        if (!hasPluginJson || !hasHandler) {
          throw new Error("ZIP must contain plugin.json and handler.js");
        }

        // Parse plugin.json
        const pluginJsonEntry = zip.getEntry("plugin.json");
        const pluginJson = JSON.parse(pluginJsonEntry.getData().toString());

        // Create Stripe product/price if paid
        let stripePriceId = null;
        let stripeProductId = null;
        if (parseInt(priceCents) > 0) {
          const product = await stripe.products.create({
            name,
            description,
            metadata: { item_type: "agent-skill", category },
          });
          stripeProductId = product.id;

          const price = await stripe.prices.create({
            product: product.id,
            unit_amount: parseInt(priceCents),
            currency: "usd",
          });
          stripePriceId = price.id;
        }

        // Upload to Supabase Storage
        const fileHash = crypto.createHash("sha256").update(zipFile.buffer).digest("hex");
        const storagePath = `marketplace-skills/${fileHash}.zip`;

        await TredyMarketplace.uploadFile(zipFile.buffer, storagePath);

        // Generate signed URL
        const signedUrl = await TredyMarketplace.getSignedUrl(storagePath, 604800); // 7 days

        // Save to Supabase database
        const supabase = createClient(
          process.env.SUPABASE_URL,
          process.env.SUPABASE_SERVICE_ROLE_KEY
        );

        const { data: item, error } = await supabase
          .from("tredy_marketplace_items")
          .insert({
            name,
            description,
            item_type: "agent-skill",
            category,
            tags: tags ? tags.split(",").map(t => t.trim()) : [],
            price_cents: parseInt(priceCents) || 0,
            stripe_price_id: stripePriceId,
            stripe_product_id: stripeProductId,
            download_url: signedUrl,
            content: {
              manifest: { files: [{ name: "plugin.json" }, { name: "handler.js" }] },
              hubId: pluginJson.hubId || crypto.randomUUID(),
              storage_path: storagePath,
            },
            active: true,
          })
          .select()
          .single();

        if (error) throw error;

        // Track file metadata
        await supabase.from("tredy_marketplace_files").insert({
          item_id: item.id,
          storage_path: storagePath,
          file_size_bytes: zipFile.size,
          checksum: fileHash,
        });

        res.status(200).json({ success: true, item });
      } catch (error) {
        console.error("Failed to create skill:", error);
        res.status(500).json({ success: false, error: error.message });
      }
    }
  );

  // CREATE SYSTEM PROMPT / SLASH COMMAND
  app.post(
    "/tredy-admin/marketplace/create-item",
    [validatedRequest, flexUserRoleValid(["tredy_admin"])],
    async (req, res) => {
      try {
        const { name, description, category, tags, priceCents, itemType, content } = reqBody(req);

        if (!["system-prompt", "slash-command"].includes(itemType)) {
          throw new Error("Invalid item type");
        }

        // Create Stripe product/price if paid
        let stripePriceId = null;
        let stripeProductId = null;
        if (parseInt(priceCents) > 0) {
          const product = await stripe.products.create({
            name,
            description,
            metadata: { item_type: itemType },
          });
          stripeProductId = product.id;

          const price = await stripe.prices.create({
            product: product.id,
            unit_amount: parseInt(priceCents),
            currency: "usd",
          });
          stripePriceId = price.id;
        }

        const supabase = createClient(
          process.env.SUPABASE_URL,
          process.env.SUPABASE_SERVICE_ROLE_KEY
        );

        const { data: item, error } = await supabase
          .from("tredy_marketplace_items")
          .insert({
            name,
            description,
            item_type: itemType,
            category,
            tags: tags ? tags.split(",").map(t => t.trim()) : [],
            price_cents: parseInt(priceCents) || 0,
            stripe_price_id: stripePriceId,
            stripe_product_id: stripeProductId,
            content,
            active: true,
          })
          .select()
          .single();

        if (error) throw error;

        res.status(200).json({ success: true, item });
      } catch (error) {
        console.error("Failed to create item:", error);
        res.status(500).json({ success: false, error: error.message });
      }
    }
  );

  // LIST ALL ITEMS (admin view)
  app.get(
    "/tredy-admin/marketplace/items",
    [validatedRequest, flexUserRoleValid(["tredy_admin"])],
    async (req, res) => {
      try {
        const items = await TredyMarketplace.fetchItems();
        res.status(200).json({ success: true, items });
      } catch (error) {
        res.status(500).json({ success: false, error: error.message });
      }
    }
  );

  // UPDATE ITEM
  app.patch(
    "/tredy-admin/marketplace/items/:id",
    [validatedRequest, flexUserRoleValid(["tredy_admin"])],
    async (req, res) => {
      try {
        const { id } = req.params;
        const updates = reqBody(req);

        const supabase = createClient(
          process.env.SUPABASE_URL,
          process.env.SUPABASE_SERVICE_ROLE_KEY
        );

        const { data: item, error } = await supabase
          .from("tredy_marketplace_items")
          .update(updates)
          .eq("id", id)
          .select()
          .single();

        if (error) throw error;

        res.status(200).json({ success: true, item });
      } catch (error) {
        res.status(500).json({ success: false, error: error.message });
      }
    }
  );

  // SOFT DELETE ITEM
  app.delete(
    "/tredy-admin/marketplace/items/:id",
    [validatedRequest, flexUserRoleValid(["tredy_admin"])],
    async (req, res) => {
      try {
        const { id } = req.params;

        const supabase = createClient(
          process.env.SUPABASE_URL,
          process.env.SUPABASE_SERVICE_ROLE_KEY
        );

        const { error } = await supabase
          .from("tredy_marketplace_items")
          .update({ active: false })
          .eq("id", id);

        if (error) throw error;

        res.status(200).json({ success: true });
      } catch (error) {
        res.status(500).json({ success: false, error: error.message });
      }
    }
  );

  // ANALYTICS
  app.get(
    "/tredy-admin/analytics/overview",
    [validatedRequest, flexUserRoleValid(["tredy_admin"])],
    async (req, res) => {
      try {
        const supabase = createClient(
          process.env.SUPABASE_URL,
          process.env.SUPABASE_SERVICE_ROLE_KEY
        );

        const { data: purchases, error } = await supabase
          .from("tredy_marketplace_purchases")
          .select(`
            *,
            tredy_marketplace_items (name, price_cents, item_type)
          `)
          .order("purchased_at", { ascending: false });

        if (error) throw error;

        const stats = {
          totalPurchases: purchases.length,
          totalRevenue: purchases.reduce((sum, p) =>
            sum + (p.tredy_marketplace_items?.price_cents || 0), 0
          ) / 100,
          byItemType: {},
        };

        purchases.forEach(p => {
          const type = p.tredy_marketplace_items?.item_type;
          if (!stats.byItemType[type]) {
            stats.byItemType[type] = { count: 0, revenue: 0 };
          }
          stats.byItemType[type].count++;
          stats.byItemType[type].revenue += (p.tredy_marketplace_items?.price_cents || 0) / 100;
        });

        res.status(200).json({ success: true, stats, recentPurchases: purchases.slice(0, 50) });
      } catch (error) {
        res.status(500).json({ success: false, error: error.message });
      }
    }
  );
}

module.exports = { tredyAdminEndpoints };
```

**Register endpoints** in `server/index.js`:

```javascript
const { tredyAdminEndpoints } = require("./endpoints/tredyAdmin");
// ... after other endpoints
tredyAdminEndpoints(app);
```

---

## 💳 PHASE 3: PAYMENT INTEGRATION (4 hours) {#phase-3-payment-integration}

### 3.1 Stripe Setup (30 min)

```bash
# Add to server/.env
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

```bash
# Install Stripe
cd server
npm install stripe
```

### 3.2 Checkout Endpoint (1 hour)

**Add to** `server/endpoints/communityHub.js`:

```javascript
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
const { createClient } = require("@supabase/supabase-js");

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

app.post(
  "/community-hub/create-checkout",
  [validatedRequest, flexUserRoleValid([ROLES.admin])],
  async (request, response) => {
    try {
      const { itemId } = reqBody(request);
      const userId = response.locals?.user?.id;
      const user = await prisma.users.findUnique({ where: { id: userId } });

      if (!user.supabase_id) {
        throw new Error("User not linked to Supabase");
      }

      // Fetch item from Supabase
      const { data: item, error } = await supabase
        .from("tredy_marketplace_items")
        .select("*")
        .eq("id", itemId)
        .single();

      if (error || !item || !item.stripe_price_id) {
        throw new Error("Item not found or not purchasable");
      }

      // Create Stripe Checkout Session
      const session = await stripe.checkout.sessions.create({
        mode: "payment",
        payment_method_types: ["card"],
        line_items: [{
          price: item.stripe_price_id,
          quantity: 1,
        }],
        success_url: `${process.env.SERVER_URL}/settings/community-hub?purchase=success`,
        cancel_url: `${process.env.SERVER_URL}/settings/community-hub?purchase=cancelled`,
        metadata: {
          item_id: itemId,
          user_supabase_id: user.supabase_id,
          user_id: userId.toString(),
        },
      });

      response.status(200).json({ success: true, checkoutUrl: session.url });
    } catch (error) {
      console.error("Checkout error:", error);
      response.status(500).json({ success: false, error: error.message });
    }
  }
);
```

### 3.3 Stripe Webhook Handler (2 hours)

**Add to** `server/endpoints/communityHub.js`:

```javascript
const express = require("express");

app.post(
  "/webhooks/stripe",
  express.raw({ type: "application/json" }),
  async (request, response) => {
    const sig = request.headers["stripe-signature"];
    let event;

    try {
      event = stripe.webhooks.constructEvent(
        request.body,
        sig,
        process.env.STRIPE_WEBHOOK_SECRET
      );
    } catch (err) {
      console.error("Webhook signature verification failed:", err.message);
      return response.status(400).send(`Webhook Error: ${err.message}`);
    }

    // Handle checkout.session.completed
    if (event.type === "checkout.session.completed") {
      const session = event.data.object;

      try {
        const { TredyMarketplace } = require("../models/tredyMarketplace");

        // Record purchase in Supabase
        await TredyMarketplace.recordPurchase(
          session.metadata.item_id,
          session.metadata.user_supabase_id,
          {
            paymentIntentId: session.payment_intent,
            checkoutSessionId: session.id,
            amountCents: session.amount_total,
          }
        );

        console.log("Purchase recorded:", {
          item_id: session.metadata.item_id,
          user: session.metadata.user_supabase_id,
        });
      } catch (error) {
        console.error("Failed to record purchase:", error);
        // Don't return error - payment succeeded
      }
    }

    response.json({ received: true });
  }
);
```

### 3.4 Update Explore Endpoint (30 min)

**Modify** `server/endpoints/communityHub.js`:

```javascript
app.get(
  "/community-hub/explore",
  [validatedRequest, flexUserRoleValid([ROLES.admin])],
  async (request, response) => {
    try {
      const userId = response.locals?.user?.id;
      const user = userId
        ? await prisma.users.findUnique({ where: { id: userId } })
        : null;

      // Use extended method that merges both sources
      const allItems = await CommunityHub.fetchAllMarketplaceItems(
        user?.supabase_id || null
      );

      response.status(200).json({ success: true, result: allItems });
    } catch (error) {
      console.error(error);
      response.status(500).json({
        success: false,
        result: null,
        error: error.message,
      });
    }
  }
);
```

### 3.5 Update Install Endpoint (30 min)

**Modify** `server/endpoints/communityHub.js`:

```javascript
app.post(
  "/community-hub/import",
  [
    validatedRequest,
    flexUserRoleValid([ROLES.admin]),
    communityHubItem,
    communityHubDownloadsEnabled,
  ],
  async (_, response) => {
    try {
      const item = response.locals.bundleItem;
      const userId = response.locals?.user?.id;

      // Check if Tredy item and if user has purchased it
      if (item.source === "tredy" && item.isPaid && !item.canInstall) {
        return response.status(403).json({
          success: false,
          error: "Item not purchased. Please purchase before installing.",
        });
      }

      // Regenerate signed URL if Tredy item
      let downloadUrl = response.locals.bundleUrl;
      if (item.source === "tredy" && item.storagePath) {
        const { TredyMarketplace } = require("../models/tredyMarketplace");
        downloadUrl = await TredyMarketplace.getSignedUrl(item.storagePath, 3600);
      }

      // Use EXISTING install logic
      const { error: importError } = await CommunityHub.importBundleItem({
        url: downloadUrl,
        item: item,
      });
      if (importError) throw new Error(importError);

      // Record installation
      const { MarketplaceInstallation } = require("../models/marketplaceInstallation");
      const { workspaceId } = reqBody(_);

      await MarketplaceInstallation.create({
        hubId: item.id,
        itemType: item.itemType,
        workspaceId: workspaceId || null,
        userId: item.itemType === "slash-command" ? userId : null,
      });

      // Existing telemetry
      await Telemetry.sendTelemetry("community_hub_import", {
        itemType: item.itemType,
        visibility: item.source === "tredy" ? "tredy" : item.visibility,
      });

      response.status(200).json({ success: true, error: null });
    } catch (error) {
      console.error(error);
      response.status(500).json({
        success: false,
        error: error.message,
      });
    }
  }
);
```

---

## 🎨 PHASE 4: ADMIN PANEL (6 hours) {#phase-4-admin-panel}

### 4.1 Create Admin API Client (30 min)

**File**: `frontend/src/models/tredyAdmin.js`

```javascript
import { API_BASE } from "@/utils/constants";
import { baseHeaders } from "@/utils/request";

const TredyAdmin = {
  createSkill: async (formData) => {
    return await fetch(`${API_BASE}/tredy-admin/marketplace/create-skill`, {
      method: "POST",
      headers: {
        ...baseHeaders(),
        // Don't set Content-Type - browser will set multipart/form-data
      },
      body: formData, // FormData object
    })
      .then((res) => res.json())
      .catch((e) => ({
        success: false,
        error: e.message,
      }));
  },

  createItem: async (data) => {
    return await fetch(`${API_BASE}/tredy-admin/marketplace/create-item`, {
      method: "POST",
      headers: baseHeaders(),
      body: JSON.stringify(data),
    })
      .then((res) => res.json())
      .catch((e) => ({
        success: false,
        error: e.message,
      }));
  },

  listItems: async () => {
    return await fetch(`${API_BASE}/tredy-admin/marketplace/items`, {
      method: "GET",
      headers: baseHeaders(),
    })
      .then((res) => res.json())
      .catch((e) => ({
        success: false,
        error: e.message,
      }));
  },

  updateItem: async (itemId, updates) => {
    return await fetch(`${API_BASE}/tredy-admin/marketplace/items/${itemId}`, {
      method: "PATCH",
      headers: baseHeaders(),
      body: JSON.stringify(updates),
    })
      .then((res) => res.json())
      .catch((e) => ({
        success: false,
        error: e.message,
      }));
  },

  deleteItem: async (itemId) => {
    return await fetch(`${API_BASE}/tredy-admin/marketplace/items/${itemId}`, {
      method: "DELETE",
      headers: baseHeaders(),
    })
      .then((res) => res.json())
      .catch((e) => ({
        success: false,
        error: e.message,
      }));
  },

  getAnalytics: async () => {
    return await fetch(`${API_BASE}/tredy-admin/analytics/overview`, {
      method: "GET",
      headers: baseHeaders(),
    })
      .then((res) => res.json())
      .catch((e) => ({
        success: false,
        error: e.message,
      }));
  },
};

export default TredyAdmin;
```

### 4.2 Create Admin Pages (5 hours)

**Files to create:**
- `frontend/src/pages/Admin/TredyMarketplace/index.jsx` - Main admin page
- `frontend/src/pages/Admin/TredyMarketplace/CreateSkill.jsx` - Create agent skill
- `frontend/src/pages/Admin/TredyMarketplace/CreateItem.jsx` - Create prompt/command
- `frontend/src/pages/Admin/TredyMarketplace/ItemsList.jsx` - Manage items
- `frontend/src/pages/Admin/TredyMarketplace/Analytics.jsx` - View analytics

**Add route** to `frontend/src/App.jsx`:

```javascript
import TredyMarketplaceAdmin from "@/pages/Admin/TredyMarketplace";

// Add to routes
<Route path="/admin/tredy-marketplace" element={<TredyMarketplaceAdmin />} />
```

**Add to paths** in `frontend/src/utils/paths.js`:

```javascript
tredyMarketplace: () => "/admin/tredy-marketplace",
```

---

## 🛍️ PHASE 5: CUSTOMER FRONTEND (4 hours) {#phase-5-customer-frontend}

### 5.1 Update Existing Marketplace UI (2 hours)

**Modify**: `frontend/src/pages/GeneralSettings/CommunityHub/MarketplaceView/index.jsx`

**Key changes:**
1. Show price badges on items
2. Add "Buy" button for paid items
3. Disable "Install" until purchased
4. Handle purchase flow

```javascript
// In SkillCard component
{item.isPaid && (
  <div className="text-primary-button font-bold">
    ${item.priceDollars}
  </div>
)}

{item.isPaid && !item.canInstall ? (
  <button onClick={() => handlePurchase(item)}>
    Buy Now - ${item.priceDollars}
  </button>
) : (
  <button onClick={() => handleInstall(item)}>
    {isInstalled ? "Installed" : "Install"}
  </button>
)}
```

### 5.2 Add Purchase Flow (1 hour)

**Add to** `frontend/src/models/communityHub.js`:

```javascript
createCheckout: async (itemId) => {
  return await fetch(`${API_BASE}/community-hub/create-checkout`, {
    method: "POST",
    headers: baseHeaders(),
    body: JSON.stringify({ itemId }),
  })
    .then((res) => res.json())
    .catch((e) => ({
      success: false,
      error: e.message,
    }));
},
```

**Add handler** in marketplace component:

```javascript
const handlePurchase = async (item) => {
  try {
    const { success, checkoutUrl, error } = await CommunityHub.createCheckout(item.id);

    if (!success) throw new Error(error);

    // Redirect to Stripe Checkout
    window.location.href = checkoutUrl;
  } catch (error) {
    alert("Purchase failed: " + error.message);
  }
};
```

### 5.3 Handle Purchase Success (1 hour)

**Add to marketplace component:**

```javascript
useEffect(() => {
  // Check for purchase success in URL
  const urlParams = new URLSearchParams(window.location.search);
  const purchaseStatus = urlParams.get("purchase");

  if (purchaseStatus === "success") {
    // Show success message
    alert("Purchase successful! You can now install the item.");
    // Reload data to reflect purchase
    loadData();
    // Clean URL
    window.history.replaceState({}, document.title, window.location.pathname);
  }
}, []);
```

---

## 🧪 PHASE 6: TESTING & DEPLOYMENT (4 hours) {#phase-6-testing--deployment}

### 6.1 Local Testing (2 hours)

**Test Checklist:**
- [ ] Admin can create free agent skill
- [ ] Admin can create paid system prompt
- [ ] Admin can create paid slash command
- [ ] Customer sees both Community + Tredy items
- [ ] Free items installable immediately
- [ ] Paid items show "Buy" button
- [ ] Stripe checkout flow works
- [ ] Webhook records purchase
- [ ] After purchase, "Install" button enabled
- [ ] Installation works using existing logic
- [ ] Installed items tracked in marketplace_installations

**Test Commands:**
```bash
# 1. Start services
yarn dev:server
yarn dev:frontend

# 2. Create tredy_admin user
sqlite3 server/storage/anythingllm.db
UPDATE users SET role = 'tredy_admin' WHERE id = 1;

# 3. Test Stripe webhook locally
stripe listen --forward-to localhost:3001/webhooks/stripe
```

### 6.2 Stripe Configuration (1 hour)

**Steps:**
1. Go to Stripe Dashboard → Developers → Webhooks
2. Add endpoint: `https://your-domain.com/webhooks/stripe`
3. Select events: `checkout.session.completed`
4. Copy webhook secret to `.env`

### 6.3 Production Deployment (1 hour)

**Deployment checklist:**
- [ ] Run Prisma migration in production
- [ ] Add environment variables to production
- [ ] Configure Stripe webhook for production URL
- [ ] Test full flow in production
- [ ] Monitor error logs

---

## 🔒 SECURITY CHECKLIST {#security-checklist}

### Essential Security Measures

- [ ] **Row Level Security (RLS)** enabled on Supabase tables
- [ ] **Stripe webhook signature** verification
- [ ] **File upload validation** (ZIP structure, size limit)
- [ ] **Purchase verification** before allowing install
- [ ] **Signed URLs** for downloads (expire after 1 hour)
- [ ] **Role-based access** for admin endpoints
- [ ] **Rate limiting** on payment endpoints
- [ ] **SQL injection prevention** (using Prisma/Supabase)
- [ ] **XSS prevention** (sanitize user inputs)

---

## 📊 MONITORING & ANALYTICS {#monitoring--analytics}

### Key Metrics to Track

1. **Sales Metrics**
   - Total revenue
   - Revenue by item type
   - Conversion rate (browse → purchase)

2. **User Behavior**
   - Most popular items
   - Installation success rate
   - Time from purchase to install

3. **Technical Health**
   - Webhook success rate
   - Download success rate
   - API response times

---

## 📝 INSTALLATION INSTRUCTIONS

### Prerequisites

```bash
# 1. Node.js 18+
node --version

# 2. Supabase account
# Create at https://supabase.com

# 3. Stripe account
# Create at https://stripe.com
```

### Setup Steps

```bash
# 1. Install dependencies
cd server
npm install multer adm-zip stripe @supabase/supabase-js

# 2. Configure environment
cp server/.env.example server/.env
# Add Supabase and Stripe keys

# 3. Run Supabase SQL scripts
# Copy SQL from Phase 1 sections

# 4. Update Prisma schema
# Add marketplace_installations model

# 5. Run migration
cd server
yarn prisma migrate dev --name add_marketplace_installations
yarn prisma generate

# 6. Update code files
# Add new models and endpoints

# 7. Create admin user
sqlite3 server/storage/anythingllm.db
UPDATE users SET role = 'tredy_admin' WHERE id = YOUR_USER_ID;

# 8. Start services
yarn dev:server
yarn dev:frontend

# 9. Test Stripe webhooks locally
stripe listen --forward-to localhost:3001/webhooks/stripe
```

---

## 🎉 SUCCESS CRITERIA

The implementation is complete when:

✅ Admin can create paid/free marketplace items
✅ Items appear in marketplace alongside Community Hub items
✅ Customers can purchase paid items via Stripe
✅ Purchases are tracked in Supabase
✅ Customers can install purchased items
✅ Installations use existing infrastructure (ImportedPlugin, etc.)
✅ All tests pass
✅ Production deployment successful

---

## 📞 SUPPORT

**Questions?** Review:
- Existing `CommunityHub` model patterns
- Existing `SlashCommandPresets` model patterns
- Existing middleware in `multiUserProtected.js`
- Prisma documentation: https://www.prisma.io/docs

**Key Files to Reference:**
- `server/models/communityHub.js` - Existing marketplace logic
- `server/utils/agents/imported.js` - Plugin installation
- `server/models/slashCommandsPresets.js` - Database pattern
- `server/endpoints/communityHub.js` - API pattern

---

**End of Implementation Plan**
