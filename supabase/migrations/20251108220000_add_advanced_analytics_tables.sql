/*
  # Advanced Analytics and Features for AI ROI Tracking

  ## Overview
  This migration adds tables and functions to support advanced analytics features including:
  - Historical trend tracking and forecasting
  - Goal setting and performance tracking
  - Performance alerts and notifications
  - Total Cost of Ownership (TCO) tracking
  - Scenario planning and what-if analysis
  - Collaboration through annotations

  ## New Tables

  ### 1. `historical_snapshots`
  Stores daily/weekly/monthly aggregate snapshots for trend analysis
  - `id` (uuid, primary key) - Unique identifier
  - `agent_id` (uuid, foreign key, nullable) - Reference to specific agent or NULL for global
  - `snapshot_date` (date) - Date of snapshot
  - `snapshot_type` (text) - Type: 'daily', 'weekly', 'monthly'
  - `total_studies` (integer) - Number of studies at this point
  - `total_time_saved_hours` (numeric) - Cumulative time saved
  - `total_cost_savings` (numeric) - Cumulative cost savings
  - `active_agents` (integer) - Number of active agents
  - `created_at` (timestamptz) - When snapshot was created

  ### 2. `agent_goals`
  Tracks goals and targets for individual agents or organization-wide
  - `id` (uuid, primary key) - Unique identifier
  - `agent_id` (uuid, foreign key, nullable) - Reference to agent or NULL for org-wide
  - `goal_type` (text) - Type: 'time_saved', 'cost_saved', 'study_count', 'fte_impact'
  - `target_value` (numeric) - Goal target value
  - `target_date` (date) - Date by which goal should be achieved
  - `current_value` (numeric) - Current progress value
  - `status` (text) - Status: 'on_track', 'at_risk', 'behind', 'achieved', 'cancelled'
  - `created_at` (timestamptz) - When goal was created
  - `updated_at` (timestamptz) - Last update timestamp

  ### 3. `performance_alerts`
  Tracks performance alerts and notifications
  - `id` (uuid, primary key) - Unique identifier
  - `agent_id` (uuid, foreign key) - Reference to agent
  - `alert_type` (text) - Type: 'degradation', 'outlier', 'validation_needed', 'goal_at_risk'
  - `severity` (text) - Severity: 'low', 'medium', 'high', 'critical'
  - `message` (text) - Alert message
  - `details` (jsonb) - Additional details as JSON
  - `status` (text) - Status: 'active', 'acknowledged', 'resolved', 'dismissed'
  - `created_at` (timestamptz) - When alert was created
  - `resolved_at` (timestamptz) - When alert was resolved

  ### 4. `agent_costs`
  Tracks implementation and operational costs for Total Cost of Ownership
  - `id` (uuid, primary key) - Unique identifier
  - `agent_id` (uuid, foreign key) - Reference to agent
  - `cost_type` (text) - Type: 'licensing', 'training', 'maintenance', 'implementation', 'other'
  - `cost_amount` (numeric) - Cost amount
  - `cost_frequency` (text) - Frequency: 'one_time', 'monthly', 'annual'
  - `start_date` (date) - When cost starts
  - `end_date` (date, nullable) - When cost ends (NULL for ongoing)
  - `description` (text) - Description of cost
  - `created_at` (timestamptz) - Creation timestamp
  - `updated_at` (timestamptz) - Last update timestamp

  ### 5. `saved_scenarios`
  Stores scenario planning configurations for what-if analysis
  - `id` (uuid, primary key) - Unique identifier
  - `scenario_name` (text) - Name of scenario
  - `description` (text) - Description
  - `scenario_data` (jsonb) - JSON containing scenario parameters
  - `created_by` (text) - User who created scenario
  - `created_at` (timestamptz) - Creation timestamp
  - `updated_at` (timestamptz) - Last update timestamp

  ### 6. `annotations`
  Enables collaboration through comments and notes on data points
  - `id` (uuid, primary key) - Unique identifier
  - `reference_type` (text) - Type: 'agent', 'study', 'goal', 'dashboard'
  - `reference_id` (uuid) - ID of referenced entity
  - `content` (text) - Annotation content
  - `created_by` (text) - User who created annotation
  - `created_at` (timestamptz) - Creation timestamp
  - `updated_at` (timestamptz) - Last update timestamp

  ## Security
  - Enable RLS on all tables
  - Public read access for viewing data
  - Authenticated users can create, update, and delete

  ## Indexes
  - Indexes on foreign keys for performance
  - Indexes on date fields for time-based queries
  - Indexes on status fields for filtering
*/

-- Create historical_snapshots table
CREATE TABLE IF NOT EXISTS historical_snapshots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id uuid REFERENCES agents(id) ON DELETE CASCADE,
  snapshot_date date NOT NULL,
  snapshot_type text NOT NULL CHECK (snapshot_type IN ('daily', 'weekly', 'monthly')),
  total_studies integer DEFAULT 0,
  total_time_saved_hours numeric DEFAULT 0,
  total_cost_savings numeric DEFAULT 0,
  active_agents integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- Create agent_goals table
