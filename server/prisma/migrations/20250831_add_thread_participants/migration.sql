-- CreateTable
CREATE TABLE "thread_participants" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "thread_id" INTEGER NOT NULL,
    "user_id" INTEGER NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'viewer',
    "can_edit" BOOLEAN NOT NULL DEFAULT false,
    "can_delete" BOOLEAN NOT NULL DEFAULT false,
    "joined_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "last_seen_at" DATETIME,
    CONSTRAINT "thread_participants_thread_id_fkey" FOREIGN KEY ("thread_id") REFERENCES "workspace_threads" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "thread_participants_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "thread_participants_thread_id_user_id_key" ON "thread_participants"("thread_id", "user_id");

-- CreateIndex
CREATE INDEX "thread_participants_thread_id_idx" ON "thread_participants"("thread_id");

-- CreateIndex
CREATE INDEX "thread_participants_user_id_idx" ON "thread_participants"("user_id");