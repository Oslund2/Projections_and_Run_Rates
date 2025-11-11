import { X } from 'lucide-react';
import { formatCurrency, formatHours, formatNumber } from '../utils/calculations';

interface Agent {
  id: string;
  name: string;
  category: string | null;
  projectedTimeSaved: number;
  projectedCostSavings: number;
  fteEquivalent: number;
  adoption_rate_percent?: number;
}

interface Study {
  id: string;
  task_description: string;
  agent_name: string;
  net_time_saved_hours: number;
  potential_savings: number;
  study_date: string;
}

interface DrillDownModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  type: 'runrate-agents' | 'runrate-time' | 'runrate-cost' | 'runrate-fte' | 'actual-agents' | 'actual-time' | 'actual-cost' | 'actual-studies';
  data: Agent[] | Study[];
}

export function DrillDownModal({ isOpen, onClose, title, type, data }: DrillDownModalProps) {
  if (!isOpen) return null;

  const isProjectedAgentView = type === 'runrate-agents' || type === 'runrate-time' || type === 'runrate-cost' || type === 'runrate-fte';
  const isActualStudyView = type === 'actual-agents' || type === 'actual-time' || type === 'actual-cost' || type === 'actual-studies';

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="fixed inset-0 bg-slate-900 bg-opacity-50 transition-opacity" onClick={onClose}></div>

        <div className="relative bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[80vh] overflow-hidden">
          <div className="flex items-center justify-between p-6 border-b border-slate-200">
            <h2 className="text-2xl font-bold text-slate-900">{title}</h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-slate-500" />
            </button>
          </div>

          <div className="p-6 overflow-y-auto max-h-[calc(80vh-88px)]">
            {isProjectedAgentView && (
              <div className="space-y-4">
                <p className="text-sm text-slate-600 mb-4">
                  Showing all agents with projection variables entered. These are annual estimates based on agent-level data.
                </p>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                  <p className="text-sm text-slate-700">
                    <span className="font-semibold">Adoption Rate Explained:</span> Percentage of target users currently active with the agent, calculated as (Current Active Users ÷ Target User Base) × 100.
                  </p>
                  <p className="text-xs text-slate-600 mt-2">
                    <span className="font-medium">Example:</span> 75 active users ÷ 100 target users = 75% adoption rate
                  </p>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-slate-50">
                      <tr>
                        <th className="text-left px-4 py-3 text-sm font-semibold text-slate-700">Agent Name</th>
                        <th className="text-left px-4 py-3 text-sm font-semibold text-slate-700">Category</th>
                        <th className="text-right px-4 py-3 text-sm font-semibold text-slate-700">Time Saved (hrs)</th>
                        <th className="text-right px-4 py-3 text-sm font-semibold text-slate-700">Cost Savings</th>
                        <th className="text-right px-4 py-3 text-sm font-semibold text-slate-700">Adoption Rate</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {(data as Agent[]).map((agent) => (
                        <tr key={agent.id} className="hover:bg-slate-50 transition-colors">
                          <td className="px-4 py-3 text-sm font-medium text-slate-900">{agent.name}</td>
                          <td className="px-4 py-3 text-sm text-slate-600">
                            {agent.category ? (
                              <span className="px-2 py-1 bg-blue-50 text-blue-700 text-xs font-medium rounded">
                                {agent.category}
                              </span>
                            ) : (
                              <span className="text-slate-400">-</span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-sm text-right font-semibold text-slate-900">
                            {formatHours(agent.projectedTimeSaved)}
                          </td>
                          <td className="px-4 py-3 text-sm text-right font-semibold text-emerald-600">
                            {formatCurrency(agent.projectedCostSavings)}
                          </td>
                          <td className="px-4 py-3 text-sm text-right font-semibold text-slate-900">
                            {formatNumber(agent.adoption_rate_percent || 0)}%
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot className="bg-slate-100 border-t-2 border-slate-300">
                      <tr>
                        <td colSpan={2} className="px-4 py-3 text-sm font-bold text-slate-900">Total</td>
                        <td className="px-4 py-3 text-sm text-right font-bold text-slate-900">
                          {formatHours((data as Agent[]).reduce((sum, a) => sum + a.projectedTimeSaved, 0))}
                        </td>
                        <td className="px-4 py-3 text-sm text-right font-bold text-emerald-600">
                          {formatCurrency((data as Agent[]).reduce((sum, a) => sum + a.projectedCostSavings, 0))}
                        </td>
                        <td className="px-4 py-3 text-sm text-right font-bold text-slate-900">
                          {formatNumber((data as Agent[]).reduce((sum, a) => sum + (a.adoption_rate_percent || 0), 0) / (data as Agent[]).length)}%
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
            )}

            {isActualStudyView && (
              <div className="space-y-4">
                <p className="text-sm text-slate-600 mb-4">
                  Showing all completed time & motion studies with run rate measured results.
                </p>

                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-slate-50">
                      <tr>
                        <th className="text-left px-4 py-3 text-sm font-semibold text-slate-700">Agent</th>
                        <th className="text-left px-4 py-3 text-sm font-semibold text-slate-700">Task</th>
                        <th className="text-left px-4 py-3 text-sm font-semibold text-slate-700">Date</th>
                        <th className="text-right px-4 py-3 text-sm font-semibold text-slate-700">Time Saved (hrs)</th>
                        <th className="text-right px-4 py-3 text-sm font-semibold text-slate-700">Cost Savings</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {(data as Study[]).map((study) => (
                        <tr key={study.id} className="hover:bg-slate-50 transition-colors">
                          <td className="px-4 py-3 text-sm font-medium text-slate-900">{study.agent_name}</td>
                          <td className="px-4 py-3 text-sm text-slate-600">{study.task_description}</td>
                          <td className="px-4 py-3 text-sm text-slate-600">
                            {new Date(study.study_date).toLocaleDateString()}
                          </td>
                          <td className="px-4 py-3 text-sm text-right font-semibold text-slate-900">
                            {formatHours(study.net_time_saved_hours)}
                          </td>
                          <td className="px-4 py-3 text-sm text-right font-semibold text-emerald-600">
                            {formatCurrency(study.potential_savings)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot className="bg-slate-100 border-t-2 border-slate-300">
                      <tr>
                        <td colSpan={3} className="px-4 py-3 text-sm font-bold text-slate-900">
                          Total ({(data as Study[]).length} studies)
                        </td>
                        <td className="px-4 py-3 text-sm text-right font-bold text-slate-900">
                          {formatHours((data as Study[]).reduce((sum, s) => sum + s.net_time_saved_hours, 0))}
                        </td>
                        <td className="px-4 py-3 text-sm text-right font-bold text-emerald-600">
                          {formatCurrency((data as Study[]).reduce((sum, s) => sum + s.potential_savings, 0))}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
            )}

            {data.length === 0 && (
              <div className="text-center py-12">
                <p className="text-slate-500">No data available</p>
              </div>
            )}
          </div>

          <div className="flex items-center justify-end p-6 border-t border-slate-200 bg-slate-50">
            <button
              onClick={onClose}
              className="px-6 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors font-medium"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
