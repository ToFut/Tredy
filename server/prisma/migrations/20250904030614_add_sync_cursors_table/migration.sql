-- CreateTable
CREATE TABLE "sync_cursors" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "workspaceId" INTEGER NOT NULL,
    "provider" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "cursor" TEXT,
    "lastSyncAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "recordCount" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'success',
    "error" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateIndex
CREATE INDEX "sync_cursors_workspaceId_idx" ON "sync_cursors"("workspaceId");

-- CreateIndex
CREATE INDEX "sync_cursors_provider_idx" ON "sync_cursors"("provider");

-- CreateIndex
CREATE INDEX "sync_cursors_lastSyncAt_idx" ON "sync_cursors"("lastSyncAt");

-- CreateIndex
CREATE UNIQUE INDEX "sync_cursors_workspaceId_provider_model_key" ON "sync_cursors"("workspaceId", "provider", "model");
