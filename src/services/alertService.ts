import { supabase } from '../lib/supabase';

export type AlertType = 'degradation' | 'outlier' | 'validation_needed' | 'goal_at_risk' | 'data_quality';
export type AlertSeverity = 'low' | 'medium' | 'high' | 'critical';
export type AlertStatus = 'active' | 'acknowledged' | 'resolved' | 'dismissed';

export interface Alert {
  id: string;
  agent_id: string;
  alert_type: AlertType;
  severity: AlertSeverity;
  message: string;
  details: Record<string, any> | null;
  status: AlertStatus;
  created_at: string;
  resolved_at: string | null;
}

export interface AlertWithAgent extends Alert {
  agents: {
    id: string;
    name: string;
    category: string | null;
  };
}

export interface CreateAlertInput {
  agent_id: string;
  alert_type: AlertType;
  severity: AlertSeverity;
  message: string;
  details?: Record<string, any>;
}

class AlertService {
  async getAll(): Promise<AlertWithAgent[]> {
    const { data, error } = await supabase
      .from('performance_alerts')
      .select(`
        *,
        agents (
          id,
          name,
          category
        )
      `)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  async getActive(): Promise<AlertWithAgent[]> {
    const { data, error } = await supabase
      .from('performance_alerts')
      .select(`
        *,
        agents (
          id,
          name,
          category
        )
      `)
      .eq('status', 'active')
      .order('severity', { ascending: false })
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  async getByAgent(agentId: string): Promise<Alert[]> {
    const { data, error } = await supabase
      .from('performance_alerts')
      .select('*')
      .eq('agent_id', agentId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  async getBySeverity(severity: AlertSeverity): Promise<AlertWithAgent[]> {
    const { data, error } = await supabase
      .from('performance_alerts')
      .select(`
        *,
        agents (
          id,
          name,
          category
        )
      `)
      .eq('severity', severity)
      .eq('status', 'active')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  async create(input: CreateAlertInput): Promise<Alert> {
    const { data, error } = await supabase
      .from('performance_alerts')
      .insert({
        agent_id: input.agent_id,
        alert_type: input.alert_type,
        severity: input.severity,
        message: input.message,
        details: input.details || null,
        status: 'active',
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async updateStatus(id: string, status: AlertStatus): Promise<Alert> {
    const updateData: any = { status };

    if (status === 'resolved' || status === 'dismissed') {
      updateData.resolved_at = new Date().toISOString();
    }

    const { data, error } = await supabase
      .from('performance_alerts')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('performance_alerts')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }

  async acknowledge(id: string): Promise<Alert> {
    return this.updateStatus(id, 'acknowledged');
  }

  async resolve(id: string): Promise<Alert> {
    return this.updateStatus(id, 'resolved');
  }

  async dismiss(id: string): Promise<Alert> {
    return this.updateStatus(id, 'dismissed');
  }

  getSeverityColor(severity: AlertSeverity): string {
    const colors: Record<AlertSeverity, string> = {
      low: 'slate',
      medium: 'amber',
      high: 'orange',
      critical: 'rose',
    };
    return colors[severity];
  }

  getAlertTypeLabel(type: AlertType): string {
    const labels: Record<AlertType, string> = {
      degradation: 'Performance Degradation',
      outlier: 'Outlier Detected',
      validation_needed: 'Validation Needed',
      goal_at_risk: 'Goal At Risk',
      data_quality: 'Data Quality Issue',
    };
    return labels[type];
  }

  async getSummary() {
    const alerts = await this.getAll();

    return {
      total: alerts.length,
      active: alerts.filter(a => a.status === 'active').length,
      acknowledged: alerts.filter(a => a.status === 'acknowledged').length,
      resolved: alerts.filter(a => a.status === 'resolved').length,
      dismissed: alerts.filter(a => a.status === 'dismissed').length,
      bySeverity: {
        critical: alerts.filter(a => a.severity === 'critical' && a.status === 'active').length,
        high: alerts.filter(a => a.severity === 'high' && a.status === 'active').length,
        medium: alerts.filter(a => a.severity === 'medium' && a.status === 'active').length,
        low: alerts.filter(a => a.severity === 'low' && a.status === 'active').length,
      },
    };
  }
}

export const alertService = new AlertService();
