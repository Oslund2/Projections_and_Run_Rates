import { supabase } from '../lib/supabase';
import { calculateAgentProjections, type AgentProjectionInputs } from '../utils/calculations';

export interface ScenarioParameters {
  usageMultiplier?: number;
  wageMultiplier?: number;
  newAgentsCount?: number;
  efficiencyImprovement?: number;
  discountAdjustment?: number;
}

export interface ScenarioResult {
  projectedTimeSaved: number;
  projectedCostSavings: number;
  projectedFTE: number;
  deltaFromBaseline: {
    timeSaved: number;
    costSavings: number;
    fte: number;
  };
}

export interface SavedScenario {
  id: string;
  scenario_name: string;
  description: string | null;
  scenario_data: ScenarioParameters;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

class ScenarioService {
  async getAll(): Promise<SavedScenario[]> {
    const { data, error } = await supabase
      .from('saved_scenarios')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  async getById(id: string): Promise<SavedScenario | null> {
    const { data, error } = await supabase
      .from('saved_scenarios')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (error) throw error;
    return data;
  }

  async save(
    name: string,
    description: string | null,
    parameters: ScenarioParameters
  ): Promise<SavedScenario> {
    const { data, error } = await supabase
      .from('saved_scenarios')
      .insert({
        scenario_name: name,
        description,
        scenario_data: parameters,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async update(
    id: string,
    name?: string,
    description?: string | null,
    parameters?: ScenarioParameters
  ): Promise<SavedScenario> {
    const updateData: any = {};
    if (name !== undefined) updateData.scenario_name = name;
    if (description !== undefined) updateData.description = description;
    if (parameters !== undefined) updateData.scenario_data = parameters;

    const { data, error } = await supabase
      .from('saved_scenarios')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('saved_scenarios')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }

  async calculateScenario(parameters: ScenarioParameters): Promise<ScenarioResult> {
    const { data: agents, error } = await supabase
      .from('agents')
      .select('*')
      .eq('status', 'active');

    if (error) throw error;

    const baseline = this.calculateBaselineProjections(agents || []);
    const scenario = this.calculateScenarioProjections(agents || [], parameters);

    return {
      projectedTimeSaved: scenario.timeSaved,
      projectedCostSavings: scenario.costSavings,
      projectedFTE: scenario.fte,
      deltaFromBaseline: {
        timeSaved: scenario.timeSaved - baseline.timeSaved,
        costSavings: scenario.costSavings - baseline.costSavings,
        fte: scenario.fte - baseline.fte,
      },
    };
  }

  private calculateBaselineProjections(agents: any[]) {
    let totalTimeSaved = 0;
    let totalCostSavings = 0;
    let totalFTE = 0;

    agents.forEach(agent => {
      if (
        agent.avg_time_without_agent_minutes &&
        agent.avg_time_with_agent_minutes &&
        agent.avg_usage_count &&
        agent.avg_hourly_wage
      ) {
        const projection = calculateAgentProjections({
          avgTimeWithoutAgentMinutes: agent.avg_time_without_agent_minutes,
          avgTimeWithAgentMinutes: agent.avg_time_with_agent_minutes,
          avgUsageCount: agent.avg_usage_count,
          usageDiscountPercent: agent.default_usage_discount_percent || 50,
          avgHourlyWage: agent.avg_hourly_wage,
        });

        totalTimeSaved += projection.annualTimeSavedHours;
        totalCostSavings += projection.annualCostSavings;
        totalFTE += projection.fteEquivalent;
      }
    });

    return {
      timeSaved: totalTimeSaved,
      costSavings: totalCostSavings,
      fte: totalFTE,
    };
  }

  private calculateScenarioProjections(agents: any[], parameters: ScenarioParameters) {
    const {
      usageMultiplier = 1,
      wageMultiplier = 1,
      newAgentsCount = 0,
      efficiencyImprovement = 0,
      discountAdjustment = 0,
    } = parameters;

    let totalTimeSaved = 0;
    let totalCostSavings = 0;
    let totalFTE = 0;

    agents.forEach(agent => {
      if (
        agent.avg_time_without_agent_minutes &&
        agent.avg_time_with_agent_minutes &&
        agent.avg_usage_count &&
        agent.avg_hourly_wage
      ) {
        const adjustedTimeWithAI =
          agent.avg_time_with_agent_minutes * (1 - efficiencyImprovement / 100);

        const projection = calculateAgentProjections({
          avgTimeWithoutAgentMinutes: agent.avg_time_without_agent_minutes,
          avgTimeWithAgentMinutes: adjustedTimeWithAI,
          avgUsageCount: agent.avg_usage_count * usageMultiplier,
          usageDiscountPercent: Math.max(
            0,
            Math.min(100, (agent.default_usage_discount_percent || 50) + discountAdjustment)
          ),
          avgHourlyWage: agent.avg_hourly_wage * wageMultiplier,
        });

        totalTimeSaved += projection.annualTimeSavedHours;
        totalCostSavings += projection.annualCostSavings;
        totalFTE += projection.fteEquivalent;
      }
    });

    if (newAgentsCount > 0 && agents.length > 0) {
      const avgProjection = {
        timeSaved: totalTimeSaved / agents.length,
        costSavings: totalCostSavings / agents.length,
        fte: totalFTE / agents.length,
      };

      totalTimeSaved += avgProjection.timeSaved * newAgentsCount;
      totalCostSavings += avgProjection.costSavings * newAgentsCount;
      totalFTE += avgProjection.fte * newAgentsCount;
    }

    return {
      timeSaved: totalTimeSaved,
      costSavings: totalCostSavings,
      fte: totalFTE,
    };
  }

  async compareScenarios(scenarioIds: string[]): Promise<any[]> {
    const scenarios = await Promise.all(
      scenarioIds.map(id => this.getById(id))
    );

    const results = await Promise.all(
      scenarios
        .filter((s): s is SavedScenario => s !== null)
        .map(async scenario => {
          const result = await this.calculateScenario(scenario.scenario_data);
          return {
            id: scenario.id,
            name: scenario.scenario_name,
            description: scenario.description,
            parameters: scenario.scenario_data,
            results: result,
          };
        })
    );

    return results;
  }

  createPresetScenarios(): Array<{ name: string; description: string; parameters: ScenarioParameters }> {
    return [
      {
        name: 'Conservative Growth',
        description: '25% increase in usage with current efficiency',
        parameters: {
          usageMultiplier: 1.25,
          wageMultiplier: 1,
          newAgentsCount: 0,
          efficiencyImprovement: 0,
          discountAdjustment: 0,
        },
      },
      {
        name: 'Aggressive Expansion',
        description: '50% usage increase, 3 new agents, 10% efficiency gains',
        parameters: {
          usageMultiplier: 1.5,
          wageMultiplier: 1,
          newAgentsCount: 3,
          efficiencyImprovement: 10,
          discountAdjustment: 0,
        },
      },
      {
        name: 'Optimization Focus',
        description: '20% efficiency improvement on existing agents',
        parameters: {
          usageMultiplier: 1,
          wageMultiplier: 1,
          newAgentsCount: 0,
          efficiencyImprovement: 20,
          discountAdjustment: -10,
        },
      },
      {
        name: 'Wage Increase Impact',
        description: 'Assess impact of 15% wage increase',
        parameters: {
          usageMultiplier: 1,
          wageMultiplier: 1.15,
          newAgentsCount: 0,
          efficiencyImprovement: 0,
          discountAdjustment: 0,
        },
      },
      {
        name: 'Reduced Adoption',
        description: '20% decrease in usage, conservative discount',
        parameters: {
          usageMultiplier: 0.8,
          wageMultiplier: 1,
          newAgentsCount: 0,
          efficiencyImprovement: 0,
          discountAdjustment: 10,
        },
      },
    ];
  }
}

export const scenarioService = new ScenarioService();