CREATE TABLE IF NOT EXISTS agent_goals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id uuid REFERENCES agents(id) ON DELETE CASCADE,
  goal_type text NOT NULL CHECK (goal_type IN ('time_saved', 'cost_saved', 'study_count', 'fte_impact')),
  target_value numeric NOT NULL CHECK (target_value >= 0),
  target_date date NOT NULL,
  current_value numeric DEFAULT 0,
  status text DEFAULT 'on_track' CHECK (status IN ('on_track', 'at_risk', 'behind', 'achieved', 'cancelled')),
  description text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create performance_alerts table
CREATE TABLE IF NOT EXISTS performance_alerts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id uuid REFERENCES agents(id) ON DELETE CASCADE,
  alert_type text NOT NULL CHECK (alert_type IN ('degradation', 'outlier', 'validation_needed', 'goal_at_risk', 'data_quality')),
  severity text NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  message text NOT NULL,
  details jsonb,
  status text DEFAULT 'active' CHECK (status IN ('active', 'acknowledged', 'resolved', 'dismissed')),
  created_at timestamptz DEFAULT now(),
  resolved_at timestamptz
);

-- Create agent_costs table
CREATE TABLE IF NOT EXISTS agent_costs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id uuid NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
  cost_type text NOT NULL CHECK (cost_type IN ('licensing', 'training', 'maintenance', 'implementation', 'other')),
  cost_amount numeric NOT NULL CHECK (cost_amount >= 0),
  cost_frequency text NOT NULL CHECK (cost_frequency IN ('one_time', 'monthly', 'annual')),
  start_date date NOT NULL,
  end_date date,
  description text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create saved_scenarios table
CREATE TABLE IF NOT EXISTS saved_scenarios (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  scenario_name text NOT NULL,
  description text,
  scenario_data jsonb NOT NULL,
  created_by text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create annotations table
CREATE TABLE IF NOT EXISTS annotations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reference_type text NOT NULL CHECK (reference_type IN ('agent', 'study', 'goal', 'dashboard', 'alert')),
  reference_id uuid NOT NULL,
  content text NOT NULL,
  created_by text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_snapshots_agent_date ON historical_snapshots(agent_id, snapshot_date DESC);
CREATE INDEX IF NOT EXISTS idx_snapshots_date ON historical_snapshots(snapshot_date DESC);
CREATE INDEX IF NOT EXISTS idx_snapshots_type ON historical_snapshots(snapshot_type);

CREATE INDEX IF NOT EXISTS idx_goals_agent ON agent_goals(agent_id);
CREATE INDEX IF NOT EXISTS idx_goals_status ON agent_goals(status);
CREATE INDEX IF NOT EXISTS idx_goals_target_date ON agent_goals(target_date);

CREATE INDEX IF NOT EXISTS idx_alerts_agent ON performance_alerts(agent_id);
CREATE INDEX IF NOT EXISTS idx_alerts_status ON performance_alerts(status);
CREATE INDEX IF NOT EXISTS idx_alerts_severity ON performance_alerts(severity);
CREATE INDEX IF NOT EXISTS idx_alerts_created ON performance_alerts(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_costs_agent ON agent_costs(agent_id);
CREATE INDEX IF NOT EXISTS idx_costs_start_date ON agent_costs(start_date);

CREATE INDEX IF NOT EXISTS idx_annotations_reference ON annotations(reference_type, reference_id);
CREATE INDEX IF NOT EXISTS idx_annotations_created ON annotations(created_at DESC);

-- Enable Row Level Security
ALTER TABLE historical_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE performance_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_costs ENABLE ROW LEVEL SECURITY;
ALTER TABLE saved_scenarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE annotations ENABLE ROW LEVEL SECURITY;

-- RLS Policies for historical_snapshots
CREATE POLICY "Anyone can view snapshots"
  ON historical_snapshots FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can insert snapshots"
  ON historical_snapshots FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete snapshots"
  ON historical_snapshots FOR DELETE
  TO authenticated
  USING (true);

-- RLS Policies for agent_goals
CREATE POLICY "Anyone can view goals"
  ON agent_goals FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can insert goals"
  ON agent_goals FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update goals"
  ON agent_goals FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete goals"
  ON agent_goals FOR DELETE
  TO authenticated
  USING (true);

-- RLS Policies for performance_alerts
CREATE POLICY "Anyone can view alerts"
  ON performance_alerts FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can insert alerts"
  ON performance_alerts FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update alerts"
  ON performance_alerts FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete alerts"
  ON performance_alerts FOR DELETE
  TO authenticated
  USING (true);

-- RLS Policies for agent_costs
CREATE POLICY "Anyone can view costs"
  ON agent_costs FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can insert costs"
  ON agent_costs FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update costs"
  ON agent_costs FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete costs"
  ON agent_costs FOR DELETE
  TO authenticated
  USING (true);

-- RLS Policies for saved_scenarios
CREATE POLICY "Anyone can view scenarios"
  ON saved_scenarios FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can insert scenarios"
  ON saved_scenarios FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update scenarios"
  ON saved_scenarios FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete scenarios"
  ON saved_scenarios FOR DELETE
  TO authenticated
  USING (true);

-- RLS Policies for annotations
CREATE POLICY "Anyone can view annotations"
  ON annotations FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can insert annotations"
  ON annotations FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update annotations"
  ON annotations FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete annotations"
  ON annotations FOR DELETE
  TO authenticated
  USING (true);

-- Trigger for updated_at on agent_goals
CREATE TRIGGER update_goals_updated_at
  BEFORE UPDATE ON agent_goals
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Trigger for updated_at on agent_costs
CREATE TRIGGER update_costs_updated_at
  BEFORE UPDATE ON agent_costs
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Trigger for updated_at on saved_scenarios
CREATE TRIGGER update_scenarios_updated_at
  BEFORE UPDATE ON saved_scenarios
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Trigger for updated_at on annotations
CREATE TRIGGER update_annotations_updated_at
  BEFORE UPDATE ON annotations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Function to create daily snapshots
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
    active_agents
  )
  SELECT
    NULL as agent_id,
    CURRENT_DATE as snapshot_date,
    'daily' as snapshot_type,
    COUNT(DISTINCT tms.id) as total_studies,
    COALESCE(SUM(tms.net_time_saved_hours), 0) as total_time_saved_hours,
    COALESCE(SUM(tms.potential_savings), 0) as total_cost_savings,
    COUNT(DISTINCT a.id) as active_agents
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
    active_agents
  )
  SELECT
    a.id as agent_id,
    CURRENT_DATE as snapshot_date,
    'daily' as snapshot_type,
    COUNT(tms.id) as total_studies,
    COALESCE(SUM(tms.net_time_saved_hours), 0) as total_time_saved_hours,
    COALESCE(SUM(tms.potential_savings), 0) as total_cost_savings,
    1 as active_agents
  FROM agents a
  LEFT JOIN time_motion_studies tms ON a.id = tms.agent_id
  WHERE a.status = 'active'
  GROUP BY a.id;
