-- CreateTable
CREATE TABLE "organizations" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "tier" TEXT NOT NULL DEFAULT 'internal',
    "stripeCustomerId" TEXT,
    "subscriptionTier" TEXT DEFAULT 'free',
    "customDomain" TEXT,
    "logoFilename" TEXT,
    "settings" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "marketplace_purchases" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "userId" INTEGER,
    "organizationId" INTEGER,
    "hubId" TEXT NOT NULL,
    "itemType" TEXT NOT NULL,
    "stripePaymentIntentId" TEXT,
    "amountPaidCents" INTEGER,
    "purchasedBy" INTEGER,
    "status" TEXT NOT NULL DEFAULT 'completed',
    "purchasedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "marketplace_purchases_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "marketplace_purchases_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "marketplace_purchases_purchasedBy_fkey" FOREIGN KEY ("purchasedBy") REFERENCES "users" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "marketplace_installations" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "hubId" TEXT NOT NULL,
    "itemType" TEXT NOT NULL,
    "workspaceId" INTEGER,
    "userId" INTEGER NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "installedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "marketplace_installations_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_users" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "username" TEXT,
    "password" TEXT NOT NULL,
    "pfpFilename" TEXT,
    "role" TEXT NOT NULL DEFAULT 'default',
    "suspended" INTEGER NOT NULL DEFAULT 0,
    "seen_recovery_codes" BOOLEAN DEFAULT false,
    "supabase_id" TEXT,
    "organizationId" INTEGER,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastUpdatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dailyMessageLimit" INTEGER,
    "bio" TEXT DEFAULT '',
    CONSTRAINT "users_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_users" ("bio", "createdAt", "dailyMessageLimit", "id", "lastUpdatedAt", "password", "pfpFilename", "role", "seen_recovery_codes", "supabase_id", "suspended", "username") SELECT "bio", "createdAt", "dailyMessageLimit", "id", "lastUpdatedAt", "password", "pfpFilename", "role", "seen_recovery_codes", "supabase_id", "suspended", "username" FROM "users";
DROP TABLE "users";
ALTER TABLE "new_users" RENAME TO "users";
CREATE UNIQUE INDEX "users_username_key" ON "users"("username");
CREATE UNIQUE INDEX "users_supabase_id_key" ON "users"("supabase_id");
CREATE INDEX "users_organizationId_idx" ON "users"("organizationId");
PRAGMA foreign_key_check;
PRAGMA foreign_keys=ON;

-- CreateIndex
CREATE UNIQUE INDEX "organizations_slug_key" ON "organizations"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "organizations_stripeCustomerId_key" ON "organizations"("stripeCustomerId");

-- CreateIndex
CREATE UNIQUE INDEX "organizations_customDomain_key" ON "organizations"("customDomain");

-- CreateIndex
CREATE INDEX "organizations_slug_idx" ON "organizations"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "marketplace_purchases_stripePaymentIntentId_key" ON "marketplace_purchases"("stripePaymentIntentId");

-- CreateIndex
CREATE INDEX "marketplace_purchases_userId_idx" ON "marketplace_purchases"("userId");

-- CreateIndex
CREATE INDEX "marketplace_purchases_organizationId_idx" ON "marketplace_purchases"("organizationId");

-- CreateIndex
CREATE INDEX "marketplace_purchases_hubId_idx" ON "marketplace_purchases"("hubId");

-- CreateIndex
CREATE INDEX "marketplace_purchases_status_idx" ON "marketplace_purchases"("status");

-- CreateIndex
CREATE INDEX "marketplace_installations_userId_idx" ON "marketplace_installations"("userId");

-- CreateIndex
CREATE INDEX "marketplace_installations_workspaceId_idx" ON "marketplace_installations"("workspaceId");

-- CreateIndex
CREATE INDEX "marketplace_installations_hubId_idx" ON "marketplace_installations"("hubId");

-- CreateIndex
CREATE UNIQUE INDEX "marketplace_installations_hubId_userId_workspaceId_key" ON "marketplace_installations"("hubId", "userId", "workspaceId");
