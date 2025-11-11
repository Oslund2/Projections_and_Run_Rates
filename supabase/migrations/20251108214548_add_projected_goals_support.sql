/*
  # Add Projected Goals Support from Agent Variables

  ## Overview
  This migration enhances the goals system to support tracking progress based on 
  agent projection variables (avg_time_without_agent_minutes, avg_usage_count, etc.)
  in addition to actual study data.

  ## Changes

  ### 1. Schema Updates
  - Add `data_source` column to `agent_goals` table
    - Values: 'projected' (from agent variables) or 'actual' (from studies)
    - Allows goals to track against projected impact or measured results
    - Default: 'actual' for backward compatibility

  ### 2. New Functions

  #### `calculate_agent_projected_fte(agent_id uuid)`
  Calculates an individual agent's projected FTE impact from their variables:
  - Uses avg_time_without_agent_minutes, avg_time_with_agent_minutes
  - Applies avg_usage_count and default_usage_discount_percent
  - Converts to annual hours and divides by 2080 (standard work year)
  
  #### `calculate_agent_projected_time_saved(agent_id uuid)`
  Calculates projected annual time saved hours for an agent
  
  #### `calculate_agent_projected_cost_saved(agent_id uuid)`
  Calculates projected annual cost savings for an agent

  #### `calculate_org_projected_totals()`
  Aggregates projected values across all active agents for org-wide goals

  #### `update_projected_goal_progress()`
  Updates goal progress for goals with data_source='projected'
  - Calculates from agent projection variables
  - Handles agent-specific and organization-wide goals
  - Updates status based on current_value vs target_value

  ### 3. Triggers
  - Auto-update projected goals when agent variables change
  - Existing trigger continues to update actual goals when studies change

  ## Security
  - No RLS changes needed (existing policies apply)

  ## Notes
  - Backward compatible: existing goals default to 'actual' data source
  - Organization-wide projected goals (agent_id IS NULL) aggregate all agents
  - Calculations match the projection logic used in Dashboard component
*/

-- Add data_source column to agent_goals
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'agent_goals' AND column_name = 'data_source'
  ) THEN
    ALTER TABLE agent_goals 
    ADD COLUMN data_source text DEFAULT 'actual' CHECK (data_source IN ('projected', 'actual'));
  END IF;
END $$;

-- Create index on data_source for filtering
CREATE INDEX IF NOT EXISTS idx_goals_data_source ON agent_goals(data_source);

-- Function to calculate projected FTE for a single agent
CREATE OR REPLACE FUNCTION calculate_agent_projected_fte(p_agent_id uuid)
RETURNS numeric AS $$
DECLARE
  v_time_without numeric;
  v_time_with numeric;
  v_usage_count numeric;
  v_discount numeric;
  v_time_saved_minutes numeric;
  v_net_usage numeric;
  v_annual_hours numeric;
BEGIN
  -- Get agent projection variables
  SELECT 
    COALESCE(avg_time_without_agent_minutes, 0),
    COALESCE(avg_time_with_agent_minutes, 0),
    COALESCE(avg_usage_count, 0),
    COALESCE(default_usage_discount_percent, 0)
  INTO v_time_without, v_time_with, v_usage_count, v_discount
  FROM agents
  WHERE id = p_agent_id;

  -- Calculate time saved per use
  v_time_saved_minutes := v_time_without - v_time_with;
  
  -- Apply usage discount
  v_net_usage := v_usage_count * (1 - v_discount / 100);
  
  -- Calculate annual hours saved
  v_annual_hours := (v_time_saved_minutes * v_net_usage) / 60;
  
  -- Convert to FTE (2080 hours per year)
  RETURN v_annual_hours / 2080;
END;
$$ LANGUAGE plpgsql;

-- Function to calculate projected time saved hours for a single agent
CREATE OR REPLACE FUNCTION calculate_agent_projected_time_saved(p_agent_id uuid)
RETURNS numeric AS $$
DECLARE
  v_time_without numeric;
  v_time_with numeric;
  v_usage_count numeric;
  v_discount numeric;
  v_time_saved_minutes numeric;
  v_net_usage numeric;
BEGIN
  -- Get agent projection variables
  SELECT 
    COALESCE(avg_time_without_agent_minutes, 0),
    COALESCE(avg_time_with_agent_minutes, 0),
    COALESCE(avg_usage_count, 0),
    COALESCE(default_usage_discount_percent, 0)
  INTO v_time_without, v_time_with, v_usage_count, v_discount
  FROM agents
  WHERE id = p_agent_id;

  -- Calculate time saved per use
  v_time_saved_minutes := v_time_without - v_time_with;
  
  -- Apply usage discount
  v_net_usage := v_usage_count * (1 - v_discount / 100);
  
  -- Calculate and return annual hours saved
  RETURN (v_time_saved_minutes * v_net_usage) / 60;
END;
$$ LANGUAGE plpgsql;

-- Function to calculate projected cost savings for a single agent
CREATE OR REPLACE FUNCTION calculate_agent_projected_cost_saved(p_agent_id uuid)
RETURNS numeric AS $$
DECLARE
  v_time_saved_hours numeric;
  v_hourly_wage numeric;
BEGIN
  -- Get projected time saved
  v_time_saved_hours := calculate_agent_projected_time_saved(p_agent_id);
  
  -- Get agent's hourly wage
  SELECT COALESCE(avg_hourly_wage, 0)
  INTO v_hourly_wage
  FROM agents
  WHERE id = p_agent_id;
  
  -- Calculate and return annual cost savings
  RETURN v_time_saved_hours * v_hourly_wage;
