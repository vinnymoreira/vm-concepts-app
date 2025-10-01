-- Notes Section Database Schema
-- Run this script in your Supabase SQL Editor

-- Create note_categories table (folders/categories for organizing notes)
CREATE TABLE IF NOT EXISTS note_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  color TEXT DEFAULT '#6366f1', -- Default indigo color
  icon TEXT, -- Optional emoji or icon identifier
  parent_id UUID REFERENCES note_categories(id) ON DELETE CASCADE, -- For nested categories
  position INTEGER DEFAULT 0, -- For custom ordering
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create notes table
CREATE TABLE IF NOT EXISTS notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL DEFAULT 'Untitled',
  content JSONB DEFAULT '{"type":"doc","content":[{"type":"paragraph"}]}'::jsonb, -- Tiptap JSON format
  category_id UUID REFERENCES note_categories(id) ON DELETE SET NULL,
  is_favorite BOOLEAN DEFAULT FALSE,
  position INTEGER DEFAULT 0, -- For custom ordering within category
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_edited_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_notes_user_id ON notes(user_id);
CREATE INDEX IF NOT EXISTS idx_notes_category_id ON notes(category_id);
CREATE INDEX IF NOT EXISTS idx_notes_created_at ON notes(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notes_updated_at ON notes(updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_notes_is_favorite ON notes(is_favorite) WHERE is_favorite = TRUE;

CREATE INDEX IF NOT EXISTS idx_note_categories_user_id ON note_categories(user_id);
CREATE INDEX IF NOT EXISTS idx_note_categories_parent_id ON note_categories(parent_id);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
CREATE TRIGGER update_notes_updated_at
  BEFORE UPDATE ON notes
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_note_categories_updated_at
  BEFORE UPDATE ON note_categories
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security (RLS)
ALTER TABLE notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE note_categories ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for notes
CREATE POLICY "Users can view their own notes"
  ON notes FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own notes"
  ON notes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own notes"
  ON notes FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own notes"
  ON notes FOR DELETE
  USING (auth.uid() = user_id);

-- Create RLS policies for note_categories
CREATE POLICY "Users can view their own categories"
  ON note_categories FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own categories"
  ON note_categories FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own categories"
  ON note_categories FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own categories"
  ON note_categories FOR DELETE
  USING (auth.uid() = user_id);

-- Create a default "Uncategorized" category function (optional - can be called after user signup)
-- This would need to be called from your app or a trigger on user creation
CREATE OR REPLACE FUNCTION create_default_note_category(target_user_id UUID)
RETURNS UUID AS $$
DECLARE
  new_category_id UUID;
BEGIN
  INSERT INTO note_categories (user_id, name, color, icon, position)
  VALUES (target_user_id, 'General', '#6366f1', '📝', 0)
  RETURNING id INTO new_category_id;

  RETURN new_category_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
