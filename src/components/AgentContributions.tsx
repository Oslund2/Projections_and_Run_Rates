import { useEffect, useState } from 'react';
import { Users, TrendingUp } from 'lucide-react';
import { goalService, type AgentContribution } from '../services/goalService';
import { formatCurrency, formatHours, formatNumber } from '../utils/calculations';

interface AgentContributionsProps {
  goalId: string;
  goalType: 'time_saved' | 'cost_saved' | 'fte_impact';
}

export function AgentContributions({ goalId, goalType }: AgentContributionsProps) {
  const [contributions, setContributions] = useState<AgentContribution[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadContributions();
  }, [goalId]);

  const loadContributions = async () => {
    try {
      const data = await goalService.getAgentContributions(goalId);
      setContributions(data);
    } catch (error) {
      console.error('Error loading contributions:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatValue = (value: number): string => {
    switch (goalType) {
      case 'time_saved':
        return formatHours(value) + ' hours';
      case 'cost_saved':
        return formatCurrency(value);
      case 'fte_impact':
        return formatNumber(value * 100) + '%';
      default:
        return formatNumber(value);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-4">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (contributions.length === 0) {
    return (
      <div className="bg-slate-50 rounded-lg border border-slate-200 p-4 text-center">
        <Users className="w-8 h-8 text-slate-400 mx-auto mb-2" />
        <p className="text-sm text-slate-600">No agents with projection data found</p>
      </div>
    );
  }

  const total = contributions.reduce((sum, c) => sum + c.contribution, 0);

  return (
    <div className="bg-white rounded-lg border border-slate-200 p-4">
      <div className="flex items-center space-x-2 mb-4">
        <TrendingUp className="w-5 h-5 text-blue-600" />
        <h4 className="font-semibold text-slate-900">Agent Contributions</h4>
        <span className="text-sm text-slate-500">({contributions.length} agents)</span>
      </div>

      <div className="space-y-3">
        {contributions.map(contrib => (
          <div key={contrib.agent_id} className="flex items-center justify-between">
            <div className="flex-1">
              <div className="flex items-center space-x-2">
                <span className="font-medium text-slate-900">{contrib.agent_name}</span>
                <span className="text-xs text-slate-500">
                  {contrib.percentage.toFixed(1)}% of total
                </span>
              </div>
              <div className="w-full bg-slate-200 rounded-full h-2 mt-1">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all"
                  style={{ width: `${contrib.percentage}%` }}
                />
              </div>
            </div>
            <div className="ml-4 text-right">
              <p className="text-sm font-bold text-slate-900">{formatValue(contrib.contribution)}</p>
            </div>
          </div>
        ))}

        <div className="pt-3 mt-3 border-t border-slate-200">
          <div className="flex items-center justify-between">
            <span className="font-bold text-slate-900">Total from All Agents</span>
            <span className="text-lg font-bold text-blue-600">{formatValue(total)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
