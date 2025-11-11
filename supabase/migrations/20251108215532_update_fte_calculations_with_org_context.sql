/*
  # Update FTE Calculation Functions to Include Organization Context

  ## Overview
  This migration updates the FTE calculation and goal progress functions to include
  organization headcount context, making FTE impact goals meaningful as percentages
  of the total workforce.

  ## Changes

  ### 1. Enhanced Agent FTE Calculation
  - `calculate_agent_projected_fte_with_context` - Returns both absolute FTE and percentage
  
  ### 2. Updated Goal Progress Functions
  - Modify `update_projected_goal_progress` to handle FTE percentage goals
  - FTE impact goals now compare against total organization headcount
  - Goals can be set as percentages (e.g., 2% of workforce) or absolute FTE values

  ## Notes
  - Backward compatible: existing FTE calculations still work
  - FTE percentage is calculated as: (FTE saved / total employees) * 100
  - When total_employees is not set, defaults to 100 for calculations
*/

-- Function to calculate agent FTE with organizational context
CREATE OR REPLACE FUNCTION calculate_agent_projected_fte_with_context(p_agent_id uuid)
RETURNS TABLE(
  fte_value numeric,
  fte_percentage numeric,
  total_employees integer
) AS $$
DECLARE
  v_fte numeric;
  v_total_employees integer;
BEGIN
  -- Calculate base FTE
  v_fte := calculate_agent_projected_fte(p_agent_id);
  
  -- Get organization total employees
  v_total_employees := get_total_employees();
  
  -- Calculate percentage
  fte_value := v_fte;
  total_employees := v_total_employees;
  
  IF v_total_employees > 0 THEN
    fte_percentage := (v_fte / v_total_employees) * 100;
  ELSE
    fte_percentage := 0;
  END IF;
  
  RETURN NEXT;
END;
$$ LANGUAGE plpgsql;

-- Update the projected goal progress function to use org context for FTE goals
DROP FUNCTION IF EXISTS update_projected_goal_progress();

CREATE OR REPLACE FUNCTION update_projected_goal_progress()
RETURNS void AS $$
DECLARE
  v_total_employees integer;
  v_org_totals record;
BEGIN
  -- Get total employees for FTE percentage calculations
  v_total_employees := get_total_employees();
  
  -- Get organization totals
  SELECT * INTO v_org_totals FROM calculate_org_projected_totals();

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

  -- Update organization-wide projected FTE goals
  -- For FTE goals, current_value is stored as decimal (e.g., 0.05 = 5%)
  UPDATE agent_goals g
  SET
    current_value = CASE 
      WHEN v_total_employees > 0 THEN v_org_totals.total_fte / v_total_employees
      ELSE 0
    END,
    status = CASE
      WHEN (v_org_totals.total_fte / NULLIF(v_total_employees, 1)) >= g.target_value THEN 'achieved'
      WHEN g.target_date < CURRENT_DATE THEN 'behind'
      WHEN (v_org_totals.total_fte / NULLIF(v_total_employees, 1)) < g.target_value * 0.5 
        AND g.target_date < CURRENT_DATE + INTERVAL '30 days' THEN 'at_risk'
      ELSE 'on_track'
    END,
    updated_at = now()
  WHERE g.goal_type = 'fte_impact'
    AND g.data_source = 'projected'
    AND g.status != 'cancelled'
    AND g.agent_id IS NULL;

  -- Update organization-wide projected goals for time saved and cost saved
  UPDATE agent_goals g
  SET
    current_value = CASE g.goal_type
      WHEN 'time_saved' THEN v_org_totals.total_time_saved
      WHEN 'cost_saved' THEN v_org_totals.total_cost_saved
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
  WHERE g.goal_type IN ('time_saved', 'cost_saved')
    AND g.data_source = 'projected'
    AND g.status != 'cancelled'
    AND g.agent_id IS NULL;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update projected goals when organization settings change
CREATE OR REPLACE FUNCTION trigger_projected_goal_update_on_org_change()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM update_projected_goal_progress();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger on organization_settings for employee count changes
DROP TRIGGER IF EXISTS update_projected_goals_on_org_settings_change ON organization_settings;
CREATE TRIGGER update_projected_goals_on_org_settings_change
  AFTER INSERT OR UPDATE OF total_employees
  ON organization_settings
  FOR EACH STATEMENT
  EXECUTE FUNCTION trigger_projected_goal_update_on_org_change();
