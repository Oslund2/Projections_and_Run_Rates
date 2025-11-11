import { supabase } from '../lib/supabase';
import { statisticsService, type DataPoint } from './statisticsService';

export interface TrendData {
  historical: DataPoint[];
  forecast: DataPoint[];
  movingAverage7Day?: DataPoint[];
  movingAverage30Day?: DataPoint[];
  regression: {
    slope: number;
    intercept: number;
    rSquared: number;
  };
  statistics: {
    mean: number;
    standardDeviation: number;
    growthRate: number;
    coefficientOfVariation: number;
  };
}

export interface SnapshotData {
  id: string;
  agent_id: string | null;
  snapshot_date: string;
  snapshot_type: string;
  total_studies: number;
  total_time_saved_hours: number;
  total_cost_savings: number;
  active_agents: number;
  created_at: string;
  data_source?: string;
}

export interface DataSourceInfo {
  hasSynthetic: boolean;
  hasReal: boolean;
  syntheticCount: number;
  realCount: number;
  totalCount: number;
}

class TrendService {
  async getHistoricalData(
    agentId: string | null,
    startDate?: string,
    endDate?: string,
    snapshotType: 'daily' | 'weekly' | 'monthly' = 'daily',
    divisionId?: string | null
  ): Promise<SnapshotData[]> {
    if (divisionId) {
      let agentQuery = supabase
        .from('agents')
        .select('id');

      if (divisionId === 'unassigned') {
        agentQuery = agentQuery.is('division_id', null);
      } else {
        agentQuery = agentQuery.eq('division_id', divisionId);
      }

      const { data: divisionAgents, error: agentError } = await agentQuery;
      if (agentError) throw agentError;

      const agentIds = divisionAgents?.map(a => a.id) || [];

      if (agentIds.length === 0) {
        return [];
      }

      let query = supabase
        .from('historical_snapshots')
        .select('*')
        .eq('snapshot_type', snapshotType)
        .order('snapshot_date', { ascending: true });

      if (agentId) {
        query = query.eq('agent_id', agentId).in('agent_id', agentIds);
      } else {
        query = query.in('agent_id', agentIds);
      }

      if (startDate) {
        query = query.gte('snapshot_date', startDate);
      }

      if (endDate) {
        query = query.lte('snapshot_date', endDate);
      }

      const { data, error } = await query;
      if (error) throw error;

      const aggregatedData = this.aggregateSnapshotsByDate(data || [], snapshotType);
      return aggregatedData;
    }

    let query = supabase
      .from('historical_snapshots')
      .select('*')
      .eq('snapshot_type', snapshotType)
      .order('snapshot_date', { ascending: true });

    if (agentId) {
      query = query.eq('agent_id', agentId);
    } else {
      query = query.is('agent_id', null);
    }

    if (startDate) {
      query = query.gte('snapshot_date', startDate);
    }

    if (endDate) {
      query = query.lte('snapshot_date', endDate);
    }

    const { data, error } = await query;

    if (error) throw error;
    return data || [];
  }

  async getTrendAnalysis(
    agentId: string | null,
    metric: 'time_saved' | 'cost_savings' | 'study_count',
    daysAhead: number = 30,
    divisionId?: string | null
  ): Promise<TrendData> {
    const endDate = new Date().toISOString().split('T')[0];
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 90);
    const startDateStr = startDate.toISOString().split('T')[0];

    const snapshots = await this.getHistoricalData(
      agentId,
      startDateStr,
      endDate,
      'daily',
      divisionId
    );

    const metricMap = {
      time_saved: 'total_time_saved_hours',
      cost_savings: 'total_cost_savings',
      study_count: 'total_studies',
    };

    const metricKey = metricMap[metric] as keyof SnapshotData;

    const historical: DataPoint[] = snapshots.map(snapshot => ({
      date: snapshot.snapshot_date,
      value: Number(snapshot[metricKey]) || 0,
    }));

    if (historical.length === 0) {
      return {
        historical: [],
        forecast: [],
        regression: { slope: 0, intercept: 0, rSquared: 0 },
        statistics: {
          mean: 0,
          standardDeviation: 0,
          growthRate: 0,
          coefficientOfVariation: 0,
        },
      };
    }

    const values = historical.map(p => p.value);
    const regression = statisticsService.performLinearRegression(historical);
    const forecast = statisticsService.forecastFuture(historical, daysAhead);

    const movingAverage7Day =
      historical.length >= 7
        ? statisticsService.calculateMovingAverage(historical, 7)
        : undefined;

    const movingAverage30Day =
      historical.length >= 30
        ? statisticsService.calculateMovingAverage(historical, 30)
        : undefined;

