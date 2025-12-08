-- Rental Property Tracking Tables
-- Run this in Supabase SQL Editor

-- Table 1: rental_properties (the units/properties you own)
CREATE TABLE IF NOT EXISTS rental_properties (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  property_name TEXT NOT NULL, -- e.g., "123 Main St Unit A" or "Downtown Duplex - Unit 1"
  description TEXT,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table 2: rental_records (monthly income/expense records per property)
CREATE TABLE IF NOT EXISTS rental_records (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  property_id BIGINT NOT NULL REFERENCES rental_properties(id) ON DELETE CASCADE,
  record_date DATE NOT NULL, -- First day of the month (YYYY-MM-01)
  rental_income DECIMAL(10, 2) DEFAULT 0, -- Can be $0 for vacancy
  mortgage DECIMAL(10, 2) DEFAULT 0,
  maintenance DECIMAL(10, 2) DEFAULT 0,
  property_management DECIMAL(10, 2) DEFAULT 0,
  other_expenses DECIMAL(10, 2) DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, property_id, record_date) -- One record per property per month
);

-- Computed column for net profit
ALTER TABLE rental_records
ADD COLUMN net_profit DECIMAL(10, 2)
GENERATED ALWAYS AS (
  rental_income - (mortgage + maintenance + property_management + other_expenses)
) STORED;

-- RLS Policies for rental_properties
ALTER TABLE rental_properties ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own rental properties"
  ON rental_properties FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own rental properties"
  ON rental_properties FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own rental properties"
  ON rental_properties FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own rental properties"
  ON rental_properties FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies for rental_records
ALTER TABLE rental_records ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own rental records"
  ON rental_records FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own rental records"
  ON rental_records FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own rental records"
  ON rental_records FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own rental records"
  ON rental_records FOR DELETE
  USING (auth.uid() = user_id);

-- Indexes for performance
CREATE INDEX idx_rental_properties_user_id ON rental_properties(user_id);
CREATE INDEX idx_rental_records_user_id ON rental_records(user_id);
CREATE INDEX idx_rental_records_property_id ON rental_records(property_id);
CREATE INDEX idx_rental_records_date ON rental_records(record_date);

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_rental_properties_updated_at
  BEFORE UPDATE ON rental_properties
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_rental_records_updated_at
  BEFORE UPDATE ON rental_records
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
