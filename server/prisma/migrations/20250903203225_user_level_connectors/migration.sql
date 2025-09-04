-- AlterTable to make workspaceId optional and add new fields for user-level connectors
ALTER TABLE "connector_tokens" ADD COLUMN "userId" INTEGER;
ALTER TABLE "connector_tokens" ADD COLUMN "scope" TEXT DEFAULT 'workspace';
ALTER TABLE "connector_tokens" ADD COLUMN "supabaseTokenRef" TEXT;

-- Create index for userId
CREATE INDEX "connector_tokens_userId_idx" ON "connector_tokens"("userId");

-- Create unique index for userId + provider combination
CREATE UNIQUE INDEX "connector_tokens_userId_provider_key" ON "connector_tokens"("userId", "provider");

-- Add foreign key constraint for userId
-- Note: In SQLite, we can't add foreign keys after table creation, so this is for documentation
-- In PostgreSQL, uncomment the following:
-- ALTER TABLE "connector_tokens" ADD CONSTRAINT "connector_tokens_userId_fkey" 
--   FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE;