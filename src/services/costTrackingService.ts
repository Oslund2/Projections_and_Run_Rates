import { supabase } from '../lib/supabase';
import type { Database } from '../lib/database.types';

type PlatformCost = Database['public']['Tables']['platform_costs']['Row'];
type PlatformCostInsert = Database['public']['Tables']['platform_costs']['Insert'];
type TokenUsage = Database['public']['Tables']['token_usage']['Row'];
type TokenUsageInsert = Database['public']['Tables']['token_usage']['Insert'];
type AITeamMember = Database['public']['Tables']['ai_team_members']['Row'];
type AITeamMemberInsert = Database['public']['Tables']['ai_team_members']['Insert'];
type AITeamMemberUpdate = Database['public']['Tables']['ai_team_members']['Update'];

export const costTrackingService = {
  async getPlatformCosts(divisionId?: string, startMonth?: string, endMonth?: string): Promise<PlatformCost[]> {
    let query = supabase
      .from('platform_costs')
      .select('*')
      .order('month', { ascending: false });

    if (divisionId) {
      query = query.eq('division_id', divisionId);
    }

    if (startMonth) {
      query = query.gte('month', startMonth);
    }

    if (endMonth) {
      query = query.lte('month', endMonth);
    }

    const { data, error } = await query;

    if (error) throw error;
    return data || [];
  },

  async addPlatformCost(cost: PlatformCostInsert): Promise<PlatformCost> {
    const { data, error } = await supabase
      .from('platform_costs')
      .insert(cost)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  calculateMonthlyAndAnnual(amount: number, period: 'monthly' | 'annual'): { monthly: number; annual: number } {
    if (period === 'monthly') {
      return {
        monthly: amount,
        annual: amount * 12
      };
    } else {
      return {
        monthly: amount / 12,
        annual: amount
      };
    }
  },

  calculateTokenMonthlyAndAnnual(tokenCount: number, period: 'monthly' | 'annual'): { monthly: number; annual: number } {
    if (period === 'monthly') {
      return {
        monthly: tokenCount,
        annual: tokenCount * 12
      };
    } else {
      return {
        monthly: Math.round(tokenCount / 12),
        annual: tokenCount
      };
    }
  },

  async getTokenUsage(agentId?: string, startMonth?: string, endMonth?: string): Promise<TokenUsage[]> {
    let query = supabase
      .from('token_usage')
      .select('*')
      .order('month', { ascending: false });

    if (agentId) {
      query = query.eq('agent_id', agentId);
    }

    if (startMonth) {
      query = query.gte('month', startMonth);
    }

    if (endMonth) {
      query = query.lte('month', endMonth);
    }

    const { data, error } = await query;

    if (error) throw error;
    return data || [];
  },

  async addTokenUsage(usage: TokenUsageInsert): Promise<TokenUsage> {
    const { data, error } = await supabase
      .from('token_usage')
      .insert(usage)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async getAITeamMembers(divisionId?: string, activeOnly = false): Promise<AITeamMember[]> {
    let query = supabase
      .from('ai_team_members')
      .select('*')
      .order('name');

    if (divisionId) {
      query = query.eq('division_id', divisionId);
    }

    if (activeOnly) {
      query = query.is('end_date', null);
    }

    const { data, error } = await query;

    if (error) throw error;
    return data || [];
  },

  async addAITeamMember(member: AITeamMemberInsert): Promise<AITeamMember> {
    const { data, error } = await supabase
      .from('ai_team_members')
      .insert(member)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async updateAITeamMember(id: string, updates: AITeamMemberUpdate): Promise<AITeamMember> {
    const { data, error } = await supabase
      .from('ai_team_members')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async deleteAITeamMember(id: string): Promise<void> {
    const { error } = await supabase
      .from('ai_team_members')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  async calculateNetROI(divisionId?: string, month?: string) {
    const platformCosts = await this.getPlatformCosts(divisionId, month, month);
    const tokenCosts = await this.getTokenUsage(undefined, month, month);
    const teamMembers = await this.getAITeamMembers(divisionId, true);

    const platformCostTotal = platformCosts.reduce((sum, cost) => sum + Number(cost.annual_amount || cost.amount * 12), 0);

    let tokenCostTotal = 0;
    if (divisionId) {
      const agents = await supabase
        .from('agents')
        .select('id')
        .eq('division_id', divisionId);

      const agentIds = agents.data?.map(a => a.id) || [];
      tokenCostTotal = tokenCosts
        .filter(usage => agentIds.includes(usage.agent_id))
        .reduce((sum, usage) => sum + Number(usage.cost), 0);
    } else {
      tokenCostTotal = tokenCosts.reduce((sum, usage) => sum + Number(usage.cost), 0);
    }

    const teamCostTotal = teamMembers.reduce((sum, member) => {
      return sum + (Number(member.monthly_cost) * Number(member.fte_percentage) / 100);
    }, 0);

    const totalCosts = platformCostTotal + tokenCostTotal + teamCostTotal;

    return {
      platformCosts: platformCostTotal,
      tokenCosts: tokenCostTotal,
      teamCosts: teamCostTotal,
      totalCosts
    };
  }
};
