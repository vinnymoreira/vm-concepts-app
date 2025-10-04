-- Task Labels Management Schema
-- Run this script in your Supabase SQL Editor

-- Create task_labels table for managing custom labels
CREATE TABLE IF NOT EXISTS task_labels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  color TEXT NOT NULL DEFAULT '#6366f1', -- Hex color value
  position INTEGER DEFAULT 0, -- For custom ordering
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, name) -- Prevent duplicate label names per user
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_task_labels_user_id ON task_labels(user_id);
CREATE INDEX IF NOT EXISTS idx_task_labels_position ON task_labels(user_id, position);

-- Create updated_at trigger for task_labels
CREATE TRIGGER update_task_labels_updated_at
  BEFORE UPDATE ON task_labels
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security (RLS)
ALTER TABLE task_labels ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for task_labels
CREATE POLICY "Users can view their own task labels"
  ON task_labels FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own task labels"
  ON task_labels FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own task labels"
  ON task_labels FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own task labels"
  ON task_labels FOR DELETE
  USING (auth.uid() = user_id);

-- Create default labels function
CREATE OR REPLACE FUNCTION create_default_task_labels(target_user_id UUID)
RETURNS VOID AS $$
BEGIN
  INSERT INTO task_labels (user_id, name, color, position)
  VALUES
    (target_user_id, 'High Priority', '#ef4444', 0),    -- Red
    (target_user_id, 'Medium Priority', '#f59e0b', 1),  -- Orange
    (target_user_id, 'Low Priority', '#10b981', 2),     -- Green
    (target_user_id, 'Bug', '#dc2626', 3),              -- Dark Red
    (target_user_id, 'Feature', '#3b82f6', 4),          -- Blue
    (target_user_id, 'Improvement', '#8b5cf6', 5),      -- Purple
    (target_user_id, 'Documentation', '#6b7280', 6),    -- Gray
    (target_user_id, 'Review', '#f59e0b', 7)            -- Orange
  ON CONFLICT (user_id, name) DO NOTHING;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;