-- CreateTable for Agent Schedules
CREATE TABLE "agent_schedules" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "agent_id" TEXT NOT NULL,
    "agent_type" TEXT NOT NULL,
    "workspace_id" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "cron_expression" TEXT NOT NULL,
    "timezone" TEXT DEFAULT 'UTC',
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "context" TEXT,
    "last_run_at" DATETIME,
    "next_run_at" DATETIME,
    "created_by" INTEGER,
    "created_at" DATETIME DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "agent_schedules_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "workspaces" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "agent_schedules_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable for Schedule Execution History
CREATE TABLE "schedule_executions" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "schedule_id" INTEGER NOT NULL,
    "status" TEXT NOT NULL,
    "started_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completed_at" DATETIME,
    "output" TEXT,
    "error" TEXT,
    "tokens_used" INTEGER DEFAULT 0,
    CONSTRAINT "schedule_executions_schedule_id_fkey" FOREIGN KEY ("schedule_id") REFERENCES "agent_schedules" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "agent_schedules_workspace_id_idx" ON "agent_schedules"("workspace_id");
CREATE INDEX "agent_schedules_next_run_at_idx" ON "agent_schedules"("next_run_at", "enabled");
CREATE INDEX "schedule_executions_schedule_id_idx" ON "schedule_executions"("schedule_id");
CREATE INDEX "schedule_executions_started_at_idx" ON "schedule_executions"("started_at");