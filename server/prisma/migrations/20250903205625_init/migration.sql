-- RedefineTables
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_connector_tokens" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "workspaceId" INTEGER,
    "userId" INTEGER,
    "provider" TEXT NOT NULL,
    "nangoConnectionId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "lastSync" DATETIME,
    "metadata" TEXT,
    "scope" TEXT NOT NULL DEFAULT 'workspace',
    "supabaseTokenRef" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "connector_tokens_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "workspaces" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "connector_tokens_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_connector_tokens" ("createdAt", "id", "lastSync", "metadata", "nangoConnectionId", "provider", "scope", "status", "supabaseTokenRef", "updatedAt", "userId", "workspaceId") SELECT "createdAt", "id", "lastSync", "metadata", "nangoConnectionId", "provider", coalesce("scope", 'workspace') AS "scope", "status", "supabaseTokenRef", "updatedAt", "userId", "workspaceId" FROM "connector_tokens";
DROP TABLE "connector_tokens";
ALTER TABLE "new_connector_tokens" RENAME TO "connector_tokens";
CREATE INDEX "connector_tokens_workspaceId_idx" ON "connector_tokens"("workspaceId");
CREATE INDEX "connector_tokens_userId_idx" ON "connector_tokens"("userId");
CREATE UNIQUE INDEX "connector_tokens_workspaceId_provider_key" ON "connector_tokens"("workspaceId", "provider");
CREATE UNIQUE INDEX "connector_tokens_userId_provider_key" ON "connector_tokens"("userId", "provider");
PRAGMA foreign_key_check;
PRAGMA foreign_keys=ON;
