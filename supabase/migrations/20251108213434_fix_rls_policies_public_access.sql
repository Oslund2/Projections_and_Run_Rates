/*
  # Fix RLS Policies for Public Access

  ## Overview
  Updates Row Level Security policies for the advanced analytics tables to allow
  public access, matching the pattern used in the original tables.

  ## Changes
  - Drop existing authenticated-only policies
  - Create new public access policies for all tables
  - Allows anonymous users to perform CRUD operations

  ## Security Note
  This configuration is appropriate for development and single-tenant deployments.
  For multi-tenant production use, implement proper authentication policies.
*/

-- Drop existing restrictive policies
DROP POLICY IF EXISTS "Authenticated users can insert snapshots" ON historical_snapshots;
DROP POLICY IF EXISTS "Authenticated users can insert goals" ON agent_goals;
DROP POLICY IF EXISTS "Authenticated users can update goals" ON agent_goals;
DROP POLICY IF EXISTS "Authenticated users can delete goals" ON agent_goals;
DROP POLICY IF EXISTS "Authenticated users can insert alerts" ON performance_alerts;
DROP POLICY IF EXISTS "Authenticated users can update alerts" ON performance_alerts;
DROP POLICY IF EXISTS "Authenticated users can delete alerts" ON performance_alerts;
DROP POLICY IF EXISTS "Authenticated users can insert costs" ON agent_costs;
DROP POLICY IF EXISTS "Authenticated users can update costs" ON agent_costs;
DROP POLICY IF EXISTS "Authenticated users can delete costs" ON agent_costs;
DROP POLICY IF EXISTS "Authenticated users can insert scenarios" ON saved_scenarios;
DROP POLICY IF EXISTS "Authenticated users can update scenarios" ON saved_scenarios;
DROP POLICY IF EXISTS "Authenticated users can delete scenarios" ON saved_scenarios;
DROP POLICY IF EXISTS "Authenticated users can insert annotations" ON annotations;
DROP POLICY IF EXISTS "Authenticated users can update annotations" ON annotations;
DROP POLICY IF EXISTS "Authenticated users can delete annotations" ON annotations;

-- Create public access policies for historical_snapshots
CREATE POLICY "Anyone can insert snapshots"
  ON historical_snapshots FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Anyone can delete snapshots"
  ON historical_snapshots FOR DELETE
  USING (true);

-- Create public access policies for agent_goals
CREATE POLICY "Anyone can insert goals"
  ON agent_goals FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Anyone can update goals"
  ON agent_goals FOR UPDATE
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Anyone can delete goals"
  ON agent_goals FOR DELETE
  USING (true);

-- Create public access policies for performance_alerts
CREATE POLICY "Anyone can insert alerts"
  ON performance_alerts FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Anyone can update alerts"
  ON performance_alerts FOR UPDATE
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Anyone can delete alerts"
  ON performance_alerts FOR DELETE
  USING (true);

-- Create public access policies for agent_costs
CREATE POLICY "Anyone can insert costs"
  ON agent_costs FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Anyone can update costs"
  ON agent_costs FOR UPDATE
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Anyone can delete costs"
  ON agent_costs FOR DELETE
  USING (true);

-- Create public access policies for saved_scenarios
CREATE POLICY "Anyone can insert scenarios"
  ON saved_scenarios FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Anyone can update scenarios"
  ON saved_scenarios FOR UPDATE
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Anyone can delete scenarios"
  ON saved_scenarios FOR DELETE
  USING (true);

-- Create public access policies for annotations
CREATE POLICY "Anyone can insert annotations"
  ON annotations FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Anyone can update annotations"
  ON annotations FOR UPDATE
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Anyone can delete annotations"
  ON annotations FOR DELETE
  USING (true);
