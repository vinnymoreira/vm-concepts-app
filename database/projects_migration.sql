-- Migration to add domain and staging_site fields to existing projects table
-- Run this ONLY if you already created the projects table and need to add the new fields

-- Add domain column (renamed from website)
ALTER TABLE projects ADD COLUMN IF NOT EXISTS domain TEXT;

-- Add staging_site column
ALTER TABLE projects ADD COLUMN IF NOT EXISTS staging_site TEXT;

-- If you want to migrate existing website data to domain:
-- UPDATE projects SET domain = website WHERE website IS NOT NULL;

-- Optionally drop the website column if you migrated the data:
-- ALTER TABLE projects DROP COLUMN IF EXISTS website;
