/*
  # AI Agent Run Rate & ROI Calculator - Initial Schema

  ## Overview
  This migration creates the foundational database structure for tracking AI agent
  performance through run rate studies and calculating ROI metrics with projected vs actual tracking.

  ## New Tables

  ### 1. `agents`
  Stores information about AI agents being evaluated
  - `id` (uuid, primary key) - Unique identifier for each agent
  - `name` (text, required) - Agent name (e.g., "All Broadcast Conversion")
  - `category` (text) - Agent category/type (e.g., "News")
  - `description` (text) - Detailed description of agent capabilities
  - `status` (text, default: 'active') - Agent status (active, inactive, archived)
  - `created_at` (timestamptz) - Creation timestamp
  - `updated_at` (timestamptz) - Last update timestamp

  ### 2. `time_motion_studies`
  Captures individual run rate study data for actual vs projected tracking
  - `id` (uuid, primary key) - Unique study identifier
  - `agent_id` (uuid, foreign key) - Reference to agents table
  - `task_description` (text, required) - Description of task being measured
  - `time_without_ai_minutes` (numeric, required) - Time to complete task manually
  - `time_with_ai_minutes` (numeric, required) - Time to complete task with AI
  - `usage_count` (integer, required) - Number of times task performed
  - `usage_discount_percent` (numeric, default: 50) - Usage discount percentage (0-100)
  - `cost_per_hour` (numeric, required) - Average cost per employee hour
  - `time_saved_minutes` (numeric) - Calculated: time_without_ai - time_with_ai
  - `net_usage` (numeric) - Calculated: usage_count * (1 - usage_discount_percent/100)
  - `net_time_saved_hours` (numeric) - Calculated: (time_saved_minutes * net_usage) / 60
  - `potential_savings` (numeric) - Calculated: net_time_saved_hours * cost_per_hour
  - `study_date` (date, default: today) - Date study was conducted
  - `notes` (text) - Additional notes or observations
  - `created_at` (timestamptz) - Creation timestamp
  - `updated_at` (timestamptz) - Last update timestamp
  - `created_by` (text) - User who created the study

  ### 3. `study_variables`
  Stores global default variables for calculations
  - `id` (uuid, primary key) - Unique identifier
  - `variable_name` (text, unique, required) - Variable identifier
  - `variable_value` (numeric, required) - Current value
  - `description` (text) - Description of what variable controls
  - `updated_at` (timestamptz) - Last update timestamp

  ### 4. `agent_summaries`
  Materialized view for pre-computed agent-level aggregations (implemented as table with triggers)
  - `agent_id` (uuid, primary key) - Reference to agents table
  - `total_studies` (integer) - Count of studies for this agent
  - `total_time_saved_hours` (numeric) - Sum of net_time_saved_hours
  - `total_potential_savings` (numeric) - Sum of potential_savings
  - `avg_time_saved_per_study` (numeric) - Average time saved per study
  - `last_study_date` (date) - Most recent study date
  - `updated_at` (timestamptz) - Last recalculation timestamp

  ## Security
  - Enable RLS on all tables
  - Add policies for authenticated users to perform CRUD operations
  - Studies are associated with creators for audit trail

  ## Indexes
  - Index on agent_id for fast study lookups
  - Index on study_date for time-based filtering
  - Index on created_at for sorting

  ## Important Notes
  1. All monetary values stored as numeric for precision
  2. Time values stored in minutes for consistency, converted to hours for display
  3. Calculated fields are stored to avoid repeated computation
  4. Usage discount stored as percentage (0-100) for clarity
*/

-- Create agents table
CREATE TABLE IF NOT EXISTS agents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  category text,
  description text,
  status text DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'archived')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create time_motion_studies table
CREATE TABLE IF NOT EXISTS time_motion_studies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id uuid NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
  task_description text NOT NULL,
  time_without_ai_minutes numeric NOT NULL CHECK (time_without_ai_minutes >= 0),
  time_with_ai_minutes numeric NOT NULL CHECK (time_with_ai_minutes >= 0),
  usage_count integer NOT NULL CHECK (usage_count >= 0),
  usage_discount_percent numeric DEFAULT 50 CHECK (usage_discount_percent >= 0 AND usage_discount_percent <= 100),
  cost_per_hour numeric NOT NULL CHECK (cost_per_hour >= 0),
  time_saved_minutes numeric,
  net_usage numeric,
  net_time_saved_hours numeric,
  potential_savings numeric,
  study_date date DEFAULT CURRENT_DATE,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  created_by text
);

-- Create study_variables table
CREATE TABLE IF NOT EXISTS study_variables (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  variable_name text UNIQUE NOT NULL,
  variable_value numeric NOT NULL,
  description text,
  updated_at timestamptz DEFAULT now()
);

