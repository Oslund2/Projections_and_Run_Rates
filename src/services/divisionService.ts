import { supabase } from '../lib/supabase';
import type { Database } from '../lib/database.types';

type Division = Database['public']['Tables']['divisions']['Row'];
type DivisionInsert = Database['public']['Tables']['divisions']['Insert'];
type DivisionUpdate = Database['public']['Tables']['divisions']['Update'];

export const divisionService = {
  async getAll(): Promise<Division[]> {
    const { data, error } = await supabase
      .from('divisions')
      .select('*')
      .order('name');

    if (error) throw error;
    return data || [];
  },

  async getById(id: string): Promise<Division | null> {
    const { data, error } = await supabase
      .from('divisions')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (error) throw error;
    return data;
  },

  async getWithHierarchy(): Promise<Division[]> {
    const divisions = await this.getAll();
    return divisions;
  },

  async create(division: DivisionInsert): Promise<Division> {
    const { data, error } = await supabase
      .from('divisions')
      .insert(division)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async update(id: string, updates: DivisionUpdate): Promise<Division> {
    const { data, error } = await supabase
      .from('divisions')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('divisions')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  async getAgentsByDivision(divisionId: string) {
    const { data, error } = await supabase
      .from('agents')
      .select('*')
      .eq('division_id', divisionId);

    if (error) throw error;
    return data || [];
  },

  async getUnassignedAgents() {
    const { data, error } = await supabase
      .from('agents')
      .select('*')
      .is('division_id', null);

    if (error) throw error;
    return data || [];
  }
};
