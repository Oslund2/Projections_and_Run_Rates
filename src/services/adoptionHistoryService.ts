import { supabase } from '../lib/supabase';
import type { Database } from '../lib/database.types';

type AdoptionHistory = Database['public']['Tables']['adoption_history']['Row'];
type AdoptionHistoryInsert = Database['public']['Tables']['adoption_history']['Insert'];

export const adoptionHistoryService = {
  async getByAgentId(agentId: string) {
    const { data, error } = await supabase
      .from('adoption_history')
      .select('*')
      .eq('agent_id', agentId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data as AdoptionHistory[];
  },

  async create(history: AdoptionHistoryInsert) {
    const { data, error } = await supabase
      .from('adoption_history')
      .insert(history)
      .select()
      .single();

    if (error) throw error;
    return data as AdoptionHistory;
  },

  async getRecentChanges(limit: number = 10) {
    const { data, error } = await supabase
      .from('adoption_history')
      .select(`
        *,
        agents (
          name,
          category
        )
      `)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data;
  },

  async getAdoptionTrend(agentId: string, startDate?: string, endDate?: string) {
    let query = supabase
      .from('adoption_history')
      .select('new_adoption_rate, created_at')
      .eq('agent_id', agentId)
      .order('created_at', { ascending: true });

    if (startDate) {
      query = query.gte('created_at', startDate);
    }

    if (endDate) {
      query = query.lte('created_at', endDate);
    }

    const { data, error } = await query;

    if (error) throw error;
    return data;
  },

  async getAdoptionStats(agentId: string) {
    const history = await this.getByAgentId(agentId);

    if (history.length === 0) {
      return {
        totalChanges: 0,
        averageChange: 0,
        maxAdoption: 0,
        minAdoption: 0,
        trend: 'stable' as 'increasing' | 'decreasing' | 'stable'
      };
    }

    const adoptionRates = history.map(h => h.new_adoption_rate || 0);
    const changes = history.slice(0, -1).map((h, i) => {
      const prev = history[i + 1]?.new_adoption_rate || 0;
      const current = h.new_adoption_rate || 0;
      return current - prev;
    });

    const averageChange = changes.length > 0
      ? changes.reduce((sum, change) => sum + change, 0) / changes.length
      : 0;

    const maxAdoption = Math.max(...adoptionRates);
    const minAdoption = Math.min(...adoptionRates);

    let trend: 'increasing' | 'decreasing' | 'stable' = 'stable';
    if (averageChange > 1) {
      trend = 'increasing';
    } else if (averageChange < -1) {
      trend = 'decreasing';
    }

    return {
      totalChanges: history.length,
      averageChange,
      maxAdoption,
      minAdoption,
      trend
    };
  }
};
