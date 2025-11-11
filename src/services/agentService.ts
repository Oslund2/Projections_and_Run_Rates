import { supabase } from '../lib/supabase';
import type { Database } from '../lib/database.types';

type Agent = Database['public']['Tables']['agents']['Row'];
type AgentInsert = Database['public']['Tables']['agents']['Insert'];
type AgentUpdate = Database['public']['Tables']['agents']['Update'];

export const agentService = {
  async getAll() {
    const { data, error } = await supabase
      .from('agents')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data as Agent[];
  },

  async getById(id: string) {
    const { data, error } = await supabase
      .from('agents')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (error) throw error;
    return data as Agent | null;
  },

  async create(agent: AgentInsert) {
    const { data, error } = await supabase
      .from('agents')
      .insert(agent)
      .select()
      .single();

    if (error) throw error;
    return data as Agent;
  },

  async update(id: string, agent: AgentUpdate) {
    const { data, error } = await supabase
      .from('agents')
      .update(agent)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data as Agent;
  },

  async delete(id: string) {
    const { error } = await supabase
      .from('agents')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  async getWithSummaries() {
    const { data, error } = await supabase
      .from('agents')
      .select(`
        *,
        agent_summaries (
          total_studies,
          total_time_saved_hours,
          total_potential_savings,
          avg_time_saved_per_study,
          last_study_date
        )
      `)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  },

  async getByAdoptionRange(minPercent: number, maxPercent: number) {
    const { data, error } = await supabase
      .from('agents')
      .select('*')
      .gte('adoption_rate_percent', minPercent)
      .lte('adoption_rate_percent', maxPercent)
      .order('adoption_rate_percent', { ascending: false });

    if (error) throw error;
    return data as Agent[];
  },

  async updateAdoption(id: string, targetUserBase: number, currentActiveUsers: number, methodology?: string, notes?: string) {
    const adoptionData: AgentUpdate = {
      target_user_base: targetUserBase,
      current_active_users: currentActiveUsers,
      adoption_last_updated: new Date().toISOString()
    };

    if (methodology) {
      adoptionData.adoption_methodology = methodology;
    }

    const { data, error } = await supabase
      .from('agents')
      .update(adoptionData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data as Agent;
  },

  async getAdoptionStats() {
    const { data, error } = await supabase
      .from('agents')
      .select('adoption_rate_percent, target_user_base, current_active_users')
      .eq('status', 'active');

    if (error) throw error;

    const agents = data as Agent[];
    const totalAgents = agents.length;

    if (totalAgents === 0) {
      return {
        averageAdoption: 0,
        totalAgents: 0,
        lowAdoption: 0,
        mediumAdoption: 0,
        highAdoption: 0,
        totalTargetUsers: 0,
        totalActiveUsers: 0
      };
    }

    const totalAdoption = agents.reduce((sum, agent) => sum + (agent.adoption_rate_percent || 0), 0);
    const averageAdoption = totalAdoption / totalAgents;

    const lowAdoption = agents.filter(a => (a.adoption_rate_percent || 0) < 33).length;
    const mediumAdoption = agents.filter(a => {
      const rate = a.adoption_rate_percent || 0;
      return rate >= 33 && rate < 67;
    }).length;
    const highAdoption = agents.filter(a => (a.adoption_rate_percent || 0) >= 67).length;

    const totalTargetUsers = agents.reduce((sum, agent) => sum + (agent.target_user_base || 0), 0);
    const totalActiveUsers = agents.reduce((sum, agent) => sum + (agent.current_active_users || 0), 0);

    return {
      averageAdoption,
      totalAgents,
      lowAdoption,
      mediumAdoption,
      highAdoption,
      totalTargetUsers,
      totalActiveUsers
    };
  }
};
