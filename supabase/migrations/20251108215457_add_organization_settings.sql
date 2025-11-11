/*
  # Add Organization Settings Table

  ## Overview
  This migration creates an organization settings table to store company-wide configuration
  including total employee headcount, which is critical for calculating meaningful FTE impact
  percentages.

  ## New Tables

  ### `organization_settings`
  Stores organization-wide configuration and metrics
  - `id` (uuid, primary key) - Unique identifier
  - `organization_name` (text) - Optional company/organization name
  - `total_employees` (integer, required) - Total employee headcount
  - `fiscal_year_start_month` (integer, default: 1) - Month that fiscal year starts (1-12)
  - `standard_work_hours_per_year` (integer, default: 2080) - Standard FTE hours per year
  - `notes` (text) - Additional notes about the organization
  - `created_at` (timestamptz) - Creation timestamp
  - `updated_at` (timestamptz) - Last update timestamp

  ## Security
  - Enable RLS on organization_settings table
  - Allow anyone to view settings (needed for FTE calculations)
  - Only authenticated users can modify settings

  ## Notes
  1. This is a singleton table - only one row should exist
  2. Total employees is required for meaningful FTE impact percentage calculations
  3. Standard work hours defaults to 2080 (40 hours/week * 52 weeks)
  4. The system will calculate FTE impact as a percentage of total_employees
*/

-- Create organization_settings table
CREATE TABLE IF NOT EXISTS organization_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_name text,
  total_employees integer NOT NULL CHECK (total_employees > 0),
  fiscal_year_start_month integer DEFAULT 1 CHECK (fiscal_year_start_month >= 1 AND fiscal_year_start_month <= 12),
  standard_work_hours_per_year integer DEFAULT 2080 CHECK (standard_work_hours_per_year > 0),
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_org_settings_created ON organization_settings(created_at DESC);

-- Enable Row Level Security
ALTER TABLE organization_settings ENABLE ROW LEVEL SECURITY;

-- RLS Policies for organization_settings table
CREATE POLICY "Anyone can view organization settings"
  ON organization_settings FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can insert organization settings"
  ON organization_settings FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update organization settings"
  ON organization_settings FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete organization settings"
  ON organization_settings FOR DELETE
  TO authenticated
  USING (true);

-- Trigger to update updated_at timestamp
CREATE TRIGGER update_org_settings_updated_at
  BEFORE UPDATE ON organization_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Insert default organization settings
INSERT INTO organization_settings (total_employees, notes)
VALUES (100, 'Default organization settings - please update with your actual employee count')
ON CONFLICT DO NOTHING;

-- Function to get current total employees (helper function)
CREATE OR REPLACE FUNCTION get_total_employees()
RETURNS integer AS $$
DECLARE
  v_total integer;
BEGIN
  SELECT total_employees INTO v_total
  FROM organization_settings
  ORDER BY created_at DESC
  LIMIT 1;
  
  RETURN COALESCE(v_total, 100);
END;
$$ LANGUAGE plpgsql;

-- Function to calculate FTE impact percentage
CREATE OR REPLACE FUNCTION calculate_fte_percentage(p_fte_value numeric)
RETURNS numeric AS $$
DECLARE
  v_total_employees integer;
BEGIN
  v_total_employees := get_total_employees();
  
  IF v_total_employees = 0 THEN
    RETURN 0;
  END IF;
  
  RETURN (p_fte_value / v_total_employees) * 100;
END;
$$ LANGUAGE plpgsql;

-- Drop and recreate calculate_org_projected_totals to include FTE percentage
DROP FUNCTION IF EXISTS calculate_org_projected_totals();

CREATE OR REPLACE FUNCTION calculate_org_projected_totals()
RETURNS TABLE(
  total_fte numeric,
  total_time_saved numeric,
  total_cost_saved numeric,
  agent_count integer,
  fte_percentage numeric,
  total_employees integer
) AS $$
DECLARE
  v_total_fte numeric;
  v_total_employees integer;
BEGIN
  -- Get total employees
  v_total_employees := get_total_employees();
  
  -- Calculate totals
  SELECT 
    COALESCE(SUM(calculate_agent_projected_fte(id)), 0),
    COALESCE(SUM(calculate_agent_projected_time_saved(id)), 0),
    COALESCE(SUM(calculate_agent_projected_cost_saved(id)), 0),
    COUNT(*)::integer
  INTO 
    v_total_fte,
    total_time_saved,
    total_cost_saved,
    agent_count
  FROM agents
  WHERE status = 'active'
    AND avg_time_without_agent_minutes IS NOT NULL
    AND avg_time_with_agent_minutes IS NOT NULL
    AND avg_usage_count IS NOT NULL
    AND avg_usage_count > 0;
  
  -- Calculate FTE percentage
  total_fte := v_total_fte;
  total_employees := v_total_employees;
  
  IF v_total_employees > 0 THEN
    fte_percentage := (v_total_fte / v_total_employees) * 100;
  ELSE
    fte_percentage := 0;
  END IF;
  
  RETURN NEXT;
END;
$$ LANGUAGE plpgsql;
