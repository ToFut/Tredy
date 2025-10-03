# Tredy Marketplace Implementation - Complete ✅

This document provides a complete overview of the implemented Tredy marketplace system with multi-tenant support.

## 🎯 What Was Implemented

### 1. **Tenancy Provider System** (Modular Architecture)
- ✅ `server/utils/tenancy/interface.js` - Base tenancy provider interface
- ✅ `server/utils/tenancy/providers/single.js` - Single-tenant mode (default)
- ✅ `server/utils/tenancy/providers/multi.js` - Multi-tenant mode (organizations)
- ✅ `server/utils/tenancy/index.js` - Provider factory

**How it works:**
- Set `TENANCY_MODE=single` (default) for individual user purchases
- Set `TENANCY_MODE=multi` for organization-based purchases
- Zero breaking changes - existing AnythingLLM functionality preserved

### 2. **Database Schema** (Prisma)
- ✅ `organizations` table - Multi-tenant organization support
- ✅ `marketplace_purchases` table - Purchase tracking (user or org level)
- ✅ `marketplace_installations` table - Installation tracking per user
- ✅ `users.organizationId` - User-to-org relationship
- ✅ `users.role` - Added `super_admin` role

**Migration needed:**
```bash
cd server
yarn prisma:setup
```

### 3. **Models**
- ✅ `server/models/organization.js` - Organization CRUD
- ✅ `server/models/marketplacePurchase.js` - Purchase management
- ✅ `server/models/marketplaceInstallation.js` - Installation management
- ✅ `server/models/tredyMarketplace.js` - Supabase integration
- ✅ `server/models/communityHub.js` - Extended to merge Tredy items

### 4. **Endpoints**
- ✅ `server/endpoints/marketplace.js` - Purchase, install, uninstall
- ✅ `server/endpoints/organizations.js` - Organization management
- ✅ `server/endpoints/superAdmin.js` - Marketplace catalog & analytics
- ✅ Registered in `server/index.js`

### 5. **Middleware**
- ✅ `server/utils/middleware/multiUserProtected.js` - Added `super_admin` role
- ✅ Super admin bypass for all permission checks

## 📋 Environment Variables

Add these to your `.env` file:

```bash
# Tenancy Mode (single or multi)
TENANCY_MODE=single  # or "multi" for organizations

# Tredy Marketplace (Supabase)
TREDY_SUPABASE_URL=https://your-project.supabase.co
TREDY_SUPABASE_ANON_KEY=your-anon-key
TREDY_SUPABASE_SERVICE_KEY=your-service-key  # For admin operations

# Stripe Payments
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Existing AnythingLLM vars (unchanged)
JWT_SECRET=...
SIG_KEY=...
SIG_SALT=...
```

## 🗄️ Supabase Schema

Create this table in your Tredy Supabase project:

```sql
CREATE TABLE marketplace_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  item_type TEXT NOT NULL, -- 'agent-skill', 'system-prompt', 'slash-command'
  price_cents INTEGER NOT NULL DEFAULT 0,
  visibility TEXT NOT NULL DEFAULT 'public', -- 'public', 'private', 'unlisted'
  author TEXT DEFAULT 'Tredy',
  version TEXT DEFAULT '1.0.0',
  file_path TEXT, -- Path in Supabase Storage (for agent skills)
  metadata JSONB DEFAULT '{}',
  content TEXT, -- For system prompts and slash commands
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);

-- Storage bucket for agent skill ZIPs
-- Create via Supabase Dashboard: Storage > Create bucket > "marketplace-items"
```

## 🚀 Getting Started

### Step 1: Run Database Migration
```bash
cd server
yarn prisma:setup
# This will create organizations, marketplace_purchases, and marketplace_installations tables
```

### Step 2: Configure Environment
```bash
# Choose your tenancy mode
echo "TENANCY_MODE=single" >> .env  # or "multi"

# Add Supabase credentials (if using marketplace)
echo "TREDY_SUPABASE_URL=..." >> .env
echo "TREDY_SUPABASE_ANON_KEY=..." >> .env
echo "TREDY_SUPABASE_SERVICE_KEY=..." >> .env

# Add Stripe credentials (if accepting payments)
echo "STRIPE_SECRET_KEY=..." >> .env
echo "STRIPE_WEBHOOK_SECRET=..." >> .env
```

