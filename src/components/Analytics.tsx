import { useEffect, useState } from 'react';
import { TrendingUp, BarChart3, Target, CheckCircle2, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { summaryService } from '../services/summaryService';
import { formatCurrency, formatHours, formatNumber } from '../utils/calculations';
import { ButtonTooltip } from './ButtonTooltip';
import { QuoteFooter } from './QuoteFooter';

interface AgentSummaryData {
  agents: {
    id: string;
    name: string;
    category: string | null;
  };
  total_studies: number;
  total_time_saved_hours: number;
  total_potential_savings: number;
  avg_time_saved_per_study: number;
}

interface ProjectedAgentData {
  id: string;
  name: string;
  category: string | null;
  projectedTimeSaved: number;
  projectedCostSavings: number;
  fteEquivalent: number;
}

export function Analytics() {
  const [actualSummaries, setActualSummaries] = useState<AgentSummaryData[]>([]);
  const [projectedAgents, setProjectedAgents] = useState<ProjectedAgentData[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'projected' | 'actual' | 'combined'>('projected');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [actualData, projectedData] = await Promise.all([
        summaryService.getAll(),
        summaryService.getProjectedAgentsDetail()
      ]);
      setActualSummaries(actualData as AgentSummaryData[]);
      setProjectedAgents(projectedData);
    } catch (error) {
      console.error('Error loading analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  const hasProjectedData = projectedAgents.length > 0;
  const hasActualData = actualSummaries.length > 0;

  const maxProjectedTime = Math.max(...projectedAgents.map(a => a.projectedTimeSaved), 1);
  const maxProjectedSavings = Math.max(...projectedAgents.map(a => a.projectedCostSavings), 1);
  const maxActualTime = Math.max(...actualSummaries.map(s => s.total_time_saved_hours), 1);
  const maxActualSavings = Math.max(...actualSummaries.map(s => s.total_potential_savings), 1);

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900">Analytics</h2>
          <p className="text-sm sm:text-base text-slate-600 mt-1 sm:mt-2">Comparative analysis of AI agent performance</p>
        </div>

        {hasProjectedData && hasActualData && (
          <div className="flex items-center space-x-2 bg-white rounded-lg border border-slate-200 p-1 w-full sm:w-auto">
            <button
              onClick={() => setViewMode('projected')}
              className={`flex-1 sm:flex-none px-3 sm:px-4 py-2 rounded text-xs sm:text-sm font-medium transition-colors ${
                viewMode === 'projected'
                  ? 'bg-blue-600 text-white'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Projections
            </button>
            <ButtonTooltip
              content="No validation studies or actuals yet. Complete a study to enable this view."
              showTooltip={hasProjectedData && !hasActualData}
            >
              <button
                onClick={() => setViewMode('actual')}
                className={`flex-1 sm:flex-none px-3 sm:px-4 py-2 rounded text-xs sm:text-sm font-medium transition-colors ${
                  viewMode === 'actual'
                    ? 'bg-emerald-600 text-white'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
                disabled={!hasActualData}
              >
                Run Rate
              </button>
            </ButtonTooltip>
            <button
              onClick={() => setViewMode('combined')}
              className={`flex-1 sm:flex-none px-3 sm:px-4 py-2 rounded text-xs sm:text-sm font-medium transition-colors ${
                viewMode === 'combined'
                  ? 'bg-slate-900 text-white'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Combined
            </button>
          </div>
        )}
      </div>

      {!hasProjectedData && !hasActualData ? (
        <div className="card-elevated p-12 text-center">
          <div className="inline-flex p-4 bg-slate-100 rounded-2xl shadow-sm mb-4">
            <BarChart3 className="w-16 h-16 text-slate-400" />
          </div>
          <p className="text-slate-500">No data available yet. Add agents with projections or complete studies to see analytics.</p>
        </div>
      ) : (
        <>
          {(viewMode === 'projected' || (viewMode === 'combined' && hasProjectedData)) && (
            <>
              <div className="bg-white rounded-xl shadow-sm border border-blue-200 p-4 sm:p-6">
                <div className="flex items-center space-x-2 sm:space-x-3 mb-4 sm:mb-6">
                  <div className="p-2 sm:p-3 bg-blue-50 rounded-lg flex-shrink-0">
                    <Target className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-base sm:text-xl font-bold text-slate-900">Projected Time Saved by Agent</h3>
                    <p className="text-xs sm:text-sm text-slate-500">Based on agent projection variables</p>
                  </div>
                </div>

                <div className="space-y-4">
                  {projectedAgents
                    .sort((a, b) => b.projectedTimeSaved - a.projectedTimeSaved)
                    .map(agent => {
                      const percentage = (agent.projectedTimeSaved / maxProjectedTime) * 100;
                      return (
                        <div key={agent.id} className="space-y-2">
                          <div className="flex justify-between items-center">
                            <div className="flex items-center space-x-2">
                              <span className="font-medium text-slate-900">{agent.name}</span>
                              {agent.category && (
                                <span className="text-xs px-2 py-1 bg-accent-100 text-accent-700 rounded-full">
                                  {agent.category}
                                </span>
                              )}
                            </div>
                            <span className="font-semibold text-accent-700">
                              {formatHours(agent.projectedTimeSaved)} hours
                            </span>
                          </div>
                          <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden">
                            <div
                              className="bg-gradient-to-r from-accent-500 to-accent-600 h-full rounded-full transition-all duration-500"
                              style={{ width: `${percentage}%` }}
                            />
                          </div>
                          <div className="flex justify-between text-xs text-slate-500">
                            <span>{formatNumber(agent.fteEquivalent * 100)}% FTE</span>
                            <span>{formatCurrency(agent.projectedCostSavings)} projected savings</span>
                          </div>
                        </div>
                      );
                    })}
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm border border-blue-200 p-4 sm:p-6">
                <div className="flex items-center space-x-2 sm:space-x-3 mb-4 sm:mb-6">
                  <div className="p-2 sm:p-3 bg-blue-50 rounded-lg flex-shrink-0">
                    <TrendingUp className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-base sm:text-xl font-bold text-slate-900">Projected Cost Savings by Agent</h3>
                    <p className="text-xs sm:text-sm text-slate-500">Estimated financial impact</p>
                  </div>
                </div>

                <div className="space-y-4">
                  {projectedAgents
                    .sort((a, b) => b.projectedCostSavings - a.projectedCostSavings)
                    .map(agent => {
                      const percentage = (agent.projectedCostSavings / maxProjectedSavings) * 100;
                      return (
                        <div key={agent.id} className="space-y-2">
                          <div className="flex justify-between items-center">
                            <div className="flex items-center space-x-2">
                              <span className="font-medium text-slate-900">{agent.name}</span>
                              {agent.category && (
                                <span className="text-xs px-2 py-1 bg-accent-100 text-accent-700 rounded-full">
                                  {agent.category}
                                </span>
                              )}
                            </div>
                            <span className="font-semibold text-accent-700">
                              {formatCurrency(agent.projectedCostSavings)}
                            </span>
                          </div>
                          <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden">
                            <div
                              className="bg-gradient-to-r from-accent-500 to-accent-600 h-full rounded-full transition-all duration-500"
                              style={{ width: `${percentage}%` }}
                            />
                          </div>
                          <div className="flex justify-between text-xs text-slate-500">
                            <span>{formatHours(agent.projectedTimeSaved)} hours annually</span>
                            <span>{formatNumber(agent.fteEquivalent * 100)}% FTE impact</span>
                          </div>
                        </div>
                      );
                    })}
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm border border-blue-200 p-4 sm:p-6">
                <h3 className="text-base sm:text-xl font-bold text-slate-900 mb-4">Agent Projection Rankings</h3>
                <div className="overflow-x-auto -mx-4 sm:mx-0">
                  <table className="w-full min-w-[640px]">
                    <thead>
                      <tr className="border-b border-slate-200">
                        <th className="text-left py-3 px-4 text-xs sm:text-sm font-semibold text-slate-700">Rank</th>
                        <th className="text-left py-3 px-4 text-xs sm:text-sm font-semibold text-slate-700">Agent</th>
                        <th className="text-right py-3 px-4 text-xs sm:text-sm font-semibold text-slate-700">Time Saved</th>
                        <th className="text-right py-3 px-4 text-xs sm:text-sm font-semibold text-slate-700">Cost Savings</th>
                        <th className="text-right py-3 px-4 text-xs sm:text-sm font-semibold text-slate-700">FTE Impact</th>
                        <th className="text-right py-3 px-4 text-xs sm:text-sm font-semibold text-slate-700">ROI Score</th>
                      </tr>
                    </thead>
                    <tbody>
                      {projectedAgents
                        .sort((a, b) => b.projectedCostSavings - a.projectedCostSavings)
                        .map((agent, index) => {
                          const roiScore = (agent.projectedCostSavings / 1000).toFixed(1);
                          return (
                            <tr key={agent.id} className="border-b border-slate-100 hover:bg-blue-50 transition-colors">
                              <td className="py-3 px-4">
                                <div className="flex items-center space-x-2">
                                  <span className={`w-8 h-8 flex items-center justify-center text-sm font-bold rounded-full ${
                                    index === 0 ? 'bg-amber-100 text-amber-700' :
                                    index === 1 ? 'bg-slate-200 text-slate-700' :
                                    index === 2 ? 'bg-orange-100 text-orange-700' :
                                    'bg-slate-100 text-slate-600'
                                  }`}>
                                    {index + 1}
                                  </span>
                                </div>
                              </td>
                              <td className="py-3 px-4">
                                <span className="font-medium text-slate-900">{agent.name}</span>
                              </td>
                              <td className="text-right py-3 px-4 text-accent-700 font-medium">
                                {formatHours(agent.projectedTimeSaved)}h
                              </td>
                              <td className="text-right py-3 px-4 text-accent-700 font-semibold">
                                {formatCurrency(agent.projectedCostSavings)}
                              </td>
                              <td className="text-right py-3 px-4 text-slate-900">
                                {formatNumber(agent.fteEquivalent * 100)}%
                              </td>
                              <td className="text-right py-3 px-4">
                                <div className="flex items-center justify-end space-x-1">
                                  <ArrowUpRight className="w-4 h-4 text-emerald-600" />
                                  <span className="font-bold text-success-700">{roiScore}</span>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}

          {(viewMode === 'actual' || (viewMode === 'combined' && hasActualData)) && (
            <>
              <div className="bg-white rounded-xl shadow-sm border border-emerald-200 p-4 sm:p-6">
                <div className="flex items-center space-x-2 sm:space-x-3 mb-4 sm:mb-6">
                  <div className="p-2 sm:p-3 bg-emerald-50 rounded-lg flex-shrink-0">
                    <CheckCircle2 className="w-5 h-5 sm:w-6 sm:h-6 text-emerald-600" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-base sm:text-xl font-bold text-slate-900">Run Rate Time Saved by Agent</h3>
                    <p className="text-xs sm:text-sm text-slate-500">Measured from completed studies</p>
                  </div>
                </div>

                <div className="space-y-4">
                  {actualSummaries
                    .sort((a, b) => b.total_time_saved_hours - a.total_time_saved_hours)
                    .map(summary => {
                      const percentage = (summary.total_time_saved_hours / maxActualTime) * 100;
                      return (
                        <div key={summary.agents.id} className="space-y-2">
                          <div className="flex justify-between items-center">
                            <div className="flex items-center space-x-2">
                              <span className="font-medium text-slate-900">{summary.agents.name}</span>
                              {summary.agents.category && (
                                <span className="text-xs px-2 py-1 bg-success-100 text-success-700 rounded-full">
                                  {summary.agents.category}
                                </span>
                              )}
                            </div>
                            <span className="font-semibold text-success-700">
                              {formatHours(summary.total_time_saved_hours)} hours
                            </span>
                          </div>
                          <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden">
                            <div
                              className="bg-gradient-to-r from-success-500 to-success-600 h-full rounded-full transition-all duration-500"
                              style={{ width: `${percentage}%` }}
                            />
                          </div>
                          <div className="flex justify-between text-xs text-slate-500">
                            <span>{summary.total_studies} studies</span>
                            <span>{formatHours(summary.avg_time_saved_per_study)}h avg per study</span>
                          </div>
                        </div>
                      );
                    })}
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm border border-emerald-200 p-4 sm:p-6">
                <div className="flex items-center space-x-2 sm:space-x-3 mb-4 sm:mb-6">
                  <div className="p-2 sm:p-3 bg-emerald-50 rounded-lg flex-shrink-0">
                    <BarChart3 className="w-5 h-5 sm:w-6 sm:h-6 text-emerald-600" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-base sm:text-xl font-bold text-slate-900">Run Rate Cost Savings by Agent</h3>
                    <p className="text-xs sm:text-sm text-slate-500">Measured financial impact</p>
                  </div>
                </div>

                <div className="space-y-4">
                  {actualSummaries
                    .sort((a, b) => b.total_potential_savings - a.total_potential_savings)
                    .map(summary => {
                      const percentage = (summary.total_potential_savings / maxActualSavings) * 100;
                      return (
                        <div key={summary.agents.id} className="space-y-2">
                          <div className="flex justify-between items-center">
                            <div className="flex items-center space-x-2">
                              <span className="font-medium text-slate-900">{summary.agents.name}</span>
                              {summary.agents.category && (
                                <span className="text-xs px-2 py-1 bg-success-100 text-success-700 rounded-full">
                                  {summary.agents.category}
                                </span>
                              )}
                            </div>
                            <span className="font-semibold text-success-700">
                              {formatCurrency(summary.total_potential_savings)}
                            </span>
                          </div>
                          <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden">
                            <div
                              className="bg-gradient-to-r from-success-500 to-success-600 h-full rounded-full transition-all duration-500"
                              style={{ width: `${percentage}%` }}
                            />
                          </div>
                          <div className="flex justify-between text-xs text-slate-500">
                            <span>{summary.total_studies} studies</span>
                            <span>
                              {formatCurrency(
                                summary.total_studies > 0
                                  ? summary.total_potential_savings / summary.total_studies
                                  : 0
                              )} avg per study
                            </span>
                          </div>
                        </div>
                      );
                    })}
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm border border-emerald-200 p-4 sm:p-6">
                <h3 className="text-base sm:text-xl font-bold text-slate-900 mb-4">Agent Run Rate Performance</h3>
                <div className="overflow-x-auto -mx-4 sm:mx-0">
                  <table className="w-full min-w-[640px]">
                    <thead>
                      <tr className="border-b border-slate-200">
                        <th className="text-left py-3 px-4 text-xs sm:text-sm font-semibold text-slate-700">Agent</th>
                        <th className="text-right py-3 px-4 text-xs sm:text-sm font-semibold text-slate-700">Studies</th>
                        <th className="text-right py-3 px-4 text-xs sm:text-sm font-semibold text-slate-700">Time Saved</th>
                        <th className="text-right py-3 px-4 text-xs sm:text-sm font-semibold text-slate-700">Cost Savings</th>
                        <th className="text-right py-3 px-4 text-xs sm:text-sm font-semibold text-slate-700">Avg/Study</th>
                        <th className="text-right py-3 px-4 text-xs sm:text-sm font-semibold text-slate-700">Efficiency</th>
                      </tr>
                    </thead>
                    <tbody>
                      {actualSummaries
                        .sort((a, b) => b.total_potential_savings - a.total_potential_savings)
                        .map((summary, index) => {
                          const avgSavingsPerStudy =
                            summary.total_studies > 0
                              ? summary.total_potential_savings / summary.total_studies
                              : 0;
                          const efficiency = summary.avg_time_saved_per_study;

                          return (
                            <tr key={summary.agents.id} className="border-b border-slate-100 hover:bg-emerald-50 transition-colors">
                              <td className="py-3 px-4">
                                <div className="flex items-center space-x-2">
                                  <span className="w-6 h-6 flex items-center justify-center bg-slate-100 text-slate-600 text-xs font-semibold rounded-full">
                                    {index + 1}
                                  </span>
                                  <span className="font-medium text-slate-900">{summary.agents.name}</span>
                                </div>
                              </td>
                              <td className="text-right py-3 px-4 text-slate-900">
                                {formatNumber(summary.total_studies)}
                              </td>
                              <td className="text-right py-3 px-4 text-success-700 font-medium">
                                {formatHours(summary.total_time_saved_hours)}h
                              </td>
                              <td className="text-right py-3 px-4 text-success-700 font-semibold">
                                {formatCurrency(summary.total_potential_savings)}
                              </td>
                              <td className="text-right py-3 px-4 text-slate-900">
                                {formatCurrency(avgSavingsPerStudy)}
                              </td>
                              <td className="text-right py-3 px-4 text-slate-900">
                                {formatHours(efficiency)}h
                              </td>
                            </tr>
                          );
                        })}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
        </>
      )}

      <QuoteFooter />
    </div>
  );
}
