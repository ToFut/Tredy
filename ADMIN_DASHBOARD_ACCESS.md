# 🎯 How to Access the Admin Dashboard

## Quick Start

### Step 1: Start the Application
```bash
cd /Users/segevbin/anything-llm

# Terminal 1 - Start backend
yarn dev:server

# Terminal 2 - Start frontend
yarn dev:frontend
```

### Step 2: Access the UI
Open your browser and go to:
- **Main app**: http://localhost:3000
- **Login**: http://localhost:3000/login

### Step 3: Promote Yourself to Super Admin
```bash
# In a new terminal
sqlite3 /Users/segevbin/anything-llm/server/storage/anythingllm.db

# Find your user
SELECT id, username, role FROM users;

# Promote yourself to super_admin (change ID to match yours)
UPDATE users SET role='super_admin' WHERE id=1;

# Verify
SELECT id, username, role FROM users WHERE role='super_admin';

# Exit
.exit
```

### Step 4: Access Admin Dashboard

After logging in, click on **Settings** (gear icon in sidebar), then:

**Community Hub → 🔐 Super Admin**

Or go directly to:
```
http://localhost:3000/settings/super-admin
```

## 📍 All Admin Pages

### Existing AnythingLLM Admin Pages:
- **Settings Home**: http://localhost:3000/settings
- **Users Management**: http://localhost:3000/settings/users
- **Workspaces**: http://localhost:3000/settings/workspaces
- **Invites**: http://localhost:3000/settings/invites
- **Event Logs**: http://localhost:3000/settings/event-logs
- **Agent Skills**: http://localhost:3000/settings/agents
- **Schedules**: http://localhost:3000/settings/schedules

### New Tredy Pages:
- **🔐 Super Admin Dashboard**: http://localhost:3000/settings/super-admin
  - Platform analytics
  - Organization management
  - Marketplace catalog (planned)
  - User role management (planned)

### Existing Marketplace:
- **Community Hub**: http://localhost:3000/settings/community-hub
  - Browse free Community Hub items
  - Will be extended to show Tredy paid items

## 🎨 What You'll See on Super Admin Dashboard

### Analytics Cards (Top Row):
- 📊 **Total Users** - Platform user count
- 💼 **Total Workspaces** - All workspaces across users
- 🛒 **Total Purchases** - Marketplace purchases
- 💰 **Total Revenue** - Sum of all purchase amounts

### Organizations Section:
- **Create Organization** button
  - Name, Tier (internal/agency/startup), Subscription (free/pro/enterprise)
- **Organization Cards**
  - View org details
  - User count
  - Purchase count
  - Manage button (future: takes you to org detail page)

### Recent Activity (planned):
- Latest purchases
- New users
- Workspace creation
- Item installations

## 🧪 Testing the Dashboard

### Test 1: View Analytics
1. Go to http://localhost:3000/settings/super-admin
2. You should see 4 stat cards at the top
3. Initially all will show 0 (no data yet)

### Test 2: Create an Organization (Multi-Tenant Mode)
1. Set `TENANCY_MODE=multi` in server/.env
2. Restart server (`yarn dev:server`)
3. Refresh dashboard
4. Click "+ Create Organization"
5. Fill in:
   - Name: "Test Organization"
   - Tier: "internal"
   - Subscription: "free"
6. Click "Create Organization"
7. Should see success toast and org card appears

### Test 3: Create Test Data
Run this to populate analytics:

```bash
# Create test purchase
sqlite3 /Users/segevbin/anything-llm/server/storage/anythingllm.db << EOF
INSERT INTO marketplace_purchases (userId, hubId, itemType, amountPaidCents, purchasedBy, status)
VALUES (1, 'test-skill-123', 'agent-skill', 2999, 1, 'completed');
EOF

# Refresh dashboard - should see:
# - Total Purchases: 1
# - Total Revenue: $29.99
```

## 🛠️ Using Browser DevTools for API Testing

Open DevTools (F12) → Console:

```javascript
// Get auth token
const token = localStorage.getItem('anythingllm_authToken');

// Test analytics endpoint
fetch('/api/super-admin/analytics', {
  headers: { 'Authorization': `Bearer ${token}` }
})
.then(r => r.json())
.then(console.log);

// Test create organization
fetch('/api/organizations', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    name: 'Dev Test Org',
    tier: 'internal'
  })
})
.then(r => r.json())
.then(console.log);

// Test get organizations
fetch('/api/organizations', {
  headers: { 'Authorization': `Bearer ${token}` }
})
.then(r => r.json())
.then(console.log);
```

## 📱 Mobile Access

The dashboard is responsive and works on mobile. Access from your phone:

1. Find your local IP: `ifconfig | grep inet`
2. Update frontend dev server to allow network access
3. Access from phone: `http://YOUR_IP:3000/settings/super-admin`

## 🔒 Security Notes

1. **Super Admin Role**: Only users with `role='super_admin'` should access this page
2. **Backend Checks**: All API endpoints check for super_admin role
3. **Regular Admins**: Can see the menu item but API will return 401 if not super_admin
4. **Production**: Remove the emoji from menu item and add proper role checking on frontend

## 🐛 Troubleshooting

**"Loading..." forever:**
- Check browser console for errors
- Verify server is running on port 3001
- Check you're logged in (have auth token)

**"Failed to load dashboard data":**
- Verify you're promoted to super_admin
- Check server logs for errors
- Test API directly in DevTools console

**Organizations section says "Enable TENANCY_MODE=multi":**
- This is normal in single-tenant mode
- Organizations only work when `TENANCY_MODE=multi` in .env

**404 on /settings/super-admin:**
- Rebuild frontend: `cd frontend && npm run build`
- Or use dev mode: `yarn dev:frontend`

## 🚀 Next Steps

### Phase 1 (Completed):
- ✅ Backend API for marketplace, organizations, super admin
- ✅ Database schema (Prisma)
- ✅ Basic admin dashboard UI
- ✅ Analytics display
- ✅ Organization creation

### Phase 2 (To Do):
- [ ] Marketplace catalog management UI
  - Upload agent skills (ZIP files)
  - Create system prompts
  - Create slash commands
  - Set prices and visibility
- [ ] Organization detail page
  - View/edit org details
  - Manage org users
  - View org purchases
- [ ] User management from super admin
  - View all users
  - Change roles
  - Assign to organizations
- [ ] Revenue charts and analytics
  - Purchase trends
  - Revenue over time
  - Top items

### Phase 3 (Advanced):
- [ ] Supabase setup and integration
- [ ] Stripe payment flow
- [ ] Customer marketplace browsing (paid items)
- [ ] Purchase flow with Stripe checkout
- [ ] Webhook handling for payments
- [ ] Email notifications
- [ ] Subscription management

## 📚 Related Files

**Backend:**
- `/server/endpoints/superAdmin.js` - Super admin API
- `/server/endpoints/organizations.js` - Organization API
- `/server/endpoints/marketplace.js` - Marketplace API
- `/server/models/organization.js` - Organization model
- `/server/utils/tenancy/` - Tenancy provider system

**Frontend:**
- `/frontend/src/pages/Admin/SuperAdmin/index.jsx` - Dashboard page
- `/frontend/src/components/SettingsSidebar/index.jsx` - Sidebar menu
- `/frontend/src/App.jsx` - Routes

**Documentation:**
- `TREDY_IMPLEMENTATION_COMPLETE.md` - Full implementation guide
- `ADMIN_DASHBOARD_ACCESS.md` - This file
