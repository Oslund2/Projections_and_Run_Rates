/*
  # Add Agent Time and Usage Variables

  ## Overview
  This migration adds configurable time and usage variables to the agents table,
  enabling automatic calculation of time savings, cost savings, and FTE estimates
  for each agent.

  ## Changes Made

  ### Modified Tables
  
  #### `agents` table - New columns added:
  - `avg_time_without_agent_minutes` (numeric, default: 0) - Average time to complete task without AI agent
  - `avg_time_with_agent_minutes` (numeric, default: 0) - Average time to complete task with AI agent
  - `avg_usage_count` (integer, default: 0) - Average or projected usage count (number of times agent is used)
  - `avg_hourly_wage` (numeric, default: 20) - Average hourly wage of users (renamed from default_cost_per_employee_hour for consistency)
  
  Note: Existing `default_usage_discount_percent` field is retained for discount calculations
  Note: Existing `default_cost_per_employee_hour` field is retained for backward compatibility but avg_hourly_wage will be the primary field going forward

  ## Important Notes
  1. All new columns have default values to ensure backward compatibility
  2. Existing agents will be populated with sensible defaults
  3. The avg_usage_count represents projected annual usage by default
  4. These variables enable automatic calculation of:
     - Time savings per usage
     - Total time savings (hours per year)
     - Cost savings (dollars per year)
     - FTE equivalents (based on 2080 hours/year standard)
*/

-- Add new columns to agents table for time and usage variables
DO $$
BEGIN
  -- Add avg_time_without_agent_minutes column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'agents' AND column_name = 'avg_time_without_agent_minutes'
  ) THEN
    ALTER TABLE agents ADD COLUMN avg_time_without_agent_minutes numeric DEFAULT 0 CHECK (avg_time_without_agent_minutes >= 0);
  END IF;

  -- Add avg_time_with_agent_minutes column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'agents' AND column_name = 'avg_time_with_agent_minutes'
  ) THEN
    ALTER TABLE agents ADD COLUMN avg_time_with_agent_minutes numeric DEFAULT 0 CHECK (avg_time_with_agent_minutes >= 0);
  END IF;

  -- Add avg_usage_count column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'agents' AND column_name = 'avg_usage_count'
  ) THEN
    ALTER TABLE agents ADD COLUMN avg_usage_count integer DEFAULT 0 CHECK (avg_usage_count >= 0);
  END IF;

  -- Add avg_hourly_wage column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'agents' AND column_name = 'avg_hourly_wage'
  ) THEN
    ALTER TABLE agents ADD COLUMN avg_hourly_wage numeric DEFAULT 20 CHECK (avg_hourly_wage >= 0);
  END IF;
END $$;

-- Populate avg_hourly_wage with existing default_cost_per_employee_hour values
UPDATE agents 
SET avg_hourly_wage = default_cost_per_employee_hour 
WHERE avg_hourly_wage = 0 OR avg_hourly_wage IS NULL;