/*
  # Multi-Division and Cost Tracking Schema

  ## Overview
  This migration adds support for multi-division organizations with budget owner separation,
  AI program cost tracking (platform, tokens, team FTEs), and enhanced agent lifecycle management.

  ## New Tables

  ### `divisions`
  Organizational divisions/departments for grouping agents by budget owner.
  - `id` (uuid, primary key) - Unique identifier
  - `name` (text) - Division name (e.g., "News", "HR", "Legal")
  - `description` (text) - Division description
  - `parent_id` (uuid, nullable) - Parent division for hierarchy support
  - `budget_owner` (text) - Name of budget owner for this division
  - `created_at` (timestamptz) - Creation timestamp

  ### `cost_centers`
  Financial tracking for budget allocation across divisions.
  - `id` (uuid, primary key) - Unique identifier
  - `division_id` (uuid) - Associated division
  - `name` (text) - Cost center name
  - `code` (text) - Cost center code for accounting
  - `created_at` (timestamptz) - Creation timestamp

  ### `platform_costs`
  Monthly AI platform subscription and infrastructure costs.
  - `id` (uuid, primary key) - Unique identifier
  - `division_id` (uuid, nullable) - Division allocation (null for shared costs)
  - `cost_type` (text) - Type of cost (e.g., "subscription", "infrastructure")
  - `month` (date) - Month for this cost entry
  - `amount` (numeric) - Cost amount in dollars
  - `description` (text) - Description of the cost
  - `created_at` (timestamptz) - Creation timestamp

  ### `token_usage`
  Token consumption and costs per agent per month.
  - `id` (uuid, primary key) - Unique identifier
  - `agent_id` (uuid) - Associated agent
  - `month` (date) - Month for this usage
  - `token_count` (bigint) - Number of tokens consumed
  - `cost` (numeric) - Token cost in dollars
  - `notes` (text) - Additional notes
  - `created_at` (timestamptz) - Creation timestamp

  ### `ai_team_members`
  AI team FTE allocation and fully loaded costs.
  - `id` (uuid, primary key) - Unique identifier
  - `name` (text) - Team member name
  - `role` (text) - Role (e.g., "AI Engineer", "ML Engineer")
  - `fte_percentage` (numeric) - Percentage allocated to AI program (0-100)
  - `monthly_cost` (numeric) - Fully loaded monthly cost
  - `division_id` (uuid, nullable) - Primary division assignment
  - `start_date` (date) - Start date on AI team
  - `end_date` (date, nullable) - End date (null if active)
  - `created_at` (timestamptz) - Creation timestamp

  ## Modified Tables

  ### `agents`
  Added fields for division assignment, lifecycle status, and build prioritization:
  - `division_id` (uuid, nullable) - Division assignment
  - `lifecycle_status` (text) - Lifecycle status (concept, planned, in_development, pilot, production, retired)
  - `build_effort_hours` (numeric) - Estimated build effort in hours
  - `strategic_value_score` (integer) - Strategic value rating 1-10
  - `priority_score` (numeric) - Calculated priority score
  - `projection_methodology` (text) - Documentation of projection assumptions
  - `confidence_level` (text) - Confidence level (low, medium, high)
  - `validation_status` (text) - Validation status (insufficient, partial, validated)

  ### `time_motion_studies`
  Added fields for study workflow and quality:
  - `study_status` (text) - Status (planned, in_progress, completed, rejected)
  - `assigned_to` (text) - Person responsible for study
  - `quality_rating` (integer) - Study quality rating 1-5
  - `study_template` (text) - Template used for study methodology
  - `lessons_learned` (text) - Lessons learned and notes

  ## Security
  - Enable RLS on all new tables
  - Add policies for public read access (matching existing pattern)
  - Add policies for authenticated insert/update/delete operations

  ## Important Notes
  1. Division hierarchy supports multi-level organizational structures
  2. Cost allocation can be division-specific or shared (null division_id)
  3. Agent lifecycle_status follows standard lifecycle: concept → planned → in_development → pilot → production → retired
  4. Confidence and validation status calculated based on study coverage
  5. All monetary values stored as numeric for precision
*/

-- Create divisions table
CREATE TABLE IF NOT EXISTS divisions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text DEFAULT '',
  parent_id uuid REFERENCES divisions(id) ON DELETE SET NULL,
  budget_owner text NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE divisions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view divisions"
  ON divisions FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can insert divisions"
  ON divisions FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update divisions"
  ON divisions FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete divisions"
  ON divisions FOR DELETE
  TO authenticated
  USING (true);

-- Create cost_centers table
CREATE TABLE IF NOT EXISTS cost_centers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  division_id uuid REFERENCES divisions(id) ON DELETE CASCADE,
  name text NOT NULL,
  code text NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE cost_centers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view cost_centers"
  ON cost_centers FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can insert cost_centers"
  ON cost_centers FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update cost_centers"
  ON cost_centers FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete cost_centers"
  ON cost_centers FOR DELETE
  TO authenticated
  USING (true);