    return {
      historical,
      forecast,
      movingAverage7Day,
      movingAverage30Day,
      regression: {
        slope: regression.slope,
        intercept: regression.intercept,
        rSquared: regression.rSquared,
      },
      statistics: {
        mean: statisticsService.calculateMean(values),
        standardDeviation: statisticsService.calculateStandardDeviation(values),
        growthRate: statisticsService.calculateGrowthRate(historical),
        coefficientOfVariation: statisticsService.calculateCoefficientOfVariation(values),
      },
    };
  }

  async createSnapshot(): Promise<void> {
    const { error } = await supabase.rpc('create_daily_snapshot');
    if (error) throw error;
  }

  async getAgentPerformanceComparison(metric: 'time_saved' | 'cost_savings' = 'cost_savings') {
    const agents = await supabase
      .from('agents')
      .select('id, name, category')
      .eq('status', 'active');

    if (agents.error) throw agents.error;

    const comparisons = await Promise.all(
      (agents.data || []).map(async agent => {
        const trend = await this.getTrendAnalysis(agent.id, metric, 30);
        return {
          agentId: agent.id,
          agentName: agent.name,
          category: agent.category,
          currentValue: trend.historical[trend.historical.length - 1]?.value || 0,
          forecastedValue: trend.forecast[trend.forecast.length - 1]?.value || 0,
          growthRate: trend.statistics.growthRate,
          consistency: 100 - Math.min(100, trend.statistics.coefficientOfVariation),
        };
      })
    );

    return comparisons.sort((a, b) => b.currentValue - a.currentValue);
  }

  async getOrganizationTrend(
    metric: 'time_saved' | 'cost_savings' | 'study_count',
    daysBack: number = 90
  ) {
    return this.getTrendAnalysis(null, metric, 30);
  }

  async generateSeedData(daysBack: number = 30): Promise<void> {
    const agents = await supabase
      .from('agents')
      .select('id')
      .eq('status', 'active');

    if (agents.error) throw agents.error;

    const snapshots: any[] = [];
    const today = new Date();

    for (let i = daysBack; i >= 0; i--) {
      const snapshotDate = new Date(today);
      snapshotDate.setDate(snapshotDate.getDate() - i);
      const dateStr = snapshotDate.toISOString().split('T')[0];

      const baseValue = 100;
      const growthFactor = 1 + (daysBack - i) * 0.02;
      const randomVariation = 0.8 + Math.random() * 0.4;

      snapshots.push({
        agent_id: null,
        snapshot_date: dateStr,
        snapshot_type: 'daily',
        total_studies: Math.floor(baseValue * growthFactor * randomVariation),
        total_time_saved_hours: Math.floor(baseValue * 2 * growthFactor * randomVariation),
        total_cost_savings: Math.floor(baseValue * 50 * growthFactor * randomVariation),
        active_agents: agents.data?.length || 1,
        data_source: 'synthetic',
      });

      for (const agent of agents.data || []) {
        const agentBaseValue = 20;
        const agentGrowth = 1 + (daysBack - i) * 0.015;
        const agentVariation = 0.7 + Math.random() * 0.6;

        snapshots.push({
          agent_id: agent.id,
          snapshot_date: dateStr,
          snapshot_type: 'daily',
          total_studies: Math.floor(agentBaseValue * agentGrowth * agentVariation),
          total_time_saved_hours: Math.floor(agentBaseValue * 2 * agentGrowth * agentVariation),
          total_cost_savings: Math.floor(agentBaseValue * 50 * agentGrowth * agentVariation),
          active_agents: 1,
          data_source: 'synthetic',
        });
      }
    }

    const { error } = await supabase
      .from('historical_snapshots')
      .insert(snapshots);

    if (error) throw error;
  }

  async clearHistoricalData(): Promise<void> {
    const { error } = await supabase
      .from('historical_snapshots')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000');

    if (error) throw error;
  }

  async clearSyntheticData(): Promise<void> {
    const { error } = await supabase
      .from('historical_snapshots')
      .delete()
      .eq('data_source', 'synthetic');

    if (error) throw error;
  }

  async getDataSourceInfo(): Promise<DataSourceInfo> {
    const { data, error } = await supabase
      .from('historical_snapshots')
      .select('data_source');

    if (error) throw error;

    const syntheticCount = data?.filter(s => s.data_source === 'synthetic').length || 0;
    const realCount = data?.filter(s => s.data_source === 'real').length || 0;
    const totalCount = data?.length || 0;

    return {
      hasSynthetic: syntheticCount > 0,
      hasReal: realCount > 0,
      syntheticCount,
      realCount,
      totalCount,
    };
  }

  async hasRealStudyData(): Promise<boolean> {
    const { data, error } = await supabase
      .from('time_motion_studies')
      .select('id')
      .limit(1);

    if (error) throw error;
    return (data?.length || 0) > 0;
  }

  private aggregateSnapshotsByDate(
    snapshots: SnapshotData[],
    snapshotType: string
  ): SnapshotData[] {
    const dateMap = new Map<string, SnapshotData>();

    snapshots.forEach(snapshot => {
      const existing = dateMap.get(snapshot.snapshot_date);
      if (existing) {
        existing.total_studies += snapshot.total_studies;
        existing.total_time_saved_hours += snapshot.total_time_saved_hours;
        existing.total_cost_savings += snapshot.total_cost_savings;
        existing.active_agents = Math.max(existing.active_agents, snapshot.active_agents);
      } else {
        dateMap.set(snapshot.snapshot_date, { ...snapshot });
      }
    });

    return Array.from(dateMap.values()).sort((a, b) =>
      a.snapshot_date.localeCompare(b.snapshot_date)
    );
  }
}

export const trendService = new TrendService();
