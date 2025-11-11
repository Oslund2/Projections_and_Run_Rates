/*
  # Add Agent Adoption Tracking

  ## Overview
  This migration adds comprehensive adoption tracking to agents, enabling organizations
  to understand the relationship between target user base, actual adoption rates, and
  realized business value. It includes adoption rate history tracking for trend analysis.

  ## New Tables

  ### 1. `adoption_history`
  Tracks changes to agent adoption rates over time
  - `id` (uuid, primary key) - Unique identifier
  - `agent_id` (uuid, foreign key) - Reference to agents table
  - `previous_adoption_rate` (numeric) - Previous adoption percentage (0-100)
  - `new_adoption_rate` (numeric) - New adoption percentage (0-100)
  - `previous_target_users` (integer) - Previous target user count
  - `new_target_users` (integer) - New target user count
  - `previous_current_users` (integer) - Previous current user count
  - `new_current_users` (integer) - New current user count
  - `change_notes` (text) - Optional notes explaining the change
  - `changed_by` (text) - User who made the change
  - `created_at` (timestamptz) - Timestamp of change

  ## Modified Tables

  ### `agents` table - New adoption tracking columns:
  - `target_user_base` (integer, default: 0) - Total potential users who could use this agent
  - `current_active_users` (integer, default: 0) - Current number of users actively using the agent
  - `adoption_rate_percent` (numeric, default: 0) - Calculated adoption percentage (0-100)
  - `adoption_methodology` (text) - Description of how adoption is measured/calculated
  - `adoption_last_updated` (timestamptz) - Last time adoption data was updated
  - `potential_usage_at_full_adoption` (integer) - Projected annual usage if adoption reaches 100%

  ## Triggers and Functions

  ### 1. Calculate Adoption Rate
  Automatically calculates adoption_rate_percent when target_user_base or current_active_users changes
  Formula: (current_active_users / target_user_base) * 100

  ### 2. Log Adoption Changes
  Automatically logs changes to adoption metrics to adoption_history table
  Triggers when adoption_rate_percent, target_user_base, or current_active_users changes

  ## Security
  - Enable RLS on adoption_history table
  - Add policies for authenticated users to view and manage adoption history
  - Maintain audit trail for all adoption changes

  ## Indexes
  - Index on agent_id in adoption_history for fast history lookups
  - Index on created_at in adoption_history for time-based queries
  - Index on adoption_rate_percent in agents for filtering and sorting

  ## Important Notes
  1. Adoption rate is automatically calculated from current_active_users / target_user_base
  2. All adoption changes are logged to adoption_history for audit trail
  3. Constraints ensure current_active_users cannot exceed target_user_base
  4. Adoption rate is stored as percentage (0-100) for clarity
  5. Existing agents default to 0 adoption until manually set
*/

-- Add adoption tracking columns to agents table
DO $$
BEGIN
  -- Target user base
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'agents' AND column_name = 'target_user_base'
  ) THEN
    ALTER TABLE agents ADD COLUMN target_user_base integer DEFAULT 0 CHECK (target_user_base >= 0);
  END IF;

  -- Current active users
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'agents' AND column_name = 'current_active_users'
  ) THEN
    ALTER TABLE agents ADD COLUMN current_active_users integer DEFAULT 0 CHECK (current_active_users >= 0);
  END IF;

  -- Adoption rate percentage
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'agents' AND column_name = 'adoption_rate_percent'
  ) THEN
    ALTER TABLE agents ADD COLUMN adoption_rate_percent numeric DEFAULT 0 CHECK (adoption_rate_percent >= 0 AND adoption_rate_percent <= 100);
  END IF;

  -- Adoption methodology
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'agents' AND column_name = 'adoption_methodology'
  ) THEN
    ALTER TABLE agents ADD COLUMN adoption_methodology text;
  END IF;

  -- Adoption last updated timestamp
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'agents' AND column_name = 'adoption_last_updated'
  ) THEN
    ALTER TABLE agents ADD COLUMN adoption_last_updated timestamptz;
  END IF;

  -- Potential usage at full adoption
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'agents' AND column_name = 'potential_usage_at_full_adoption'
  ) THEN
    ALTER TABLE agents ADD COLUMN potential_usage_at_full_adoption integer DEFAULT 0 CHECK (potential_usage_at_full_adoption >= 0);
  END IF;
