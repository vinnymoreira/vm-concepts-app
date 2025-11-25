-- Projects table for VM Concepts App
-- Run this in Supabase SQL Editor

-- Create projects table
CREATE TABLE IF NOT EXISTS projects (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  client_id BIGINT REFERENCES clients(id) ON DELETE SET NULL,

  -- Project details
  name VARCHAR(255) NOT NULL,
  last_name VARCHAR(255),
  first_name VARCHAR(255),
  trello_link TEXT,
  design_link TEXT,
  domain TEXT,
  staging_site TEXT,

  -- Assignment
  assigned_to VARCHAR(50) DEFAULT 'user' NOT NULL, -- 'user' or 'brazil_team'

  -- Status
  status VARCHAR(50) DEFAULT 'open' NOT NULL, -- 'open', 'in_progress', 'qa', 'complete'

  -- Dates
  deadline DATE,

  -- Financial
  payment_received BOOLEAN DEFAULT false NOT NULL,
  net_income DECIMAL(10, 2) DEFAULT 2700.00,
  cost DECIMAL(10, 2) DEFAULT 900.00,
  profit DECIMAL(10, 2) GENERATED ALWAYS AS (net_income - cost) STORED,

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS projects_user_id_idx ON projects(user_id);
CREATE INDEX IF NOT EXISTS projects_client_id_idx ON projects(client_id);
CREATE INDEX IF NOT EXISTS projects_status_idx ON projects(status);
CREATE INDEX IF NOT EXISTS projects_deadline_idx ON projects(deadline);

-- Enable Row Level Security
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

-- Create policies for RLS
-- Users can only see their own projects
CREATE POLICY "Users can view own projects"
  ON projects FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own projects
CREATE POLICY "Users can insert own projects"
  ON projects FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own projects
CREATE POLICY "Users can update own projects"
  ON projects FOR UPDATE
  USING (auth.uid() = user_id);

-- Users can delete their own projects
CREATE POLICY "Users can delete own projects"
  ON projects FOR DELETE
  USING (auth.uid() = user_id);

-- Create function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = TIMEZONE('utc', NOW());
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to update updated_at on projects
CREATE TRIGGER update_projects_updated_at
  BEFORE UPDATE ON projects
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Grant necessary permissions
GRANT ALL ON projects TO authenticated;