END;
$$ LANGUAGE plpgsql;

-- Function to update goal progress
CREATE OR REPLACE FUNCTION update_goal_progress()
RETURNS void AS $$
BEGIN
  -- Update goals for agents with time_saved target
  UPDATE agent_goals g
  SET
    current_value = COALESCE(
      (SELECT SUM(net_time_saved_hours)
       FROM time_motion_studies
       WHERE agent_id = g.agent_id),
      0
    ),
    status = CASE
      WHEN g.current_value >= g.target_value THEN 'achieved'
      WHEN g.target_date < CURRENT_DATE THEN 'behind'
      WHEN g.current_value < g.target_value * 0.5 AND g.target_date < CURRENT_DATE + INTERVAL '30 days' THEN 'at_risk'
      ELSE 'on_track'
    END,
    updated_at = now()
  WHERE g.goal_type = 'time_saved'
    AND g.status != 'cancelled'
    AND g.agent_id IS NOT NULL;

  -- Update goals for agents with cost_saved target
  UPDATE agent_goals g
  SET
    current_value = COALESCE(
      (SELECT SUM(potential_savings)
       FROM time_motion_studies
       WHERE agent_id = g.agent_id),
      0
    ),
    status = CASE
      WHEN g.current_value >= g.target_value THEN 'achieved'
      WHEN g.target_date < CURRENT_DATE THEN 'behind'
      WHEN g.current_value < g.target_value * 0.5 AND g.target_date < CURRENT_DATE + INTERVAL '30 days' THEN 'at_risk'
      ELSE 'on_track'
    END,
    updated_at = now()
  WHERE g.goal_type = 'cost_saved'
    AND g.status != 'cancelled'
    AND g.agent_id IS NOT NULL;

  -- Update goals for agents with study_count target
  UPDATE agent_goals g
  SET
    current_value = COALESCE(
      (SELECT COUNT(*)
       FROM time_motion_studies
       WHERE agent_id = g.agent_id),
      0
    ),
    status = CASE
      WHEN g.current_value >= g.target_value THEN 'achieved'
      WHEN g.target_date < CURRENT_DATE THEN 'behind'
      WHEN g.current_value < g.target_value * 0.5 AND g.target_date < CURRENT_DATE + INTERVAL '30 days' THEN 'at_risk'
      ELSE 'on_track'
    END,
    updated_at = now()
  WHERE g.goal_type = 'study_count'
    AND g.status != 'cancelled'
    AND g.agent_id IS NOT NULL;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update goal progress when studies change
CREATE OR REPLACE FUNCTION trigger_goal_update()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM update_goal_progress();
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_goals_on_study_change
  AFTER INSERT OR UPDATE OR DELETE ON time_motion_studies
  FOR EACH STATEMENT
  EXECUTE FUNCTION trigger_goal_update();
