-- CreateTable
CREATE TABLE "connector_tokens" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "workspaceId" INTEGER NOT NULL,
    "provider" TEXT NOT NULL,
    "nangoConnectionId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "lastSync" DATETIME,
    "metadata" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "connector_tokens_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "workspaces" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "connector_tokens_workspaceId_provider_key" ON "connector_tokens"("workspaceId", "provider");

-- CreateIndex
CREATE INDEX "connector_tokens_workspaceId_idx" ON "connector_tokens"("workspaceId");