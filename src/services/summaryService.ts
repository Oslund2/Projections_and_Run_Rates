import { supabase } from '../lib/supabase';
import type { Database } from '../lib/database.types';
import { calculateAgentProjections } from '../utils/calculations';

type AgentSummary = Database['public']['Tables']['agent_summaries']['Row'];

export interface AgentWithSummary {
  id: string;
  name: string;
  category: string | null;
  description: string | null;
  status: string;
  summary: AgentSummary | null;
}

export const summaryService = {
  async getAll() {
    const { data, error } = await supabase
      .from('agent_summaries')
      .select(`
        *,
        agents (
          id,
          name,
          category,
          description,
          status
        )
      `)
      .order('total_potential_savings', { ascending: false });

    if (error) throw error;
    return data;
  },

  async getByAgentId(agentId: string) {
    const { data, error } = await supabase
      .from('agent_summaries')
      .select('*')
      .eq('agent_id', agentId)
      .maybeSingle();

    if (error) throw error;
    return data as AgentSummary | null;
  },

  async getProjectedSummary(divisionId: string | null = null) {
    console.log('getProjectedSummary called with divisionId:', divisionId);
    let query = supabase
      .from('agents')
      .select('*')
      .eq('status', 'active');

    if (divisionId === 'unassigned') {
      console.log('Filtering for unassigned agents');
      query = query.is('division_id', null);
    } else if (divisionId) {
      console.log('Filtering for division:', divisionId);
      query = query.eq('division_id', divisionId);
    } else {
      console.log('No division filter - showing all agents');
    }

    const { data: agents, error } = await query;
    console.log('Agents returned:', agents?.length, 'agents');

    if (error) throw error;
    if (!agents) return { totalTimeSaved: 0, totalSavings: 0, activeAgents: 0, avgSavingsPerAgent: 0, fteEquivalent: 0 };

    let totalProjectedTimeSaved = 0;
    let totalProjectedSavings = 0;
    let agentsWithProjections = 0;

    agents.forEach(agent => {
      console.log(`Processing agent: ${agent.name}`, {
        avg_time_without: agent.avg_time_without_agent_minutes,
        avg_time_with: agent.avg_time_with_agent_minutes,
        avg_usage: agent.avg_usage_count,
        has_data: (agent.avg_time_without_agent_minutes || 0) > 0 && (agent.avg_usage_count || 0) > 0
      });

      // Only count agents that have meaningful projection data
      if ((agent.avg_time_without_agent_minutes || 0) > 0 && (agent.avg_usage_count || 0) > 0) {
        const projections = calculateAgentProjections({
          avgTimeWithoutAgentMinutes: agent.avg_time_without_agent_minutes || 0,
          avgTimeWithAgentMinutes: agent.avg_time_with_agent_minutes || 0,
          avgUsageCount: agent.avg_usage_count || 0,
          usageDiscountPercent: agent.default_usage_discount_percent || 50,
          avgHourlyWage: agent.avg_hourly_wage || 20
        });

        console.log(`Agent ${agent.name} projections:`, projections);
        totalProjectedTimeSaved += projections.annualTimeSavedHours;
        totalProjectedSavings += projections.annualCostSavings;
        agentsWithProjections++;
      }
    });

    console.log('Final projected summary:', {
      totalProjectedTimeSaved,
      totalProjectedSavings,
      agentsWithProjections
    });

    return {
      totalTimeSaved: totalProjectedTimeSaved,
      totalSavings: totalProjectedSavings,
      activeAgents: agentsWithProjections,
      avgSavingsPerAgent: agentsWithProjections > 0 ? totalProjectedSavings / agentsWithProjections : 0,
      fteEquivalent: totalProjectedTimeSaved / 2080
    };
  },

  async getActualSummary(divisionId: string | null = null) {
    let agentIds: string[] | null = null;

    if (divisionId === 'unassigned') {
      const { data: agents, error: agentsError } = await supabase
        .from('agents')
        .select('id')
        .is('division_id', null);
      if (agentsError) throw agentsError;
      agentIds = agents?.map(a => a.id) || [];
    } else if (divisionId) {
      const { data: agents, error: agentsError } = await supabase
        .from('agents')
        .select('id')
        .eq('division_id', divisionId);
      if (agentsError) throw agentsError;
      agentIds = agents?.map(a => a.id) || [];
    }

    let query = supabase
      .from('agent_summaries')
      .select('*');

    if (agentIds !== null) {
      if (agentIds.length === 0) {
        return { totalTimeSaved: 0, totalSavings: 0, totalStudies: 0, activeAgents: 0, avgSavingsPerAgent: 0, fteEquivalent: 0 };
      }
      query = query.in('agent_id', agentIds);
    }

    const { data, error } = await query;

    if (error) throw error;
    if (!data) return { totalTimeSaved: 0, totalSavings: 0, totalStudies: 0, activeAgents: 0, avgSavingsPerAgent: 0, fteEquivalent: 0 };

    const totalTimeSaved = data.reduce((sum, summary) => sum + (summary.total_time_saved_hours || 0), 0);
    const totalSavings = data.reduce((sum, summary) => sum + (summary.total_potential_savings || 0), 0);
    const totalStudies = data.reduce((sum, summary) => sum + (summary.total_studies || 0), 0);
    const activeAgents = data.length;

    return {
      totalTimeSaved,
      totalSavings,
      totalStudies,
      activeAgents,
      avgSavingsPerAgent: activeAgents > 0 ? totalSavings / activeAgents : 0,
      fteEquivalent: totalTimeSaved / 2080
    };
  },

  async getGlobalSummary(divisionId: string | null = null) {
    const [projected, actual] = await Promise.all([
      this.getProjectedSummary(divisionId),
      this.getActualSummary(divisionId)
    ]);

    return {
      projected: {
        totalTimeSaved: projected.totalTimeSaved,
        totalSavings: projected.totalSavings,
        activeAgents: projected.activeAgents,
        avgSavingsPerAgent: projected.avgSavingsPerAgent,
        fteEquivalent: projected.fteEquivalent
      },
      actual: {
        totalTimeSaved: actual.totalTimeSaved,
        totalSavings: actual.totalSavings,
        totalStudies: actual.totalStudies,
        activeAgents: actual.activeAgents,
        avgSavingsPerAgent: actual.avgSavingsPerAgent,
        fteEquivalent: actual.fteEquivalent
      },
      hasProjectedData: projected.activeAgents > 0,
      hasActualData: actual.totalStudies > 0
    };
  },

  async getProjectedAgentsDetail(divisionId: string | null = null) {
    let query = supabase
      .from('agents')
      .select('*')
      .eq('status', 'active');

    if (divisionId === 'unassigned') {
      query = query.is('division_id', null);
    } else if (divisionId) {
      query = query.eq('division_id', divisionId);
    }

    const { data: agents, error } = await query;

    if (error) throw error;
    if (!agents) return [];

    return agents
      .filter(agent => (agent.avg_time_without_agent_minutes || 0) > 0 && (agent.avg_usage_count || 0) > 0)
      .map(agent => {
        const projections = calculateAgentProjections({
          avgTimeWithoutAgentMinutes: agent.avg_time_without_agent_minutes || 0,
          avgTimeWithAgentMinutes: agent.avg_time_with_agent_minutes || 0,
          avgUsageCount: agent.avg_usage_count || 0,
          usageDiscountPercent: agent.default_usage_discount_percent || 50,
          avgHourlyWage: agent.avg_hourly_wage || 20
        });

        return {
          id: agent.id,
          name: agent.name,
          category: agent.category,
          projectedTimeSaved: projections.annualTimeSavedHours,
          projectedCostSavings: projections.annualCostSavings,
          fteEquivalent: projections.fteEquivalent,
          adoption_rate_percent: agent.adoption_rate_percent || 0
        };
      });
  },

  async getActualStudiesDetail(divisionId: string | null = null) {
    let agentIds: string[] | null = null;

    if (divisionId === 'unassigned') {
      const { data: agents, error: agentsError } = await supabase
        .from('agents')
        .select('id')
        .is('division_id', null);
      if (agentsError) throw agentsError;
      agentIds = agents?.map(a => a.id) || [];
    } else if (divisionId) {
      const { data: agents, error: agentsError } = await supabase
        .from('agents')
        .select('id')
        .eq('division_id', divisionId);
      if (agentsError) throw agentsError;
      agentIds = agents?.map(a => a.id) || [];
    }

    let query = supabase
      .from('time_motion_studies')
      .select(`
        id,
        task_description,
        net_time_saved_hours,
        potential_savings,
        study_date,
        agents (
          name
        )
      `)
      .order('study_date', { ascending: false });

    if (agentIds !== null) {
      if (agentIds.length === 0) {
        return [];
      }
      query = query.in('agent_id', agentIds);
    }

    const { data, error } = await query;

    if (error) throw error;
    if (!data) return [];

    return data.map(study => ({
      id: (study as any).id as string,
      task_description: (study as any).task_description as string,
      agent_name: ((study as any).agents as any)?.name || 'Unknown',
      net_time_saved_hours: ((study as any).net_time_saved_hours as number) || 0,
      potential_savings: ((study as any).potential_savings as number) || 0,
      study_date: ((study as any).study_date as string) || new Date().toISOString()
    }));
  }
};
