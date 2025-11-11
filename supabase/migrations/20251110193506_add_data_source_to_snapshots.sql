/*
  # Add Data Source Tracking to Historical Snapshots

  ## Overview
  This migration adds the ability to track whether snapshot data is synthetic (AI-generated)
  or real (from actual time-motion studies). This enables users to manage, filter, and 
  switch between different data sources for forecasting.

  ## Changes

  1. New Column
    - `data_source` (text) - Tracks the origin of the snapshot data
      - 'synthetic' - AI-generated sample data
      - 'real' - Data from actual time-motion studies
      - 'manual' - Manually entered data
      - Default: 'real'

  2. Data Migration
    - Update existing records without a data_source to 'synthetic' if they appear to be
      generated data, or 'real' if they came from the create_daily_snapshot function
    - For simplicity, we'll mark all existing data as 'synthetic' since the user mentioned
      they generated synthetic data and want to manage it

  3. Function Updates
    - Update create_daily_snapshot() to mark new snapshots as 'real'
    - Add constraint to ensure data_source has valid values

  ## Security
  - No changes to RLS policies needed
  - Existing policies continue to apply
*/

-- Add data_source column to historical_snapshots
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'historical_snapshots' AND column_name = 'data_source'
  ) THEN
    ALTER TABLE historical_snapshots 
    ADD COLUMN data_source text DEFAULT 'real' 
    CHECK (data_source IN ('synthetic', 'real', 'manual'));
  END IF;
END $$;

-- Update existing records to mark them as synthetic (since user generated sample data)
UPDATE historical_snapshots
SET data_source = 'synthetic'
WHERE data_source IS NULL;

-- Update the create_daily_snapshot function to mark snapshots as 'real'
CREATE OR REPLACE FUNCTION create_daily_snapshot()
RETURNS void AS $$
BEGIN
  -- Create global snapshot
  INSERT INTO historical_snapshots (
    agent_id,
    snapshot_date,
    snapshot_type,
    total_studies,
    total_time_saved_hours,
    total_cost_savings,
    active_agents,
    data_source
  )
  SELECT
    NULL as agent_id,
    CURRENT_DATE as snapshot_date,
    'daily' as snapshot_type,
    COUNT(DISTINCT tms.id) as total_studies,
    COALESCE(SUM(tms.net_time_saved_hours), 0) as total_time_saved_hours,
    COALESCE(SUM(tms.potential_savings), 0) as total_cost_savings,
    COUNT(DISTINCT a.id) as active_agents,
    'real' as data_source
  FROM agents a
  LEFT JOIN time_motion_studies tms ON a.id = tms.agent_id
  WHERE a.status = 'active';

  -- Create per-agent snapshots
  INSERT INTO historical_snapshots (
    agent_id,
    snapshot_date,
    snapshot_type,
    total_studies,
    total_time_saved_hours,
    total_cost_savings,
    active_agents,
    data_source
  )
  SELECT
    a.id as agent_id,
    CURRENT_DATE as snapshot_date,
    'daily' as snapshot_type,
    COUNT(tms.id) as total_studies,
    COALESCE(SUM(tms.net_time_saved_hours), 0) as total_time_saved_hours,
    COALESCE(SUM(tms.potential_savings), 0) as total_cost_savings,
    1 as active_agents,
    'real' as data_source
  FROM agents a
  LEFT JOIN time_motion_studies tms ON a.id = tms.agent_id
  WHERE a.status = 'active'
  GROUP BY a.id;
END;
$$ LANGUAGE plpgsql;

-- Create index on data_source for filtering performance
CREATE INDEX IF NOT EXISTS idx_snapshots_data_source ON historical_snapshots(data_source);