-- Create agent_summaries table
CREATE TABLE IF NOT EXISTS agent_summaries (
  agent_id uuid PRIMARY KEY REFERENCES agents(id) ON DELETE CASCADE,
  total_studies integer DEFAULT 0,
  total_time_saved_hours numeric DEFAULT 0,
  total_potential_savings numeric DEFAULT 0,
  avg_time_saved_per_study numeric DEFAULT 0,
  last_study_date date,
  updated_at timestamptz DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_studies_agent_id ON time_motion_studies(agent_id);
CREATE INDEX IF NOT EXISTS idx_studies_study_date ON time_motion_studies(study_date);
CREATE INDEX IF NOT EXISTS idx_studies_created_at ON time_motion_studies(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_agents_status ON agents(status);

-- Enable Row Level Security
ALTER TABLE agents ENABLE ROW LEVEL SECURITY;
ALTER TABLE time_motion_studies ENABLE ROW LEVEL SECURITY;
ALTER TABLE study_variables ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_summaries ENABLE ROW LEVEL SECURITY;

-- RLS Policies for agents table
CREATE POLICY "Anyone can view agents"
  ON agents FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can insert agents"
  ON agents FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update agents"
  ON agents FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete agents"
  ON agents FOR DELETE
  TO authenticated
  USING (true);

-- RLS Policies for time_motion_studies table
CREATE POLICY "Anyone can view studies"
  ON time_motion_studies FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can insert studies"
  ON time_motion_studies FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update studies"
  ON time_motion_studies FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete studies"
  ON time_motion_studies FOR DELETE
  TO authenticated
  USING (true);

-- RLS Policies for study_variables table
CREATE POLICY "Anyone can view variables"
  ON study_variables FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can insert variables"
  ON study_variables FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update variables"
  ON study_variables FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete variables"
  ON study_variables FOR DELETE
  TO authenticated
  USING (true);

-- RLS Policies for agent_summaries table
CREATE POLICY "Anyone can view summaries"
  ON agent_summaries FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can insert summaries"
  ON agent_summaries FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update summaries"
  ON agent_summaries FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Function to calculate study metrics
CREATE OR REPLACE FUNCTION calculate_study_metrics()
RETURNS TRIGGER AS $$
BEGIN
  -- Calculate time saved in minutes
  NEW.time_saved_minutes := NEW.time_without_ai_minutes - NEW.time_with_ai_minutes;
  
  -- Calculate net usage (apply discount)
  NEW.net_usage := NEW.usage_count * (1 - NEW.usage_discount_percent / 100.0);
  
  -- Calculate net time saved in hours
  NEW.net_time_saved_hours := (NEW.time_saved_minutes * NEW.net_usage) / 60.0;
  
  -- Calculate potential savings
  NEW.potential_savings := NEW.net_time_saved_hours * NEW.cost_per_hour;
  
  -- Update timestamp
  NEW.updated_at := now();
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-calculate study metrics on insert/update
CREATE TRIGGER calculate_metrics_trigger
  BEFORE INSERT OR UPDATE ON time_motion_studies
  FOR EACH ROW
  EXECUTE FUNCTION calculate_study_metrics();

-- Function to update agent summaries
CREATE OR REPLACE FUNCTION update_agent_summary()
RETURNS TRIGGER AS $$
BEGIN
  -- Insert or update agent summary
  INSERT INTO agent_summaries (
    agent_id,
    total_studies,
    total_time_saved_hours,
    total_potential_savings,
    avg_time_saved_per_study,
    last_study_date,
    updated_at
  )
  SELECT
    agent_id,
    COUNT(*) as total_studies,
    SUM(net_time_saved_hours) as total_time_saved_hours,
    SUM(potential_savings) as total_potential_savings,
    AVG(net_time_saved_hours) as avg_time_saved_per_study,
    MAX(study_date) as last_study_date,
    now() as updated_at
  FROM time_motion_studies
  WHERE agent_id = COALESCE(NEW.agent_id, OLD.agent_id)
  GROUP BY agent_id
  ON CONFLICT (agent_id)
  DO UPDATE SET
    total_studies = EXCLUDED.total_studies,
    total_time_saved_hours = EXCLUDED.total_time_saved_hours,
    total_potential_savings = EXCLUDED.total_potential_savings,
    avg_time_saved_per_study = EXCLUDED.avg_time_saved_per_study,
    last_study_date = EXCLUDED.last_study_date,
    updated_at = EXCLUDED.updated_at;
  
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update agent summaries after study changes
CREATE TRIGGER update_summary_trigger
  AFTER INSERT OR UPDATE OR DELETE ON time_motion_studies
  FOR EACH ROW
  EXECUTE FUNCTION update_agent_summary();

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at on agents
CREATE TRIGGER update_agents_updated_at
  BEFORE UPDATE ON agents
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Insert default study variables
INSERT INTO study_variables (variable_name, variable_value, description)
VALUES 
  ('default_usage_discount_percent', 50, 'Default usage discount percentage applied to new studies'),
  ('default_cost_per_hour', 20, 'Default average cost per employee hour for calculations')
ON CONFLICT (variable_name) DO NOTHING;

-- Insert sample data for demonstration
INSERT INTO agents (name, category, description, status)
VALUES
  ('All Broadcast Conversion', 'News', 'Converts print or digital articles into broadcast-ready formats', 'active'),
  ('All Digital Conversion', 'News', 'Converts broadcast content into digital article formats', 'active')
ON CONFLICT DO NOTHING;