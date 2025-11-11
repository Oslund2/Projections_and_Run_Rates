import { supabase } from '../lib/supabase';
import type { Database } from '../lib/database.types';

type StudyVariable = Database['public']['Tables']['study_variables']['Row'];
type StudyVariableInsert = Database['public']['Tables']['study_variables']['Insert'];
type StudyVariableUpdate = Database['public']['Tables']['study_variables']['Update'];

export const variableService = {
  async getAll() {
    const { data, error } = await supabase
      .from('study_variables')
      .select('*')
      .order('variable_name');

    if (error) throw error;
    return data as StudyVariable[];
  },

  async getByName(name: string) {
    const { data, error } = await supabase
      .from('study_variables')
      .select('*')
      .eq('variable_name', name)
      .maybeSingle();

    if (error) throw error;
    return data as StudyVariable | null;
  },

  async create(variable: StudyVariableInsert) {
    const { data, error } = await supabase
      .from('study_variables')
      .insert(variable)
      .select()
      .single();

    if (error) throw error;
    return data as StudyVariable;
  },

  async update(id: string, variable: StudyVariableUpdate) {
    const { data, error } = await supabase
      .from('study_variables')
      .update(variable)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data as StudyVariable;
  },

  async delete(id: string) {
    const { error } = await supabase
      .from('study_variables')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  async getDefaults() {
    const { data, error } = await supabase
      .from('study_variables')
      .select('*')
      .in('variable_name', ['default_usage_discount_percent', 'default_cost_per_hour']);

    if (error) throw error;

    const defaults = {
      usageDiscountPercent: 50,
      costPerHour: 20
    };

    data?.forEach(variable => {
      if (variable.variable_name === 'default_usage_discount_percent') {
        defaults.usageDiscountPercent = variable.variable_value;
      } else if (variable.variable_name === 'default_cost_per_hour') {
        defaults.costPerHour = variable.variable_value;
      }
    });

    return defaults;
  }
};