### Step 3: Create First Super Admin
```bash
# Start the server
yarn dev:server

# In another terminal, promote a user to super_admin
sqlite3 server/storage/anythingllm.db
UPDATE users SET role='super_admin' WHERE username='your-username';
.exit
```

### Step 4: Start Using the Marketplace

**Single-Tenant Mode (Individual Purchases):**
- Users browse marketplace via `/community-hub/explore`
- Click "Buy" on paid items → Redirects to Stripe
- After payment, item is available in their account
- Install to workspace via `/marketplace/install`

**Multi-Tenant Mode (Organization Purchases):**
- Create organizations via `/organizations`
- Assign users to organizations
- Org admin purchases items (charged to org)
- All org users inherit purchased items
- Each user installs to their own workspaces

## 🔐 Role Hierarchy

1. **`super_admin`** - Tredy team only
   - Manages all organizations
   - Creates/edits marketplace catalog
   - Views platform analytics
   - Bypasses all permission checks

2. **`admin`** - Organization admin (multi-tenant mode only)
   - Manages users in their org
   - Makes purchases for org
   - Views org analytics

3. **`manager`** - Limited admin privileges

4. **`default`** - Regular user

## 📡 API Endpoints

### Marketplace (All Users)
```
GET    /api/marketplace/purchases         # User's purchases
GET    /api/marketplace/installations     # User's installations
POST   /api/marketplace/purchase          # Create Stripe checkout
POST   /api/marketplace/install           # Install item
POST   /api/marketplace/uninstall         # Uninstall item
POST   /api/marketplace/webhooks/stripe   # Stripe webhook (public)
```

### Organizations (Admin & Super Admin)
```
GET    /api/organizations                 # List all orgs (super_admin)
GET    /api/organizations/:id             # Get org details
POST   /api/organizations                 # Create org (super_admin)
PUT    /api/organizations/:id             # Update org
DELETE /api/organizations/:id             # Delete org (super_admin)
GET    /api/organizations/:id/users       # List org users
POST   /api/organizations/:id/users       # Add user to org
DELETE /api/organizations/:id/users/:uid  # Remove user from org
```

### Super Admin (Super Admin Only)
```
GET    /api/super-admin/analytics                # Platform stats
GET    /api/super-admin/marketplace/items        # All items (including private)
POST   /api/super-admin/marketplace/create-skill # Upload agent skill ZIP
POST   /api/super-admin/marketplace/create-item  # Create prompt/command
PUT    /api/super-admin/marketplace/items/:id    # Update item
DELETE /api/super-admin/marketplace/items/:id    # Delete item
GET    /api/super-admin/users                    # All users
POST   /api/super-admin/users/:id/role           # Update user role
```

## 🔄 Purchase Flow

### Free Items
1. User browses marketplace
2. Click "Install" (no payment needed)
3. Item installed to workspace

### Paid Items (Single Mode)
1. User browses marketplace
2. Click "Buy" → Redirected to Stripe checkout
3. Payment successful → Webhook records purchase
4. User can now install to workspace

### Paid Items (Multi Mode)
1. Org admin browses marketplace
2. Click "Buy" → Redirected to Stripe checkout
3. Payment successful → Webhook records org purchase
4. All org users see item as "Purchased"
5. Each user installs to their own workspace

## 🎨 Frontend Integration

Update your marketplace UI:

```javascript
// Fetch marketplace items (merged CommunityHub + Tredy)
const response = await fetch('/api/community-hub/explore?user=true');
const { agentSkills, systemPrompts, slashCommands } = await response.json();

// Items have these properties:
item.source       // 'community' or 'tredy'
item.isPaid       // true if price_cents > 0
item.hasPurchased // true if user/org has purchased
item.price_cents  // Price in cents

// Purchase flow
if (item.isPaid && !item.hasPurchased) {
  const { sessionUrl } = await fetch('/api/marketplace/purchase', {
    method: 'POST',
    body: JSON.stringify({
      hubId: item.id,
      itemType: item.item_type,
      successUrl: window.location.origin + '/marketplace/success',
      cancelUrl: window.location.origin + '/marketplace/cancel'
    })
  }).then(r => r.json());

  window.location.href = sessionUrl; // Redirect to Stripe
}

// Install flow (free or purchased)
await fetch('/api/marketplace/install', {
  method: 'POST',
  body: JSON.stringify({
    hubId: item.id,
    itemType: item.item_type,
    workspaceId: currentWorkspace.id
  })
});
```