-- Create platform_costs table
CREATE TABLE IF NOT EXISTS platform_costs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  division_id uuid REFERENCES divisions(id) ON DELETE SET NULL,
  cost_type text NOT NULL,
  month date NOT NULL,
  amount numeric NOT NULL DEFAULT 0,
  description text DEFAULT '',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE platform_costs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view platform_costs"
  ON platform_costs FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can insert platform_costs"
  ON platform_costs FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update platform_costs"
  ON platform_costs FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete platform_costs"
  ON platform_costs FOR DELETE
  TO authenticated
  USING (true);

-- Create token_usage table
CREATE TABLE IF NOT EXISTS token_usage (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id uuid REFERENCES agents(id) ON DELETE CASCADE,
  month date NOT NULL,
  token_count bigint NOT NULL DEFAULT 0,
  cost numeric NOT NULL DEFAULT 0,
  notes text DEFAULT '',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE token_usage ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view token_usage"
  ON token_usage FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can insert token_usage"
  ON token_usage FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update token_usage"
  ON token_usage FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete token_usage"
  ON token_usage FOR DELETE
  TO authenticated
  USING (true);

-- Create ai_team_members table
CREATE TABLE IF NOT EXISTS ai_team_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  role text NOT NULL,
  fte_percentage numeric NOT NULL DEFAULT 100,
  monthly_cost numeric NOT NULL DEFAULT 0,
  division_id uuid REFERENCES divisions(id) ON DELETE SET NULL,
  start_date date NOT NULL DEFAULT CURRENT_DATE,
  end_date date,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE ai_team_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view ai_team_members"
  ON ai_team_members FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can insert ai_team_members"
  ON ai_team_members FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update ai_team_members"
  ON ai_team_members FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete ai_team_members"
  ON ai_team_members FOR DELETE
  TO authenticated
  USING (true);

-- Add new columns to agents table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'agents' AND column_name = 'division_id'
  ) THEN
    ALTER TABLE agents ADD COLUMN division_id uuid REFERENCES divisions(id) ON DELETE SET NULL;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'agents' AND column_name = 'lifecycle_status'
  ) THEN
    ALTER TABLE agents ADD COLUMN lifecycle_status text DEFAULT 'production';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'agents' AND column_name = 'build_effort_hours'
  ) THEN
    ALTER TABLE agents ADD COLUMN build_effort_hours numeric DEFAULT 0;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'agents' AND column_name = 'strategic_value_score'
  ) THEN
    ALTER TABLE agents ADD COLUMN strategic_value_score integer DEFAULT 5;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'agents' AND column_name = 'priority_score'
  ) THEN
    ALTER TABLE agents ADD COLUMN priority_score numeric DEFAULT 0;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'agents' AND column_name = 'projection_methodology'
  ) THEN
    ALTER TABLE agents ADD COLUMN projection_methodology text DEFAULT '';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'agents' AND column_name = 'confidence_level'
  ) THEN
    ALTER TABLE agents ADD COLUMN confidence_level text DEFAULT 'low';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'agents' AND column_name = 'validation_status'
  ) THEN
    ALTER TABLE agents ADD COLUMN validation_status text DEFAULT 'insufficient';
  END IF;
END $$;

-- Add new columns to time_motion_studies table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'time_motion_studies' AND column_name = 'study_status'
  ) THEN
    ALTER TABLE time_motion_studies ADD COLUMN study_status text DEFAULT 'completed';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'time_motion_studies' AND column_name = 'assigned_to'
  ) THEN
    ALTER TABLE time_motion_studies ADD COLUMN assigned_to text DEFAULT '';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'time_motion_studies' AND column_name = 'quality_rating'
  ) THEN
    ALTER TABLE time_motion_studies ADD COLUMN quality_rating integer DEFAULT 3;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'time_motion_studies' AND column_name = 'study_template'
  ) THEN
    ALTER TABLE time_motion_studies ADD COLUMN study_template text DEFAULT '';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'time_motion_studies' AND column_name = 'lessons_learned'
  ) THEN
    ALTER TABLE time_motion_studies ADD COLUMN lessons_learned text DEFAULT '';
  END IF;
END $$;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_agents_division_id ON agents(division_id);
CREATE INDEX IF NOT EXISTS idx_agents_lifecycle_status ON agents(lifecycle_status);
CREATE INDEX IF NOT EXISTS idx_platform_costs_division_id ON platform_costs(division_id);
CREATE INDEX IF NOT EXISTS idx_platform_costs_month ON platform_costs(month);
CREATE INDEX IF NOT EXISTS idx_token_usage_agent_id ON token_usage(agent_id);
CREATE INDEX IF NOT EXISTS idx_token_usage_month ON token_usage(month);
CREATE INDEX IF NOT EXISTS idx_ai_team_members_division_id ON ai_team_members(division_id);
CREATE INDEX IF NOT EXISTS idx_time_motion_studies_study_status ON time_motion_studies(study_status);
