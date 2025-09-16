-- CreateTable
CREATE TABLE "waitlist" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "email" TEXT NOT NULL,
    "joinedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "notified" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateIndex
CREATE UNIQUE INDEX "waitlist_email_key" ON "waitlist"("email");

-- CreateIndex
CREATE INDEX "waitlist_email_idx" ON "waitlist"("email");

-- CreateIndex
CREATE INDEX "waitlist_joinedAt_idx" ON "waitlist"("joinedAt");
