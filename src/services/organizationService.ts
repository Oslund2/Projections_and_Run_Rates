import { supabase } from '../lib/supabase';

export interface OrganizationSettings {
  id: string;
  organization_name: string | null;
  total_employees: number;
  fiscal_year_start_month: number;
  standard_work_hours_per_year: number;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface UpdateOrganizationSettingsInput {
  organization_name?: string | null;
  total_employees?: number;
  fiscal_year_start_month?: number;
  standard_work_hours_per_year?: number;
  notes?: string | null;
}

export interface FTEContext {
  fte_value: number;
  fte_percentage: number;
  total_employees: number;
}

class OrganizationService {
  async getSettings(): Promise<OrganizationSettings | null> {
    const { data, error } = await supabase
      .from('organization_settings')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) throw error;
    return data;
  }

  async updateSettings(input: UpdateOrganizationSettingsInput): Promise<OrganizationSettings> {
    const existing = await this.getSettings();

    if (!existing) {
      const { data, error } = await supabase
        .from('organization_settings')
        .insert({
          organization_name: input.organization_name || null,
          total_employees: input.total_employees || 100,
          fiscal_year_start_month: input.fiscal_year_start_month || 1,
          standard_work_hours_per_year: input.standard_work_hours_per_year || 2080,
          notes: input.notes || null,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    }

    const { data, error } = await supabase
      .from('organization_settings')
      .update(input)
      .eq('id', existing.id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async getTotalEmployees(divisionId: string | null = null): Promise<number> {
    const { data, error } = await supabase.rpc('get_total_employees');
    if (error) throw error;
    return data || 100;
  }

  async calculateFTEPercentage(fteValue: number): Promise<number> {
    const { data, error } = await supabase.rpc('calculate_fte_percentage', {
      p_fte_value: fteValue,
    });
    if (error) throw error;
    return data || 0;
  }

  async getAgentFTEWithContext(agentId: string): Promise<FTEContext | null> {
    const { data, error } = await supabase.rpc('calculate_agent_projected_fte_with_context', {
      p_agent_id: agentId,
    });

    if (error) throw error;
    if (!data || data.length === 0) return null;

    return {
      fte_value: data[0].fte_value,
      fte_percentage: data[0].fte_percentage,
      total_employees: data[0].total_employees,
    };
  }

  formatFTEWithContext(fteValue: number, totalEmployees: number): string {
    const percentage = totalEmployees > 0 ? (fteValue / totalEmployees) * 100 : 0;
    return `${fteValue.toFixed(2)} FTEs (${percentage.toFixed(2)}% of ${totalEmployees} employees)`;
  }

  formatFTEPercentage(percentage: number): string {
    return `${percentage.toFixed(2)}%`;
  }
}

export const organizationService = new OrganizationService();
