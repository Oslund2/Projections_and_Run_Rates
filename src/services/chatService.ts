import { supabase } from '../lib/supabase';
import type { Database } from '../lib/database.types';

type ChatConversation = Database['public']['Tables']['chat_conversations']['Row'];
type ChatMessage = Database['public']['Tables']['chat_messages']['Row'];
type ChatConversationInsert = Database['public']['Tables']['chat_conversations']['Insert'];
type ChatMessageInsert = Database['public']['Tables']['chat_messages']['Insert'];

export interface ConversationWithMessages extends ChatConversation {
  chat_messages: ChatMessage[];
}

export interface ChatContext {
  currentView?: string;
  selectedAgentId?: string;
  organizationData?: {
    totalEmployees: number;
    totalAgents: number;
    totalStudies: number;
  };
}

export const chatService = {
  async createConversation(userId: string = 'anonymous', context?: ChatContext) {
    const { data, error } = await supabase
      .from('chat_conversations')
      .insert({
        user_id: userId,
        context_data: context || {}
      })
      .select()
      .single();

    if (error) throw error;
    return data as ChatConversation;
  },

  async getConversation(conversationId: string) {
    const { data, error } = await supabase
      .from('chat_conversations')
      .select(`
        *,
        chat_messages (*)
      `)
      .eq('id', conversationId)
      .order('created_at', { ascending: true, foreignTable: 'chat_messages' })
      .maybeSingle();

    if (error) throw error;
    return data as ConversationWithMessages | null;
  },

  async getUserConversations(userId: string = 'anonymous', limit: number = 10) {
    const { data, error } = await supabase
      .from('chat_conversations')
      .select('*')
      .eq('user_id', userId)
      .order('updated_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data as ChatConversation[];
  },

  async addMessage(conversationId: string, role: 'user' | 'assistant' | 'system', content: string) {
    const { data, error } = await supabase
      .from('chat_messages')
      .insert({
        conversation_id: conversationId,
        role,
        content
      })
      .select()
      .single();

    if (error) throw error;

    await supabase
      .from('chat_conversations')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', conversationId);

    return data as ChatMessage;
  },

  async updateConversationTitle(conversationId: string, title: string) {
    const { data, error } = await supabase
      .from('chat_conversations')
      .update({
        title,
        updated_at: new Date().toISOString()
      })
      .eq('id', conversationId)
      .select()
      .single();

    if (error) throw error;
    return data as ChatConversation;
  },

  async deleteConversation(conversationId: string) {
    const { error } = await supabase
      .from('chat_conversations')
      .delete()
      .eq('id', conversationId);

    if (error) throw error;
  },

  async getComprehensiveContext(divisionId?: string | null) {
    try {
      let agentsQuery = supabase.from('agents').select('*').order('created_at', { ascending: false });

      if (divisionId && divisionId !== 'unassigned') {
        agentsQuery = agentsQuery.eq('division_id', divisionId);
      } else if (divisionId === 'unassigned') {
        agentsQuery = agentsQuery.is('division_id', null);
      }

      const agents = await agentsQuery;
      const agentIds = agents.data?.map(a => a.id) || [];

      let studiesQuery = supabase.from('time_motion_studies').select(`
        *,
        agents (name, category)
      `).order('study_date', { ascending: false }).limit(100);

      if (agentIds.length > 0 && divisionId) {
        studiesQuery = studiesQuery.in('agent_id', agentIds);
      }

      let goalsQuery = supabase.from('agent_goals').select('*').order('target_date', { ascending: true });
      if (agentIds.length > 0 && divisionId) {
        goalsQuery = goalsQuery.in('agent_id', agentIds);
      }

      let alertsQuery = supabase.from('performance_alerts').select('*').eq('status', 'active').order('created_at', { ascending: false });
      if (agentIds.length > 0 && divisionId) {
        alertsQuery = alertsQuery.in('agent_id', agentIds);
      }

      let summariesQuery = supabase.from('agent_summaries').select('*');
      if (agentIds.length > 0 && divisionId) {
        summariesQuery = summariesQuery.in('agent_id', agentIds);
      }

      const [
        studies,
        goals,
        alerts,
        orgSettings,
        agentSummaries,
        divisionData
      ] = await Promise.all([
        studiesQuery,
        goalsQuery,
        alertsQuery,
        supabase.from('organization_settings').select('*').limit(1).maybeSingle(),
        summariesQuery,
        divisionId && divisionId !== 'unassigned'
          ? supabase.from('divisions').select('*').eq('id', divisionId).maybeSingle()
          : Promise.resolve({ data: null, error: null })
      ]);

      const agentsData = agents.data || [];
      const studiesData = studies.data || [];
      const goalsData = goals.data || [];
      const alertsData = alerts.data || [];
      const summariesData = agentSummaries.data || [];

      const projectedSavings = agentsData.reduce((sum, agent) => {
        if (agent.avg_usage_count > 0 && agent.avg_time_without_agent_minutes > 0) {
          const timeSavedPerUse = agent.avg_time_without_agent_minutes - agent.avg_time_with_agent_minutes;
          const netUsage = agent.avg_usage_count * (1 - (agent.default_usage_discount_percent || 50) / 100);
          const annualHours = (timeSavedPerUse * netUsage) / 60;
          const annualSavings = annualHours * (agent.avg_hourly_wage || 0);
          return sum + annualSavings;
        }
        return sum;
      }, 0);

      const actualSavings = studiesData.reduce((sum, study) => sum + (study.potential_savings || 0), 0);
      const actualTimeSaved = studiesData.reduce((sum, study) => sum + (study.net_time_saved_hours || 0), 0);

      const projectedTimeSaved = agentsData.reduce((sum, agent) => {
        if (agent.avg_usage_count > 0 && agent.avg_time_without_agent_minutes > 0) {
          const timeSavedPerUse = agent.avg_time_without_agent_minutes - agent.avg_time_with_agent_minutes;
          const netUsage = agent.avg_usage_count * (1 - (agent.default_usage_discount_percent || 50) / 100);
          const annualHours = (timeSavedPerUse * netUsage) / 60;
          return sum + annualHours;
        }
        return sum;
      }, 0);

      const agentsWithProjections = agentsData.filter(a =>
        a.avg_usage_count > 0 && a.avg_time_without_agent_minutes > 0
      ).length;

      const agentsWithActuals = new Set(studiesData.map(s => s.agent_id)).size;

      const agentsNeedingValidation = agentsData.filter(agent => {
        const hasProjections = agent.avg_usage_count > 0 && agent.avg_time_without_agent_minutes > 0;
        const hasStudies = studiesData.some(s => s.agent_id === agent.id);
        return hasProjections && !hasStudies;
      });

      return {
        division: divisionData?.data ? {
          id: divisionData.data.id,
          name: divisionData.data.name,
          description: divisionData.data.description
        } : (divisionId === 'unassigned' ? { id: 'unassigned', name: 'Unassigned Agents', description: null } : null),
        organization: {
          name: orgSettings.data?.organization_name || 'Your Organization',
          totalEmployees: orgSettings.data?.total_employees || 100,
          fiscalYearStartMonth: orgSettings.data?.fiscal_year_start_month || 1,
          standardWorkHoursPerYear: orgSettings.data?.standard_work_hours_per_year || 2080
        },
        summary: {
          totalAgents: agentsData.length,
          agentsWithProjections,
          agentsWithActuals,
          totalStudies: studiesData.length,
          projectedAnnualSavings: Math.round(projectedSavings),
          actualMeasuredSavings: Math.round(actualSavings),
          projectedAnnualTimeSaved: Math.round(projectedTimeSaved * 10) / 10,
          actualMeasuredTimeSaved: Math.round(actualTimeSaved * 10) / 10,
          variance: projectedSavings > 0 ? Math.round(((actualSavings / projectedSavings) * 100 - 100) * 10) / 10 : 0,
          projectedFTE: Math.round((projectedTimeSaved / 2080) * 100) / 100,
          actualFTE: Math.round((actualTimeSaved / 2080) * 100) / 100
        },
        agents: agentsData.map(agent => {
          const summary = summariesData.find(s => s.agent_id === agent.id);
          const agentStudies = studiesData.filter(s => s.agent_id === agent.id);

          let projectedAnnualSavings = 0;
          let projectedAnnualHours = 0;

          if (agent.avg_usage_count > 0 && agent.avg_time_without_agent_minutes > 0) {
            const timeSavedPerUse = agent.avg_time_without_agent_minutes - agent.avg_time_with_agent_minutes;
            const netUsage = agent.avg_usage_count * (1 - (agent.default_usage_discount_percent || 50) / 100);
            projectedAnnualHours = (timeSavedPerUse * netUsage) / 60;
            projectedAnnualSavings = projectedAnnualHours * (agent.avg_hourly_wage || 0);
          }

          return {
            id: agent.id,
            name: agent.name,
            category: agent.category,
            status: agent.status,
            projectedAnnualSavings: Math.round(projectedAnnualSavings),
            projectedAnnualHours: Math.round(projectedAnnualHours * 10) / 10,
            actualSavings: Math.round(summary?.total_potential_savings || 0),
            actualHours: Math.round((summary?.total_time_saved_hours || 0) * 10) / 10,
            totalStudies: agentStudies.length,
            hasProjections: agent.avg_usage_count > 0 && agent.avg_time_without_agent_minutes > 0,
            lastStudyDate: summary?.last_study_date
          };
        }),
        agentsNeedingValidation: agentsNeedingValidation.map(a => ({
          id: a.id,
          name: a.name,
          category: a.category
        })),
        goals: goalsData.map(goal => ({
          id: goal.id,
          agentId: goal.agent_id,
          goalType: goal.goal_type,
          targetValue: goal.target_value,
          currentValue: goal.current_value,
          targetDate: goal.target_date,
          status: goal.status,
          dataSource: goal.data_source,
          description: goal.description
        })),
        alerts: alertsData.map(alert => ({
          id: alert.id,
          agentId: alert.agent_id,
          type: alert.alert_type,
          severity: alert.severity,
          message: alert.message,
          createdAt: alert.created_at
        })),
        recentStudies: studiesData.slice(0, 10).map(study => ({
          id: study.id,
          agentId: study.agent_id,
          agentName: study.agents?.name,
          taskDescription: study.task_description,
          timeSavedMinutes: study.time_saved_minutes,
          netTimeSavedHours: study.net_time_saved_hours,
          potentialSavings: study.potential_savings,
          studyDate: study.study_date
        }))
      };
    } catch (error) {
      console.error('Error fetching comprehensive context:', error);
      return {
        division: null,
        organization: { name: 'Your Organization', totalEmployees: 100, fiscalYearStartMonth: 1, standardWorkHoursPerYear: 2080 },
        summary: {
          totalAgents: 0,
          agentsWithProjections: 0,
          agentsWithActuals: 0,
          totalStudies: 0,
          projectedAnnualSavings: 0,
          actualMeasuredSavings: 0,
          projectedAnnualTimeSaved: 0,
          actualMeasuredTimeSaved: 0,
          variance: 0,
          projectedFTE: 0,
          actualFTE: 0
        },
        agents: [],
        agentsNeedingValidation: [],
        goals: [],
        alerts: [],
        recentStudies: []
      };
    }
  }
};
