-- RedefineTables
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_connector_tokens" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "workspaceId" INTEGER NOT NULL,
    "provider" TEXT NOT NULL,
    "nangoConnectionId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "lastSync" DATETIME,
    "metadata" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "connector_tokens_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "workspaces" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_connector_tokens" ("createdAt", "id", "lastSync", "metadata", "nangoConnectionId", "provider", "status", "updatedAt", "workspaceId") SELECT "createdAt", "id", "lastSync", "metadata", "nangoConnectionId", "provider", "status", "updatedAt", "workspaceId" FROM "connector_tokens";
DROP TABLE "connector_tokens";
ALTER TABLE "new_connector_tokens" RENAME TO "connector_tokens";
CREATE INDEX "connector_tokens_workspaceId_idx" ON "connector_tokens"("workspaceId");
CREATE UNIQUE INDEX "connector_tokens_workspaceId_provider_key" ON "connector_tokens"("workspaceId", "provider");
CREATE TABLE "new_schedule_executions" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "schedule_id" INTEGER NOT NULL,
    "status" TEXT NOT NULL,
    "started_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completed_at" DATETIME,
    "output" TEXT,
    "error" TEXT,
    "tokens_used" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "schedule_executions_schedule_id_fkey" FOREIGN KEY ("schedule_id") REFERENCES "agent_schedules" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_schedule_executions" ("completed_at", "error", "id", "output", "schedule_id", "started_at", "status", "tokens_used") SELECT "completed_at", "error", "id", "output", "schedule_id", "started_at", "status", coalesce("tokens_used", 0) AS "tokens_used" FROM "schedule_executions";
DROP TABLE "schedule_executions";
ALTER TABLE "new_schedule_executions" RENAME TO "schedule_executions";
CREATE INDEX "schedule_executions_schedule_id_idx" ON "schedule_executions"("schedule_id");
CREATE INDEX "schedule_executions_started_at_idx" ON "schedule_executions"("started_at");
CREATE TABLE "new_agent_schedules" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "agent_id" TEXT NOT NULL,
    "agent_type" TEXT NOT NULL,
    "workspace_id" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "cron_expression" TEXT NOT NULL,
    "timezone" TEXT NOT NULL DEFAULT 'UTC',
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "context" TEXT,
    "last_run_at" DATETIME,
    "next_run_at" DATETIME,
    "created_by" INTEGER,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "agent_schedules_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "workspaces" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "agent_schedules_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_agent_schedules" ("agent_id", "agent_type", "context", "created_at", "created_by", "cron_expression", "description", "enabled", "id", "last_run_at", "name", "next_run_at", "timezone", "updated_at", "workspace_id") SELECT "agent_id", "agent_type", "context", coalesce("created_at", CURRENT_TIMESTAMP) AS "created_at", "created_by", "cron_expression", "description", "enabled", "id", "last_run_at", "name", "next_run_at", coalesce("timezone", 'UTC') AS "timezone", coalesce("updated_at", CURRENT_TIMESTAMP) AS "updated_at", "workspace_id" FROM "agent_schedules";
DROP TABLE "agent_schedules";
ALTER TABLE "new_agent_schedules" RENAME TO "agent_schedules";
CREATE INDEX "agent_schedules_workspace_id_idx" ON "agent_schedules"("workspace_id");
CREATE INDEX "agent_schedules_next_run_at_enabled_idx" ON "agent_schedules"("next_run_at", "enabled");
PRAGMA foreign_key_check;
PRAGMA foreign_keys=ON;