END;
$$ LANGUAGE plpgsql;

-- Function to calculate organization-wide projected totals
CREATE OR REPLACE FUNCTION calculate_org_projected_totals()
RETURNS TABLE(
  total_fte numeric,
  total_time_saved numeric,
  total_cost_saved numeric,
  agent_count integer
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COALESCE(SUM(calculate_agent_projected_fte(id)), 0) as total_fte,
    COALESCE(SUM(calculate_agent_projected_time_saved(id)), 0) as total_time_saved,
    COALESCE(SUM(calculate_agent_projected_cost_saved(id)), 0) as total_cost_saved,
    COUNT(*)::integer as agent_count
  FROM agents
  WHERE status = 'active'
    AND avg_time_without_agent_minutes IS NOT NULL
    AND avg_time_with_agent_minutes IS NOT NULL
    AND avg_usage_count IS NOT NULL
    AND avg_usage_count > 0;
END;
$$ LANGUAGE plpgsql;

-- Function to update projected goal progress
CREATE OR REPLACE FUNCTION update_projected_goal_progress()
RETURNS void AS $$
BEGIN
  -- Update agent-specific projected goals for FTE impact
  UPDATE agent_goals g
  SET
    current_value = calculate_agent_projected_fte(g.agent_id),
    status = CASE
      WHEN calculate_agent_projected_fte(g.agent_id) >= g.target_value THEN 'achieved'
      WHEN g.target_date < CURRENT_DATE THEN 'behind'
      WHEN calculate_agent_projected_fte(g.agent_id) < g.target_value * 0.5 
        AND g.target_date < CURRENT_DATE + INTERVAL '30 days' THEN 'at_risk'
      ELSE 'on_track'
    END,
    updated_at = now()
  WHERE g.goal_type = 'fte_impact'
    AND g.data_source = 'projected'
    AND g.status != 'cancelled'
    AND g.agent_id IS NOT NULL;

  -- Update agent-specific projected goals for time saved
  UPDATE agent_goals g
  SET
    current_value = calculate_agent_projected_time_saved(g.agent_id),
    status = CASE
      WHEN calculate_agent_projected_time_saved(g.agent_id) >= g.target_value THEN 'achieved'
      WHEN g.target_date < CURRENT_DATE THEN 'behind'
      WHEN calculate_agent_projected_time_saved(g.agent_id) < g.target_value * 0.5 
        AND g.target_date < CURRENT_DATE + INTERVAL '30 days' THEN 'at_risk'
      ELSE 'on_track'
    END,
    updated_at = now()
  WHERE g.goal_type = 'time_saved'
    AND g.data_source = 'projected'
    AND g.status != 'cancelled'
    AND g.agent_id IS NOT NULL;

  -- Update agent-specific projected goals for cost saved
  UPDATE agent_goals g
  SET
    current_value = calculate_agent_projected_cost_saved(g.agent_id),
    status = CASE
      WHEN calculate_agent_projected_cost_saved(g.agent_id) >= g.target_value THEN 'achieved'
      WHEN g.target_date < CURRENT_DATE THEN 'behind'
      WHEN calculate_agent_projected_cost_saved(g.agent_id) < g.target_value * 0.5 
        AND g.target_date < CURRENT_DATE + INTERVAL '30 days' THEN 'at_risk'
      ELSE 'on_track'
    END,
    updated_at = now()
  WHERE g.goal_type = 'cost_saved'
    AND g.data_source = 'projected'
    AND g.status != 'cancelled'
    AND g.agent_id IS NOT NULL;

  -- Update organization-wide projected goals
  UPDATE agent_goals g
  SET
    current_value = CASE g.goal_type
      WHEN 'fte_impact' THEN (SELECT total_fte FROM calculate_org_projected_totals())
      WHEN 'time_saved' THEN (SELECT total_time_saved FROM calculate_org_projected_totals())
      WHEN 'cost_saved' THEN (SELECT total_cost_saved FROM calculate_org_projected_totals())
      ELSE 0
    END,
    status = CASE
      WHEN current_value >= g.target_value THEN 'achieved'
      WHEN g.target_date < CURRENT_DATE THEN 'behind'
      WHEN current_value < g.target_value * 0.5 
        AND g.target_date < CURRENT_DATE + INTERVAL '30 days' THEN 'at_risk'
      ELSE 'on_track'
    END,
    updated_at = now()
  WHERE g.data_source = 'projected'
    AND g.status != 'cancelled'
    AND g.agent_id IS NULL;
END;
$$ LANGUAGE plpgsql;

-- Trigger function to update projected goals when agent variables change
CREATE OR REPLACE FUNCTION trigger_projected_goal_update()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM update_projected_goal_progress();
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create trigger on agents table for variable changes
DROP TRIGGER IF EXISTS update_projected_goals_on_agent_change ON agents;
CREATE TRIGGER update_projected_goals_on_agent_change
  AFTER INSERT OR UPDATE OF 
    avg_time_without_agent_minutes,
    avg_time_with_agent_minutes,
    avg_usage_count,
    default_usage_discount_percent,
    avg_hourly_wage,
    status
  ON agents
  FOR EACH STATEMENT
  EXECUTE FUNCTION trigger_projected_goal_update();
