export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      agents: {
        Row: {
          id: string
          name: string
          category: string | null
          description: string | null
          status: string | null
          created_at: string | null
          updated_at: string | null
          default_usage_discount_percent: number | null
          default_cost_per_employee_hour: number | null
          avg_time_without_agent_minutes: number | null
          avg_time_with_agent_minutes: number | null
          avg_usage_count: number | null
          avg_hourly_wage: number | null
          division_id: string | null
          lifecycle_status: string | null
          build_effort_hours: number | null
          strategic_value_score: number | null
          priority_score: number | null
          projection_methodology: string | null
          confidence_level: string | null
          validation_status: string | null
          target_user_base: number | null
          current_active_users: number | null
          adoption_rate_percent: number | null
          adoption_methodology: string | null
          adoption_last_updated: string | null
          potential_usage_at_full_adoption: number | null
        }
        Insert: {
          id?: string
          name: string
          category?: string | null
          description?: string | null
          status?: string | null
          created_at?: string | null
          updated_at?: string | null
          default_usage_discount_percent?: number | null
          default_cost_per_employee_hour?: number | null
          avg_time_without_agent_minutes?: number | null
          avg_time_with_agent_minutes?: number | null
          avg_usage_count?: number | null
          avg_hourly_wage?: number | null
          division_id?: string | null
          lifecycle_status?: string | null
          build_effort_hours?: number | null
          strategic_value_score?: number | null
          priority_score?: number | null
          projection_methodology?: string | null
          confidence_level?: string | null
          validation_status?: string | null
          target_user_base?: number | null
          current_active_users?: number | null
          adoption_rate_percent?: number | null
          adoption_methodology?: string | null
          adoption_last_updated?: string | null
          potential_usage_at_full_adoption?: number | null
        }
        Update: {
          id?: string
          name?: string
          category?: string | null
          description?: string | null
          status?: string | null
          created_at?: string | null
          updated_at?: string | null
          default_usage_discount_percent?: number | null
          default_cost_per_employee_hour?: number | null
          avg_time_without_agent_minutes?: number | null
          avg_time_with_agent_minutes?: number | null
          avg_usage_count?: number | null
          avg_hourly_wage?: number | null
          division_id?: string | null
          lifecycle_status?: string | null
          build_effort_hours?: number | null
          strategic_value_score?: number | null
          priority_score?: number | null
          projection_methodology?: string | null
          confidence_level?: string | null
          validation_status?: string | null
          target_user_base?: number | null
          current_active_users?: number | null
          adoption_rate_percent?: number | null
          adoption_methodology?: string | null
          adoption_last_updated?: string | null
          potential_usage_at_full_adoption?: number | null
        }
      }
      time_motion_studies: {
        Row: {
          id: string
          agent_id: string
          task_description: string
          time_without_ai_minutes: number
          time_with_ai_minutes: number
          usage_count: number
          usage_discount_percent: number | null
          cost_per_hour: number
          time_saved_minutes: number | null
          net_usage: number | null
          net_time_saved_hours: number | null
          potential_savings: number | null
          study_date: string | null
          notes: string | null
          created_at: string | null
          updated_at: string | null
          created_by: string | null
          study_status: string | null
          assigned_to: string | null
          quality_rating: number | null
          study_template: string | null
          lessons_learned: string | null
        }
        Insert: {
          id?: string
          agent_id: string
          task_description: string
          time_without_ai_minutes: number
          time_with_ai_minutes: number
          usage_count: number
          usage_discount_percent?: number | null
          cost_per_hour: number
          time_saved_minutes?: number | null
          net_usage?: number | null
          net_time_saved_hours?: number | null
          potential_savings?: number | null
          study_date?: string | null
          notes?: string | null
          created_at?: string | null
          updated_at?: string | null
          created_by?: string | null
          study_status?: string | null
          assigned_to?: string | null
          quality_rating?: number | null
          study_template?: string | null
          lessons_learned?: string | null
        }
        Update: {
          id?: string
          agent_id?: string
          task_description?: string
          time_without_ai_minutes?: number
          time_with_ai_minutes?: number
          usage_count?: number
          usage_discount_percent?: number | null
          cost_per_hour?: number
          time_saved_minutes?: number | null
          net_usage?: number | null
          net_time_saved_hours?: number | null
          potential_savings?: number | null
          study_date?: string | null
          notes?: string | null
          created_at?: string | null
          updated_at?: string | null
          created_by?: string | null
          study_status?: string | null
          assigned_to?: string | null
          quality_rating?: number | null
          study_template?: string | null
          lessons_learned?: string | null
        }
      }
      study_variables: {
        Row: {
          id: string
          variable_name: string
          variable_value: number
          description: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          variable_name: string
          variable_value: number
          description?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          variable_name?: string
          variable_value?: number
          description?: string | null
          updated_at?: string | null
        }
      }
      agent_summaries: {
        Row: {
          agent_id: string
          total_studies: number | null
          total_time_saved_hours: number | null
          total_potential_savings: number | null
          avg_time_saved_per_study: number | null
          last_study_date: string | null
          updated_at: string | null
        }
        Insert: {
          agent_id: string
          total_studies?: number | null
          total_time_saved_hours?: number | null
          total_potential_savings?: number | null
          avg_time_saved_per_study?: number | null
          last_study_date?: string | null
          updated_at?: string | null
        }
        Update: {
          agent_id?: string
          total_studies?: number | null
          total_time_saved_hours?: number | null
          total_potential_savings?: number | null
          avg_time_saved_per_study?: number | null
          last_study_date?: string | null
          updated_at?: string | null
        }
      }
      historical_snapshots: {
        Row: {
          id: string
          agent_id: string | null
          snapshot_date: string
          snapshot_type: string
          total_studies: number
          total_time_saved_hours: number
          total_cost_savings: number
          active_agents: number
          created_at: string
        }
        Insert: {
          id?: string
          agent_id?: string | null
          snapshot_date: string
          snapshot_type: string
          total_studies?: number
          total_time_saved_hours?: number
          total_cost_savings?: number
          active_agents?: number
          created_at?: string
        }
        Update: {
          id?: string
          agent_id?: string | null
          snapshot_date?: string
          snapshot_type?: string
          total_studies?: number
          total_time_saved_hours?: number
          total_cost_savings?: number
          active_agents?: number
          created_at?: string
        }
      }
      agent_goals: {
        Row: {
          id: string
          agent_id: string | null
          goal_type: string
          target_value: number
          target_date: string
          current_value: number
          status: string
          description: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          agent_id?: string | null
          goal_type: string
          target_value: number
          target_date: string
          current_value?: number
          status?: string
          description?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          agent_id?: string | null
          goal_type?: string
          target_value?: number
          target_date?: string
          current_value?: number
          status?: string
          description?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      performance_alerts: {
        Row: {
          id: string
          agent_id: string
          alert_type: string
          severity: string
          message: string
          details: Json | null
          status: string
          created_at: string
          resolved_at: string | null
        }
        Insert: {
          id?: string
          agent_id: string
          alert_type: string
          severity: string
          message: string
          details?: Json | null
          status?: string
          created_at?: string
          resolved_at?: string | null
        }
        Update: {
          id?: string
          agent_id?: string
          alert_type?: string
          severity?: string
          message?: string
          details?: Json | null
          status?: string
          created_at?: string
          resolved_at?: string | null
        }
      }
      agent_costs: {
        Row: {
          id: string
          agent_id: string
          cost_type: string
          cost_amount: number
          cost_frequency: string
          start_date: string
          end_date: string | null
          description: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          agent_id: string
          cost_type: string
          cost_amount: number
          cost_frequency: string
          start_date: string
          end_date?: string | null
          description?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          agent_id?: string
          cost_type?: string
          cost_amount?: number
          cost_frequency?: string
          start_date?: string
          end_date?: string | null
          description?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      saved_scenarios: {
        Row: {
          id: string
          scenario_name: string
          description: string | null
          scenario_data: Json
          created_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          scenario_name: string
          description?: string | null
          scenario_data: Json
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          scenario_name?: string
          description?: string | null
          scenario_data?: Json
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      annotations: {
        Row: {
          id: string
          reference_type: string
          reference_id: string
          content: string
          created_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          reference_type: string
          reference_id: string
          content: string
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          reference_type?: string
          reference_id?: string
          content?: string
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      organization_settings: {
        Row: {
          id: string
          organization_name: string | null
          total_employees: number
          fiscal_year_start_month: number
          standard_work_hours_per_year: number
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          organization_name?: string | null
          total_employees: number
          fiscal_year_start_month?: number
          standard_work_hours_per_year?: number
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          organization_name?: string | null
          total_employees?: number
          fiscal_year_start_month?: number
          standard_work_hours_per_year?: number
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      chat_conversations: {
        Row: {
          id: string
          user_id: string
          title: string | null
          context_data: Json
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id?: string
          title?: string | null
          context_data?: Json
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          title?: string | null
          context_data?: Json
          created_at?: string
          updated_at?: string
        }
      }
      chat_messages: {
        Row: {
          id: string
          conversation_id: string
          role: string
          content: string
          created_at: string
        }
        Insert: {
          id?: string
          conversation_id: string
          role: string
          content: string
          created_at?: string
        }
        Update: {
          id?: string
          conversation_id?: string
          role?: string
          content?: string
          created_at?: string
        }
      }
      divisions: {
        Row: {
          id: string
          name: string
          description: string | null
          parent_id: string | null
          budget_owner: string
          created_at: string | null
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          parent_id?: string | null
          budget_owner: string
          created_at?: string | null
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          parent_id?: string | null
          budget_owner?: string
          created_at?: string | null
        }
      }
      cost_centers: {
        Row: {
          id: string
          division_id: string
          name: string
          code: string
          created_at: string | null
        }
        Insert: {
          id?: string
          division_id: string
          name: string
          code: string
          created_at?: string | null
        }
        Update: {
          id?: string
          division_id?: string
          name?: string
          code?: string
          created_at?: string | null
        }
      }
      platform_costs: {
        Row: {
          id: string
          division_id: string | null
          cost_type: string
          month: string
          amount: number
          description: string | null
          created_at: string | null
          cost_period: string
          monthly_amount: number
          annual_amount: number
        }
        Insert: {
          id?: string
          division_id?: string | null
          cost_type: string
          month: string
          amount?: number
          description?: string | null
          created_at?: string | null
          cost_period?: string
          monthly_amount?: number
          annual_amount?: number
        }
        Update: {
          id?: string
          division_id?: string | null
          cost_type?: string
          month?: string
          amount?: number
          description?: string | null
          created_at?: string | null
          cost_period?: string
          monthly_amount?: number
          annual_amount?: number
        }
      }
      token_usage: {
        Row: {
          id: string
          agent_id: string
          month: string
          token_count: number
          cost: number
          notes: string | null
          created_at: string | null
          token_period: string
          monthly_token_count: number
          annual_token_count: number
          monthly_cost: number
          annual_cost: number
        }
        Insert: {
          id?: string
          agent_id: string
          month: string
          token_count?: number
          cost?: number
          notes?: string | null
          created_at?: string | null
          token_period?: string
          monthly_token_count?: number
          annual_token_count?: number
          monthly_cost?: number
          annual_cost?: number
        }
        Update: {
          id?: string
          agent_id?: string
          month?: string
          token_count?: number
          cost?: number
          notes?: string | null
          created_at?: string | null
          token_period?: string
          monthly_token_count?: number
          annual_token_count?: number
          monthly_cost?: number
          annual_cost?: number
        }
      }
      ai_team_members: {
        Row: {
          id: string
          name: string
          role: string
          fte_percentage: number
          monthly_cost: number
          division_id: string | null
          start_date: string
          end_date: string | null
          created_at: string | null
        }
        Insert: {
          id?: string
          name: string
          role: string
          fte_percentage?: number
          monthly_cost?: number
          division_id?: string | null
          start_date?: string
          end_date?: string | null
          created_at?: string | null
        }
        Update: {
          id?: string
          name?: string
          role?: string
          fte_percentage?: number
          monthly_cost?: number
          division_id?: string | null
          start_date?: string
          end_date?: string | null
          created_at?: string | null
        }
      }
      ai_quotes: {
        Row: {
          id: string
          quote_text: string
          source: string | null
          category: string | null
          is_active: boolean
          display_order: number | null
          created_at: string
        }
        Insert: {
          id?: string
          quote_text: string
          source?: string | null
          category?: string | null
          is_active?: boolean
          display_order?: number | null
          created_at?: string
        }
        Update: {
          id?: string
          quote_text?: string
          source?: string | null
          category?: string | null
          is_active?: boolean
          display_order?: number | null
          created_at?: string
        }
      }
      adoption_history: {
        Row: {
          id: string
          agent_id: string
          previous_adoption_rate: number | null
          new_adoption_rate: number | null
          previous_target_users: number | null
          new_target_users: number | null
          previous_current_users: number | null
          new_current_users: number | null
          change_notes: string | null
          changed_by: string | null
          created_at: string
        }
        Insert: {
          id?: string
          agent_id: string
          previous_adoption_rate?: number | null
          new_adoption_rate?: number | null
          previous_target_users?: number | null
          new_target_users?: number | null
          previous_current_users?: number | null
          new_current_users?: number | null
          change_notes?: string | null
          changed_by?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          agent_id?: string
          previous_adoption_rate?: number | null
          new_adoption_rate?: number | null
          previous_target_users?: number | null
          new_target_users?: number | null
          previous_current_users?: number | null
          new_current_users?: number | null
          change_notes?: string | null
          changed_by?: string | null
          created_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}
