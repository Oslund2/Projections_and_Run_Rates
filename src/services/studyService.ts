import { supabase } from '../lib/supabase';
import type { Database } from '../lib/database.types';

type TimeMotionStudy = Database['public']['Tables']['time_motion_studies']['Row'];
type TimeMotionStudyInsert = Database['public']['Tables']['time_motion_studies']['Insert'];
type TimeMotionStudyUpdate = Database['public']['Tables']['time_motion_studies']['Update'];

export interface StudyWithAgent extends TimeMotionStudy {
  agents: {
    name: string;
    category: string | null;
  };
}

export const studyService = {
  async getAll() {
    const { data, error } = await supabase
      .from('time_motion_studies')
      .select(`
        *,
        agents (
          name,
          category
        )
      `)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data as StudyWithAgent[];
  },

  async getById(id: string) {
    const { data, error } = await supabase
      .from('time_motion_studies')
      .select(`
        *,
        agents (
          name,
          category
        )
      `)
      .eq('id', id)
      .maybeSingle();

    if (error) throw error;
    return data as StudyWithAgent | null;
  },

  async getByAgentId(agentId: string) {
    const { data, error } = await supabase
      .from('time_motion_studies')
      .select(`
        *,
        agents (
          name,
          category
        )
      `)
      .eq('agent_id', agentId)
      .order('study_date', { ascending: false });

    if (error) throw error;
    return data as StudyWithAgent[];
  },

  async create(study: TimeMotionStudyInsert) {
    const { data, error } = await supabase
      .from('time_motion_studies')
      .insert(study)
      .select(`
        *,
        agents (
          name,
          category
        )
      `)
      .single();

    if (error) throw error;
    return data as StudyWithAgent;
  },

  async createMany(studies: TimeMotionStudyInsert[]) {
    const { data, error } = await supabase
      .from('time_motion_studies')
      .insert(studies)
      .select(`
        *,
        agents (
          name,
          category
        )
      `);

    if (error) throw error;
    return data as StudyWithAgent[];
  },

  async update(id: string, study: TimeMotionStudyUpdate) {
    const { data, error } = await supabase
      .from('time_motion_studies')
      .update(study)
      .eq('id', id)
      .select(`
        *,
        agents (
          name,
          category
        )
      `)
      .single();

    if (error) throw error;
    return data as StudyWithAgent;
  },

  async delete(id: string) {
    const { error } = await supabase
      .from('time_motion_studies')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  async getTotalSavings() {
    const { data, error } = await supabase
      .from('time_motion_studies')
      .select('net_time_saved_hours, potential_savings');

    if (error) throw error;

    const totalTimeSaved = data.reduce((sum, study) => sum + (study.net_time_saved_hours || 0), 0);
    const totalSavings = data.reduce((sum, study) => sum + (study.potential_savings || 0), 0);

    return {
      totalTimeSaved,
      totalSavings,
      totalStudies: data.length
    };
  }
};
