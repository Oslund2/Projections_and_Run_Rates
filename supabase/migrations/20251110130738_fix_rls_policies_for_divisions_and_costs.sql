/*
  # Fix RLS Policies for Public Access

  ## Overview
  This migration fixes Row Level Security policies for the divisions and cost tracking tables
  to allow public access, matching the pattern used by other tables in the application.

  ## Security Changes
  Updates RLS policies for the following tables to allow public access:
  - `divisions` - Allow anyone to insert, update, and delete divisions
  - `cost_centers` - Allow anyone to insert, update, and delete cost centers
  - `platform_costs` - Allow anyone to insert, update, and delete platform costs
  - `token_usage` - Allow anyone to insert, update, and delete token usage records
  - `ai_team_members` - Allow anyone to insert, update, and delete team members

  ## Important Notes
  1. These policies replace the existing authenticated-only policies
  2. This matches the security pattern used throughout the application
  3. All SELECT policies already allow public access (USING true)
  4. This enables the application to work without authentication
*/

-- Drop existing restrictive policies for divisions
DROP POLICY IF EXISTS "Authenticated users can insert divisions" ON divisions;
DROP POLICY IF EXISTS "Authenticated users can update divisions" ON divisions;
DROP POLICY IF EXISTS "Authenticated users can delete divisions" ON divisions;

-- Create public access policies for divisions
CREATE POLICY "Anyone can insert divisions"
  ON divisions FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Anyone can update divisions"
  ON divisions FOR UPDATE
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Anyone can delete divisions"
  ON divisions FOR DELETE
  USING (true);

-- Drop existing restrictive policies for cost_centers
DROP POLICY IF EXISTS "Authenticated users can insert cost_centers" ON cost_centers;
DROP POLICY IF EXISTS "Authenticated users can update cost_centers" ON cost_centers;
DROP POLICY IF EXISTS "Authenticated users can delete cost_centers" ON cost_centers;

-- Create public access policies for cost_centers
CREATE POLICY "Anyone can insert cost_centers"
  ON cost_centers FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Anyone can update cost_centers"
  ON cost_centers FOR UPDATE
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Anyone can delete cost_centers"
  ON cost_centers FOR DELETE
  USING (true);

-- Drop existing restrictive policies for platform_costs
DROP POLICY IF EXISTS "Authenticated users can insert platform_costs" ON platform_costs;
DROP POLICY IF EXISTS "Authenticated users can update platform_costs" ON platform_costs;
DROP POLICY IF EXISTS "Authenticated users can delete platform_costs" ON platform_costs;

-- Create public access policies for platform_costs
CREATE POLICY "Anyone can insert platform_costs"
  ON platform_costs FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Anyone can update platform_costs"
  ON platform_costs FOR UPDATE
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Anyone can delete platform_costs"
  ON platform_costs FOR DELETE
  USING (true);

-- Drop existing restrictive policies for token_usage
DROP POLICY IF EXISTS "Authenticated users can insert token_usage" ON token_usage;
DROP POLICY IF EXISTS "Authenticated users can update token_usage" ON token_usage;
DROP POLICY IF EXISTS "Authenticated users can delete token_usage" ON token_usage;

-- Create public access policies for token_usage
CREATE POLICY "Anyone can insert token_usage"
  ON token_usage FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Anyone can update token_usage"
  ON token_usage FOR UPDATE
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Anyone can delete token_usage"
  ON token_usage FOR DELETE
  USING (true);

-- Drop existing restrictive policies for ai_team_members
DROP POLICY IF EXISTS "Authenticated users can insert ai_team_members" ON ai_team_members;
DROP POLICY IF EXISTS "Authenticated users can update ai_team_members" ON ai_team_members;
DROP POLICY IF EXISTS "Authenticated users can delete ai_team_members" ON ai_team_members;

-- Create public access policies for ai_team_members
CREATE POLICY "Anyone can insert ai_team_members"
  ON ai_team_members FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Anyone can update ai_team_members"
  ON ai_team_members FOR UPDATE
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Anyone can delete ai_team_members"
  ON ai_team_members FOR DELETE
  USING (true);
