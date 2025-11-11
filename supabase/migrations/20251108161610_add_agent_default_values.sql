/*
  # Add Agent-Specific Default Values

  ## Overview
  This migration adds agent-specific default values for usage discount percentage 
  and cost per employee hour. This allows different agents to have different 
  default values based on the type of work they perform (e.g., newsroom agents 
  at $20/hour vs legal agents at $300/hour).

  ## Changes

  ### Modified Tables
  
  #### `agents` table
  - Add `default_usage_discount_percent` (numeric, default: 50)
    - Default usage discount percentage for new studies (0-100)
    - Constraint: Must be between 0 and 100
  - Add `default_cost_per_employee_hour` (numeric, default: 20)
    - Default cost per employee hour for new studies
    - Constraint: Must be non-negative (>= 0)

  ## Important Notes
  1. These defaults will be used when creating new studies for each agent
  2. Existing agents will be updated with the current global defaults (50% discount, $20/hour)
  3. Users can still override these defaults on a per-study basis
  4. Different agents can now have different cost assumptions based on their use case
*/

-- Add default_usage_discount_percent column to agents table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'agents' AND column_name = 'default_usage_discount_percent'
  ) THEN
    ALTER TABLE agents ADD COLUMN default_usage_discount_percent numeric DEFAULT 50 
      CHECK (default_usage_discount_percent >= 0 AND default_usage_discount_percent <= 100);
  END IF;
END $$;

-- Add default_cost_per_employee_hour column to agents table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'agents' AND column_name = 'default_cost_per_employee_hour'
  ) THEN
    ALTER TABLE agents ADD COLUMN default_cost_per_employee_hour numeric DEFAULT 20 
      CHECK (default_cost_per_employee_hour >= 0);
  END IF;
END $$;

-- Update existing agents to have the current global default values
UPDATE agents
SET 
  default_usage_discount_percent = 50,
  default_cost_per_employee_hour = 20
WHERE 
  default_usage_discount_percent IS NULL 
  OR default_cost_per_employee_hour IS NULL;
