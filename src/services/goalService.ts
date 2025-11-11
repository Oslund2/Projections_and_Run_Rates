import { supabase } from '../lib/supabase';

export type GoalType = 'time_saved' | 'cost_saved' | 'study_count' | 'fte_impact';
export type GoalStatus = 'on_track' | 'at_risk' | 'behind' | 'achieved' | 'cancelled';
export type GoalDataSource = 'projected' | 'actual';

export interface Goal {
  id: string;
  agent_id: string | null;
  goal_type: GoalType;
  target_value: number;
  target_date: string;
  current_value: number;
  status: GoalStatus;
  description: string | null;
  data_source: GoalDataSource;
  created_at: string;
  updated_at: string;
}

export interface GoalWithAgent extends Goal {
  agents?: {
    id: string;
    name: string;
    category: string | null;
  };
}

export interface CreateGoalInput {
  agent_id: string | null;
  goal_type: GoalType;
  target_value: number;
  target_date: string;
  description?: string;
  data_source: GoalDataSource;
}

export interface AgentContribution {
  agent_id: string;
  agent_name: string;
  contribution: number;
  percentage: number;
}

export interface UpdateGoalInput {
  target_value?: number;
  target_date?: string;
  status?: GoalStatus;
  description?: string;
}

class GoalService {
  async getAll(): Promise<GoalWithAgent[]> {
    const { data, error } = await supabase
      .from('agent_goals')
      .select(`
        *,
        agents (
          id,
          name,
          category
        )
      `)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  async getByAgent(agentId: string): Promise<Goal[]> {
    const { data, error } = await supabase
      .from('agent_goals')
      .select('*')
      .eq('agent_id', agentId)
      .order('target_date', { ascending: true });

    if (error) throw error;
    return data || [];
  }

  async getOrganizationGoals(): Promise<Goal[]> {
    const { data, error } = await supabase
      .from('agent_goals')
      .select('*')
      .is('agent_id', null)
      .order('target_date', { ascending: true });

    if (error) throw error;
    return data || [];
  }

  async getActiveGoals(divisionId: string | null = null): Promise<GoalWithAgent[]> {
    let query = supabase
      .from('agent_goals')
      .select(`
        *,
        agents (
          id,
          name,
          category,
          division_id
        )
      `)
      .in('status', ['on_track', 'at_risk', 'behind']);

    const { data, error } = await query.order('target_date', { ascending: true });

    if (error) throw error;
    if (!data) return [];

    if (divisionId === 'unassigned') {
      return data.filter(goal => !goal.agent_id || (goal.agents && !(goal.agents as any).division_id));
    } else if (divisionId) {
      return data.filter(goal => !goal.agent_id || (goal.agents && (goal.agents as any).division_id === divisionId));
    }

    return data;
  }

  async getById(id: string): Promise<Goal | null> {
    const { data, error } = await supabase
      .from('agent_goals')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (error) throw error;
    return data;
  }

  async create(input: CreateGoalInput): Promise<Goal> {
    const { data, error } = await supabase
      .from('agent_goals')
      .insert({
        agent_id: input.agent_id,
        goal_type: input.goal_type,
        target_value: input.target_value,
        target_date: input.target_date,
        description: input.description || null,
        data_source: input.data_source,
        current_value: 0,
        status: 'on_track',
      })
      .select()
      .single();

    if (error) throw error;

    await this.refreshProjectedProgress();

    return data;
  }

  async update(id: string, input: UpdateGoalInput): Promise<Goal> {
    const { data, error } = await supabase
      .from('agent_goals')
      .update(input)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('agent_goals')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }

  async updateProgress(): Promise<void> {
    const { error } = await supabase.rpc('update_goal_progress');
    if (error) throw error;
  }

  async refreshProjectedProgress(): Promise<void> {
    const { error } = await supabase.rpc('update_projected_goal_progress');
    if (error) throw error;
  }

  async getAgentContributions(goalId: string): Promise<AgentContribution[]> {
    const goal = await this.getById(goalId);
    if (!goal || goal.agent_id !== null || goal.data_source !== 'projected') {
      return [];
    }

    const { data: agents, error } = await supabase
      .from('agents')
      .select('id, name, avg_time_without_agent_minutes, avg_time_with_agent_minutes, avg_usage_count, default_usage_discount_percent, avg_hourly_wage')
      .eq('status', 'active')
      .not('avg_time_without_agent_minutes', 'is', null)
      .not('avg_time_with_agent_minutes', 'is', null)
      .not('avg_usage_count', 'is', null)
      .gt('avg_usage_count', 0);

    if (error) throw error;
    if (!agents || agents.length === 0) return [];

    const contributions: AgentContribution[] = agents.map(agent => {
      const timeSavedMinutes = (agent.avg_time_without_agent_minutes || 0) - (agent.avg_time_with_agent_minutes || 0);
      const netUsage = (agent.avg_usage_count || 0) * (1 - (agent.default_usage_discount_percent || 0) / 100);
      const annualHours = (timeSavedMinutes * netUsage) / 60;

      let contribution = 0;
      if (goal.goal_type === 'fte_impact') {
        contribution = annualHours / 2080;
      } else if (goal.goal_type === 'time_saved') {
        contribution = annualHours;
      } else if (goal.goal_type === 'cost_saved') {
        contribution = annualHours * (agent.avg_hourly_wage || 0);
      }

      return {
        agent_id: agent.id,
        agent_name: agent.name,
        contribution,
        percentage: 0
      };
    });

    const total = contributions.reduce((sum, c) => sum + c.contribution, 0);
    contributions.forEach(c => {
      c.percentage = total > 0 ? (c.contribution / total) * 100 : 0;
    });

    return contributions.sort((a, b) => b.contribution - a.contribution);
  }

  calculateProgress(goal: Goal): number {
    if (goal.target_value === 0) return 0;
    return Math.min(100, (goal.current_value / goal.target_value) * 100);
  }

  getDaysRemaining(goal: Goal): number {
    const today = new Date();
    const targetDate = new Date(goal.target_date);
    const diffTime = targetDate.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  getStatusColor(status: GoalStatus): string {
    const colors: Record<GoalStatus, string> = {
      on_track: 'emerald',
      at_risk: 'amber',
      behind: 'rose',
      achieved: 'blue',
      cancelled: 'slate',
    };
    return colors[status];
  }

  getGoalTypeLabel(type: GoalType): string {
    const labels: Record<GoalType, string> = {
      time_saved: 'Time Saved (hours)',
      cost_saved: 'Cost Savings ($)',
      study_count: 'Study Count',
      fte_impact: 'FTE Impact (%)',
    };
    return labels[type];
  }

  getDataSourceLabel(dataSource: GoalDataSource): string {
    return dataSource === 'projected' ? 'Projections' : 'Run Rate';
  }

  getDataSourceColor(dataSource: GoalDataSource): string {
    return dataSource === 'projected' ? 'blue' : 'emerald';
  }

  async getSummary() {
    const goals = await this.getAll();

    return {
      total: goals.length,
      achieved: goals.filter(g => g.status === 'achieved').length,
      on_track: goals.filter(g => g.status === 'on_track').length,
      at_risk: goals.filter(g => g.status === 'at_risk').length,
      behind: goals.filter(g => g.status === 'behind').length,
      cancelled: goals.filter(g => g.status === 'cancelled').length,
    };
  }
}

export const goalService = new GoalService();