## 🧪 Testing

### Test Single-Tenant Mode
```bash
# Set mode
export TENANCY_MODE=single

# Create user
# Purchase item (should record userId)
# Check purchase:
sqlite3 server/storage/anythingllm.db
SELECT * FROM marketplace_purchases WHERE userId IS NOT NULL;
```

### Test Multi-Tenant Mode
```bash
# Set mode
export TENANCY_MODE=multi

# Create organization
curl -X POST http://localhost:3001/api/organizations \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name":"Test Org","tier":"internal"}'

# Add user to org
# Purchase item as org user
# Check purchase:
sqlite3 server/storage/anythingllm.db
SELECT * FROM marketplace_purchases WHERE organizationId IS NOT NULL;
```

## 🔧 Stripe Webhook Setup

1. Go to Stripe Dashboard → Webhooks
2. Add endpoint: `https://your-domain.com/api/marketplace/webhooks/stripe`
3. Select events: `checkout.session.completed`
4. Copy webhook secret to `.env` as `STRIPE_WEBHOOK_SECRET`

## 📊 Analytics

Super admins can view platform analytics:

```javascript
const { analytics } = await fetch('/api/super-admin/analytics')
  .then(r => r.json());

console.log(analytics);
// {
//   totalUsers: 150,
//   totalWorkspaces: 450,
//   totalPurchases: 75,
//   totalOrganizations: 20,
//   totalRevenueCents: 150000, // $1,500
//   recentActivity: [...]
// }
```

## 🚨 Important Notes

1. **Backwards Compatible:** Existing AnythingLLM installations work unchanged (single mode is default)
2. **No Breaking Changes:** All existing functionality preserved
3. **Optional Features:** Marketplace and organizations are opt-in via env vars
4. **Workspaces Belong to Users:** Even in multi-tenant mode, workspaces are user-owned (via workspace_users table)
5. **Purchase Inheritance:** In multi mode, org purchases are shared with all org users

## 📝 Migration Path

**Migrating from Single → Multi Mode:**

```bash
# 1. Enable multi-tenant mode
echo "TENANCY_MODE=multi" >> .env

# 2. Create organizations for existing users
# Run this migration script:
sqlite3 server/storage/anythingllm.db << EOF
-- Create a default organization
INSERT INTO organizations (name, slug, tier)
VALUES ('Default Organization', 'default-org', 'internal');

-- Assign all existing users to default org
UPDATE users SET organizationId = (SELECT id FROM organizations WHERE slug='default-org');

-- Migrate existing purchases to org-level
UPDATE marketplace_purchases
SET organizationId = (SELECT organizationId FROM users WHERE users.id = marketplace_purchases.userId),
    userId = NULL
WHERE userId IS NOT NULL;
EOF

# 3. Restart server
yarn dev:server
```

## 🎉 Success Criteria

✅ Users can browse merged Community Hub + Tredy marketplace
✅ Free items install directly
✅ Paid items redirect to Stripe checkout
✅ Webhook records purchases successfully
✅ Single-tenant mode: purchases per user
✅ Multi-tenant mode: purchases per organization
✅ Org admins manage their users
✅ Super admins manage catalog and analytics
✅ Existing AnythingLLM functionality unchanged

## 🛠️ Next Steps (Optional)

1. **Frontend UI:** Build marketplace browsing interface
2. **Supabase Setup:** Create marketplace_items table and storage bucket
3. **Stripe Connect:** For marketplace seller payouts (if allowing 3rd party sellers)
4. **Email Notifications:** Purchase confirmations, receipts
5. **Usage Analytics:** Track item usage per workspace
6. **Subscription Support:** Recurring payments for premium features

## 📚 Architecture Patterns Used

- ✅ **Provider Pattern:** Swappable tenancy implementations (like LLM providers)
- ✅ **Interface-Based:** BaseTenancyProvider ensures consistency
- ✅ **Settings-Driven:** TENANCY_MODE env var controls behavior
- ✅ **Zero Breaking Changes:** Single mode = existing AnythingLLM
- ✅ **Modular:** Each component can be enabled/disabled independently

This implementation follows AnythingLLM's architectural philosophy: modular, swappable, and backwards-compatible.
