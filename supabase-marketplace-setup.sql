-- Tredy Marketplace Database Setup
-- Run this SQL in your Supabase SQL Editor: https://supabase.com/dashboard/project/xyprfcyluvmqtipjlopj/sql

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create marketplace_items table
CREATE TABLE IF NOT EXISTS marketplace_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  item_type TEXT NOT NULL CHECK (item_type IN ('agent-skill', 'system-prompt', 'slash-command')),
  price_cents INTEGER DEFAULT 0 CHECK (price_cents >= 0),
  visibility TEXT DEFAULT 'public' CHECK (visibility IN ('public', 'private', 'unlisted')),
  author TEXT DEFAULT 'Tredy',
  version TEXT DEFAULT '1.0.0',
  file_path TEXT,
  content JSONB,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_items_type ON marketplace_items(item_type);
CREATE INDEX IF NOT EXISTS idx_items_visibility ON marketplace_items(visibility);
CREATE INDEX IF NOT EXISTS idx_items_type_visibility ON marketplace_items(item_type, visibility);

-- Create storage bucket for marketplace files (ZIP uploads)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'marketplace-files',
  'marketplace-files',
  false,
  52428800, -- 50MB limit
  ARRAY['application/zip', 'application/x-zip-compressed']
)
ON CONFLICT (id) DO NOTHING;

-- Enable RLS (Row Level Security)
ALTER TABLE marketplace_items ENABLE ROW LEVEL SECURITY;

-- Create policies for marketplace_items
CREATE POLICY "Allow service role full access to marketplace_items"
ON marketplace_items
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Public read access for public items (optional - remove if you want items private by default)
CREATE POLICY "Allow public read for public items"
ON marketplace_items
FOR SELECT
TO anon, authenticated
USING (visibility = 'public');

-- Storage policies for marketplace-files bucket
CREATE POLICY "Service role can upload files"
ON storage.objects
FOR INSERT
TO service_role
WITH CHECK (bucket_id = 'marketplace-files');

CREATE POLICY "Service role can read files"
ON storage.objects
FOR SELECT
TO service_role
USING (bucket_id = 'marketplace-files');

CREATE POLICY "Service role can update files"
ON storage.objects
FOR UPDATE
TO service_role
USING (bucket_id = 'marketplace-files')
WITH CHECK (bucket_id = 'marketplace-files');

CREATE POLICY "Service role can delete files"
ON storage.objects
FOR DELETE
TO service_role
USING (bucket_id = 'marketplace-files');

-- Create a function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to auto-update updated_at
CREATE TRIGGER update_marketplace_items_updated_at
BEFORE UPDATE ON marketplace_items
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Success message
DO $$
BEGIN
  RAISE NOTICE '✅ Tredy Marketplace tables created successfully!';
  RAISE NOTICE '✅ Storage bucket "marketplace-files" created';
  RAISE NOTICE '✅ You can now create marketplace items!';
END $$;