END $$;

-- Add constraint to ensure current users don't exceed target users
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'current_users_within_target'
  ) THEN
    ALTER TABLE agents ADD CONSTRAINT current_users_within_target 
      CHECK (current_active_users <= target_user_base OR target_user_base = 0);
  END IF;
END $$;

-- Create adoption_history table
CREATE TABLE IF NOT EXISTS adoption_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id uuid NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
  previous_adoption_rate numeric CHECK (previous_adoption_rate >= 0 AND previous_adoption_rate <= 100),
  new_adoption_rate numeric CHECK (new_adoption_rate >= 0 AND new_adoption_rate <= 100),
  previous_target_users integer CHECK (previous_target_users >= 0),
  new_target_users integer CHECK (new_target_users >= 0),
  previous_current_users integer CHECK (previous_current_users >= 0),
  new_current_users integer CHECK (new_current_users >= 0),
  change_notes text,
  changed_by text,
  created_at timestamptz DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_adoption_history_agent_id ON adoption_history(agent_id);
CREATE INDEX IF NOT EXISTS idx_adoption_history_created_at ON adoption_history(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_agents_adoption_rate ON agents(adoption_rate_percent);

-- Enable Row Level Security on adoption_history
ALTER TABLE adoption_history ENABLE ROW LEVEL SECURITY;

-- RLS Policies for adoption_history table
CREATE POLICY "Anyone can view adoption history"
  ON adoption_history FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can insert adoption history"
  ON adoption_history FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update adoption history"
  ON adoption_history FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete adoption history"
  ON adoption_history FOR DELETE
  TO authenticated
  USING (true);

-- Function to calculate adoption rate
CREATE OR REPLACE FUNCTION calculate_adoption_rate()
RETURNS TRIGGER AS $$
BEGIN
  -- Calculate adoption rate percentage
  IF NEW.target_user_base > 0 THEN
    NEW.adoption_rate_percent := (NEW.current_active_users::numeric / NEW.target_user_base::numeric) * 100;
  ELSE
    NEW.adoption_rate_percent := 0;
  END IF;
  
  -- Update adoption last updated timestamp
  NEW.adoption_last_updated := now();
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-calculate adoption rate on insert/update
DROP TRIGGER IF EXISTS calculate_adoption_rate_trigger ON agents;
CREATE TRIGGER calculate_adoption_rate_trigger
  BEFORE INSERT OR UPDATE OF target_user_base, current_active_users ON agents
  FOR EACH ROW
  EXECUTE FUNCTION calculate_adoption_rate();

-- Function to log adoption changes to history
CREATE OR REPLACE FUNCTION log_adoption_change()
RETURNS TRIGGER AS $$
BEGIN
  -- Only log if adoption-related fields have changed
  IF (OLD.adoption_rate_percent IS DISTINCT FROM NEW.adoption_rate_percent) OR
     (OLD.target_user_base IS DISTINCT FROM NEW.target_user_base) OR
     (OLD.current_active_users IS DISTINCT FROM NEW.current_active_users) THEN
    
    INSERT INTO adoption_history (
      agent_id,
      previous_adoption_rate,
      new_adoption_rate,
      previous_target_users,
      new_target_users,
      previous_current_users,
      new_current_users,
      changed_by,
      created_at
    ) VALUES (
      NEW.id,
      OLD.adoption_rate_percent,
      NEW.adoption_rate_percent,
      OLD.target_user_base,
      NEW.target_user_base,
      OLD.current_active_users,
      NEW.current_active_users,
      current_user,
      now()
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to log adoption changes
DROP TRIGGER IF EXISTS log_adoption_change_trigger ON agents;
CREATE TRIGGER log_adoption_change_trigger
  AFTER UPDATE ON agents
  FOR EACH ROW
  EXECUTE FUNCTION log_adoption_change();

-- Initialize adoption data for existing agents (set to 100% adoption by default)
UPDATE agents
SET 
  target_user_base = CASE WHEN avg_usage_count > 0 THEN avg_usage_count ELSE 1 END,
  current_active_users = CASE WHEN avg_usage_count > 0 THEN avg_usage_count ELSE 1 END,
  potential_usage_at_full_adoption = avg_usage_count,
  adoption_last_updated = now()
WHERE target_user_base = 0 OR target_user_base IS NULL;