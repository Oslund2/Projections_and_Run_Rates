import { useEffect, useState } from 'react';
import { ArrowLeft, Clock, DollarSign, FileText, Calendar, Users, TrendingUp, Edit2, History } from 'lucide-react';
import { agentService } from '../services/agentService';
import { studyService, type StudyWithAgent } from '../services/studyService';
import { summaryService } from '../services/summaryService';
import { adoptionHistoryService } from '../services/adoptionHistoryService';
import { formatCurrency, formatHours, formatNumber, calculateAgentProjections, calculateAdoptionAdjustedProjections, calculateAdoptionRate } from '../utils/calculations';
import type { Database } from '../lib/database.types';
import DivisionSelector from './DivisionSelector';
import { AdoptionSlider } from './AdoptionSlider';

type Agent = Database['public']['Tables']['agents']['Row'];
type AgentSummary = Database['public']['Tables']['agent_summaries']['Row'];

interface AgentDetailProps {
  agentId: string;
  onBack: () => void;
}

export function AgentDetail({ agentId, onBack }: AgentDetailProps) {
  const [agent, setAgent] = useState<Agent | null>(null);
  const [summary, setSummary] = useState<AgentSummary | null>(null);
  const [studies, setStudies] = useState<StudyWithAgent[]>([]);
  const [loading, setLoading] = useState(true);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showEditStudyModal, setShowEditStudyModal] = useState(false);
  const [editingStudy, setEditingStudy] = useState<StudyWithAgent | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    category: '',
    description: '',
    division_id: '',
    status: 'active' as 'active' | 'inactive',
    avg_time_without_agent_minutes: '',
    avg_time_with_agent_minutes: '',
    avg_usage_count: '',
    avg_hourly_wage: '',
    default_usage_discount_percent: '',
    target_user_base: '',
    current_active_users: '',
    adoption_methodology: ''
  });
  const [adoptionHistory, setAdoptionHistory] = useState<any[]>([]);
  const [previewAdoptionRate, setPreviewAdoptionRate] = useState(100);
  const [studyFormData, setStudyFormData] = useState({
    task_description: '',
    time_without_ai_minutes: '',
    time_with_ai_minutes: '',
    usage_count: '',
    usage_discount_percent: '',
    cost_per_hour: '',
    study_date: '',
    notes: ''
  });

  useEffect(() => {
    loadData();
  }, [agentId]);

  const loadData = async () => {
    try {
      const [agentData, summaryData, studiesData, historyData] = await Promise.all([
        agentService.getById(agentId),
        summaryService.getByAgentId(agentId),
        studyService.getByAgentId(agentId),
        adoptionHistoryService.getByAgentId(agentId)
      ]);
      setAgent(agentData);
      setSummary(summaryData);
      setStudies(studiesData);
      setAdoptionHistory(historyData);

      if (agentData) {
        setFormData({
          name: agentData.name,
          category: agentData.category || '',
          description: agentData.description || '',
          division_id: agentData.division_id || '',
          status: agentData.status,
          avg_time_without_agent_minutes: agentData.avg_time_without_agent_minutes?.toString() || '0',
          avg_time_with_agent_minutes: agentData.avg_time_with_agent_minutes?.toString() || '0',
          avg_usage_count: agentData.avg_usage_count?.toString() || '0',
          avg_hourly_wage: agentData.avg_hourly_wage?.toString() || '20',
          default_usage_discount_percent: agentData.default_usage_discount_percent?.toString() || '50',
          target_user_base: agentData.target_user_base?.toString() || '0',
          current_active_users: agentData.current_active_users?.toString() || '0',
          adoption_methodology: agentData.adoption_methodology || ''
        });
        setPreviewAdoptionRate(agentData.adoption_rate_percent || 0);
      }
    } catch (error) {
      console.error('Error loading agent details:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!agent) return;

    try {
      const updateData = {
        name: formData.name,
        category: formData.category || null,
        description: formData.description || null,
        division_id: formData.division_id || null,
        status: formData.status,
        avg_time_without_agent_minutes: parseFloat(formData.avg_time_without_agent_minutes),
        avg_time_with_agent_minutes: parseFloat(formData.avg_time_with_agent_minutes),
        avg_usage_count: parseInt(formData.avg_usage_count),
        avg_hourly_wage: parseFloat(formData.avg_hourly_wage),
        default_usage_discount_percent: parseFloat(formData.default_usage_discount_percent),
        target_user_base: parseInt(formData.target_user_base) || 0,
        current_active_users: parseInt(formData.current_active_users) || 0,
        adoption_methodology: formData.adoption_methodology || null,
        adoption_last_updated: new Date().toISOString()
      };

      console.log('Updating agent with data:', updateData);
      const result = await agentService.update(agent.id, updateData);
      console.log('Update successful:', result);

      setShowEditModal(false);
      await loadData();
    } catch (error) {
      console.error('Error updating agent:', error);
      alert('Failed to update agent. Please check the console for details.');
    }
  };

  const handleEditStudy = (study: StudyWithAgent) => {
    setEditingStudy(study);
    setStudyFormData({
      task_description: study.task_description,
      time_without_ai_minutes: study.time_without_ai_minutes.toString(),
      time_with_ai_minutes: study.time_with_ai_minutes.toString(),
      usage_count: study.usage_count.toString(),
      usage_discount_percent: study.usage_discount_percent?.toString() || '50',
      cost_per_hour: study.cost_per_hour.toString(),
      study_date: study.study_date || new Date().toISOString().split('T')[0],
      notes: study.notes || ''
    });
    setShowEditStudyModal(true);
  };

  const handleUpdateStudy = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingStudy) return;

    try {
      await studyService.update(editingStudy.id, {
        task_description: studyFormData.task_description,
        time_without_ai_minutes: parseFloat(studyFormData.time_without_ai_minutes),
        time_with_ai_minutes: parseFloat(studyFormData.time_with_ai_minutes),
        usage_count: parseInt(studyFormData.usage_count),
        usage_discount_percent: parseFloat(studyFormData.usage_discount_percent),
        cost_per_hour: parseFloat(studyFormData.cost_per_hour),
        study_date: studyFormData.study_date,
        notes: studyFormData.notes || null
      });
      setShowEditStudyModal(false);
      setEditingStudy(null);
      loadData();
    } catch (error) {
      console.error('Error updating study:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
      </div>
    );
  }

  if (!agent) {
    return (
      <div className="text-center py-12">
        <p className="text-slate-500 mb-4">Agent not found</p>
        <button
          onClick={onBack}
          className="text-emerald-600 hover:text-emerald-700 font-medium"
        >
          Back to Agents
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <button
        onClick={onBack}
        className="flex items-center space-x-2 text-slate-600 hover:text-slate-900 font-medium"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Agents</span>
      </button>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <div className="flex items-start justify-between mb-6">
          <div>
            <div className="flex items-center space-x-3 mb-2">
              <h2 className="text-3xl font-bold text-slate-900">{agent.name}</h2>
              {agent.category && (
                <span className="px-3 py-1 bg-blue-50 text-blue-700 text-sm font-medium rounded-full">
                  {agent.category}
                </span>
              )}
              <span className={`px-3 py-1 text-sm font-medium rounded-full ${
                agent.status === 'active'
                  ? 'bg-emerald-50 text-emerald-700'
                  : 'bg-slate-100 text-slate-600'
              }`}>
                {agent.status}
              </span>
            </div>
            {agent.description && (
              <p className="text-slate-600">{agent.description}</p>
            )}
          </div>
          <button
            onClick={() => setShowEditModal(true)}
            className="flex items-center space-x-2 px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors"
          >
            <Edit2 className="w-4 h-4" />
            <span>Edit</span>
          </button>
        </div>

        <div className="mt-6 pt-6 border-t border-slate-200">
          <h4 className="text-sm font-semibold text-slate-700 mb-3">Agent Variables</h4>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div>
              <p className="text-xs text-slate-500 mb-1">Avg. Time Without Agent</p>
              <p className="font-semibold text-slate-900">{agent.avg_time_without_agent_minutes.toFixed(1)} min</p>
            </div>
            <div>
              <p className="text-xs text-slate-500 mb-1">Avg. Time With Agent</p>
              <p className="font-semibold text-slate-900">{agent.avg_time_with_agent_minutes.toFixed(1)} min</p>
            </div>
            <div>
              <p className="text-xs text-slate-500 mb-1">Usage Count (Annual)</p>
              <p className="font-semibold text-slate-900">{formatNumber(agent.avg_usage_count)}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500 mb-1">Avg. Hourly Wage</p>
              <p className="font-semibold text-slate-900">${agent.avg_hourly_wage.toFixed(2)}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500 mb-1">Usage Discount</p>
              <p className="font-semibold text-slate-900">{agent.default_usage_discount_percent}%</p>
            </div>
          </div>
        </div>

        {agent.target_user_base > 0 && (
          <div className="mt-6 pt-6 border-t border-slate-200">
            <h4 className="text-sm font-semibold text-slate-700 mb-3 flex items-center space-x-2">
              <Users className="w-4 h-4" />
              <span>Adoption Metrics</span>
            </h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
              <div>
                <p className="text-xs text-slate-500 mb-1">Target Users</p>
                <p className="font-semibold text-slate-900">{formatNumber(agent.target_user_base || 0)}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500 mb-1">Current Users</p>
                <p className="font-semibold text-slate-900">{formatNumber(agent.current_active_users || 0)}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500 mb-1">Adoption Rate</p>
                <p className={`text-2xl font-bold ${
                  (agent.adoption_rate_percent || 0) < 33 ? 'text-red-600' :
                  (agent.adoption_rate_percent || 0) < 67 ? 'text-amber-600' : 'text-emerald-600'
                }`}>
                  {(agent.adoption_rate_percent || 0).toFixed(1)}%
                </p>
              </div>
              <div>
                <p className="text-xs text-slate-500 mb-1">Last Updated</p>
                <p className="font-semibold text-slate-900">
                  {agent.adoption_last_updated
                    ? new Date(agent.adoption_last_updated).toLocaleDateString()
                    : 'Never'}
                </p>
              </div>
            </div>
            <div className="relative pt-2">
              <div className="flex mb-2 items-center justify-between">
                <div>
                  <span className="text-xs font-semibold inline-block text-slate-600">
                    Adoption Progress
                  </span>
                </div>
                <div>
                  <span className="text-xs font-semibold inline-block text-slate-600">
                    {agent.current_active_users} / {agent.target_user_base} users
                  </span>
                </div>
              </div>
              <div className="overflow-hidden h-3 text-xs flex rounded-full bg-slate-200">
                <div
                  style={{ width: `${Math.min(100, agent.adoption_rate_percent || 0)}%` }}
                  className={`shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center transition-all duration-500 ${
                    (agent.adoption_rate_percent || 0) < 33 ? 'bg-red-500' :
                    (agent.adoption_rate_percent || 0) < 67 ? 'bg-amber-500' : 'bg-emerald-500'
                  }`}
                ></div>
              </div>
            </div>
            {agent.adoption_methodology && (
              <div className="mt-3 text-sm text-slate-600">
                <span className="font-medium">Methodology:</span> {agent.adoption_methodology}
              </div>
            )}
          </div>
        )}

        {agent.avg_time_without_agent_minutes > 0 && agent.avg_usage_count > 0 && (
          <div className="mt-6 pt-6 border-t border-slate-200">
            <h4 className="text-sm font-semibold text-slate-700 mb-3 flex items-center space-x-2">
              <TrendingUp className="w-4 h-4" />
              <span>Impact Analysis {agent.target_user_base > 0 ? '(Adoption-Adjusted)' : ''}</span>
            </h4>
            {(() => {
              if (agent.target_user_base > 0 && agent.adoption_rate_percent > 0) {
                const adoptionResults = calculateAdoptionAdjustedProjections({
                  avgTimeWithoutAgentMinutes: agent.avg_time_without_agent_minutes,
                  avgTimeWithAgentMinutes: agent.avg_time_with_agent_minutes,
                  avgUsageCount: agent.avg_usage_count,
                  usageDiscountPercent: agent.default_usage_discount_percent,
                  avgHourlyWage: agent.avg_hourly_wage,
                  adoptionRatePercent: agent.adoption_rate_percent,
                  targetUserBase: agent.target_user_base,
                  currentActiveUsers: agent.current_active_users
                });

                return (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="bg-blue-50 rounded-lg p-3">
                        <p className="text-xs text-slate-600 mb-1">Current Annual Time Saved</p>
                        <p className="text-lg font-bold text-blue-700">{formatHours(adoptionResults.currentImpact.annualTimeSavedHours)}h</p>
                      </div>
                      <div className="bg-emerald-50 rounded-lg p-3">
                        <p className="text-xs text-slate-600 mb-1">Current Annual Cost Savings</p>
                        <p className="text-lg font-bold text-emerald-700">{formatCurrency(adoptionResults.currentImpact.annualCostSavings)}</p>
                      </div>
                      <div className="bg-violet-50 rounded-lg p-3">
                        <p className="text-xs text-slate-600 mb-1">Potential at 100% Adoption</p>
                        <p className="text-lg font-bold text-violet-700">{formatCurrency(adoptionResults.potentialImpact.annualCostSavings)}</p>
                        <p className="text-xs text-violet-600">+{formatCurrency(adoptionResults.opportunityGap.costSavings)} opportunity</p>
                      </div>
                      <div className="bg-amber-50 rounded-lg p-3">
                        <div className="flex items-center space-x-1 mb-1">
                          <Users className="w-3 h-3 text-slate-600" />
                          <p className="text-xs text-slate-600">Current FTE</p>
                        </div>
                        <p className="text-lg font-bold text-amber-700">{adoptionResults.currentImpact.fteEquivalent.toFixed(2)}</p>
                        <p className="text-xs text-amber-600">+{adoptionResults.opportunityGap.fteEquivalent.toFixed(2)} potential</p>
                      </div>
                    </div>
                  </div>
                );
              } else {
                const projections = calculateAgentProjections({
                  avgTimeWithoutAgentMinutes: agent.avg_time_without_agent_minutes,
                  avgTimeWithAgentMinutes: agent.avg_time_with_agent_minutes,
                  avgUsageCount: agent.avg_usage_count,
                  usageDiscountPercent: agent.default_usage_discount_percent,
                  avgHourlyWage: agent.avg_hourly_wage
                });

                return (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-blue-50 rounded-lg p-3">
                      <p className="text-xs text-slate-600 mb-1">Time Saved Per Use</p>
                      <p className="text-lg font-bold text-blue-700">{projections.timeSavedPerUseMinutes.toFixed(1)} min</p>
                    </div>
                    <div className="bg-emerald-50 rounded-lg p-3">
                      <p className="text-xs text-slate-600 mb-1">Annual Time Saved</p>
                      <p className="text-lg font-bold text-emerald-700">{formatHours(projections.annualTimeSavedHours)}h</p>
                    </div>
                    <div className="bg-violet-50 rounded-lg p-3">
                      <p className="text-xs text-slate-600 mb-1">Annual Cost Savings</p>
                      <p className="text-lg font-bold text-violet-700">{formatCurrency(projections.annualCostSavings)}</p>
                    </div>
                    <div className="bg-amber-50 rounded-lg p-3">
                      <div className="flex items-center space-x-1 mb-1">
                        <Users className="w-3 h-3 text-slate-600" />
                        <p className="text-xs text-slate-600">FTE Equivalent</p>
                      </div>
                      <p className="text-lg font-bold text-amber-700">{projections.fteEquivalent.toFixed(2)} FTE</p>
                    </div>
                  </div>
                );
              }
            })()}
          </div>
        )}

        {summary ? (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-emerald-50 rounded-lg p-4">
              <div className="flex items-center space-x-2 mb-2">
                <FileText className="w-5 h-5 text-emerald-600" />
                <p className="text-sm font-medium text-slate-600">Total Studies</p>
              </div>
              <p className="text-2xl font-bold text-slate-900">{formatNumber(summary.total_studies)}</p>
            </div>
            <div className="bg-blue-50 rounded-lg p-4">
              <div className="flex items-center space-x-2 mb-2">
                <Clock className="w-5 h-5 text-blue-600" />
                <p className="text-sm font-medium text-slate-600">Time Saved</p>
              </div>
              <p className="text-2xl font-bold text-slate-900">{formatHours(summary.total_time_saved_hours)}h</p>
            </div>
            <div className="bg-violet-50 rounded-lg p-4">
              <div className="flex items-center space-x-2 mb-2">
                <DollarSign className="w-5 h-5 text-violet-600" />
                <p className="text-sm font-medium text-slate-600">Cost Savings</p>
              </div>
              <p className="text-2xl font-bold text-slate-900">{formatCurrency(summary.total_potential_savings)}</p>
            </div>
            <div className="bg-amber-50 rounded-lg p-4">
              <div className="flex items-center space-x-2 mb-2">
                <Clock className="w-5 h-5 text-amber-600" />
                <p className="text-sm font-medium text-slate-600">Avg Per Study</p>
              </div>
              <p className="text-2xl font-bold text-slate-900">{formatHours(summary.avg_time_saved_per_study)}h</p>
            </div>
          </div>
        ) : (
          <p className="text-slate-500 italic">No performance data available yet</p>
        )}
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <h3 className="text-xl font-bold text-slate-900 mb-4">Studies ({studies.length})</h3>

        {studies.length === 0 ? (
          <p className="text-slate-500 text-center py-8">No studies recorded for this agent yet</p>
        ) : (
          <div className="space-y-4">
            {studies.map(study => (
              <div
                key={study.id}
                className="border border-slate-200 rounded-lg p-4 hover:bg-slate-50 transition-colors"
              >
                <div className="flex items-start justify-between mb-3">
                  <h4 className="font-semibold text-slate-900">{study.task_description}</h4>
                  <div className="flex items-center space-x-2">
                    <div className="flex items-center space-x-1 text-sm text-slate-500">
                      <Calendar className="w-4 h-4" />
                      <span>{new Date(study.study_date).toLocaleDateString()}</span>
                    </div>
                    <button
                      onClick={() => handleEditStudy(study)}
                      className="p-2 text-slate-600 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                      title="Edit study"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {study.notes && (
                  <p className="text-sm text-slate-600 mb-3">{study.notes}</p>
                )}

                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
                  <div>
                    <p className="text-xs text-slate-500">Time Saved</p>
                    <p className="text-sm font-semibold text-slate-900">
                      {(study.time_saved_minutes || 0).toFixed(1)} min
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">Usage Count</p>
                    <p className="text-sm font-semibold text-slate-900">
                      {formatNumber(study.usage_count)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">Discount</p>
                    <p className="text-sm font-semibold text-slate-900">
                      {study.usage_discount_percent}%
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">Net Usage</p>
                    <p className="text-sm font-semibold text-slate-900">
                      {formatNumber(study.net_usage || 0)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">Net Time Saved</p>
                    <p className="text-sm font-semibold text-emerald-700">
                      {formatHours(study.net_time_saved_hours || 0)}h
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">Savings</p>
                    <p className="text-sm font-semibold text-emerald-700">
                      {formatCurrency(study.potential_savings || 0)}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {showEditModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-lg sm:rounded-xl shadow-xl max-w-2xl w-full my-4 sm:my-8 max-h-[98vh] flex flex-col">
            <div className="p-4 sm:p-6 border-b border-slate-200 flex-shrink-0">
              <h3 className="text-lg sm:text-xl font-bold text-slate-900">Edit Agent</h3>
            </div>
            <form onSubmit={handleUpdate} className="flex-1 overflow-y-auto overscroll-contain">
              <div className="p-4 sm:p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Agent Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Category
                  </label>
                  <input
                    type="text"
                    value={formData.category}
                    onChange={e => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Description
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={e => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
                    rows={3}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Division
                  </label>
                  <DivisionSelector
                    value={formData.division_id}
                    onChange={(divisionId) => setFormData({ ...formData, division_id: divisionId || '' })}
                    showAllOption={false}
                    showUnassignedOption={false}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Status *
                  </label>
                  <select
                    required
                    value={formData.status}
                    onChange={e => setFormData({ ...formData, status: e.target.value as 'active' | 'inactive' })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-200">
                <h4 className="text-sm font-semibold text-slate-900 mb-3">Agent Variables</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Avg. Time Without Agent (minutes) *
                    </label>
                    <input
                      type="number"
                      required
                      min="0"
                      step="0.01"
                      value={formData.avg_time_without_agent_minutes}
                      onChange={e => setFormData({ ...formData, avg_time_without_agent_minutes: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Avg. Time With Agent (minutes) *
                    </label>
                    <input
                      type="number"
                      required
                      min="0"
                      step="0.01"
                      value={formData.avg_time_with_agent_minutes}
                      onChange={e => setFormData({ ...formData, avg_time_with_agent_minutes: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Usage Count (annual) *
                    </label>
                    <input
                      type="number"
                      required
                      min="0"
                      step="1"
                      value={formData.avg_usage_count}
                      onChange={e => setFormData({ ...formData, avg_usage_count: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Avg. Hourly Wage ($) *
                    </label>
                    <input
                      type="number"
                      required
                      min="0"
                      step="0.01"
                      value={formData.avg_hourly_wage}
                      onChange={e => setFormData({ ...formData, avg_hourly_wage: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Usage Discount (%) *
                    </label>
                    <input
                      type="number"
                      required
                      min="0"
                      max="100"
                      step="0.01"
                      value={formData.default_usage_discount_percent}
                      onChange={e => setFormData({ ...formData, default_usage_discount_percent: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
                    />
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-200">
                <h4 className="text-sm font-semibold text-slate-900 mb-4">Adoption Tracking</h4>

                <div className="space-y-6 mb-4">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-sm font-medium text-slate-700">
                        Target User Base
                      </label>
                      <input
                        type="number"
                        min="0"
                        step="1"
                        value={formData.target_user_base}
                        onChange={e => {
                          setFormData({ ...formData, target_user_base: e.target.value });
                          const target = parseInt(e.target.value) || 0;
                          const current = parseInt(formData.current_active_users) || 0;
                          if (target > 0) {
                            setPreviewAdoptionRate(calculateAdoptionRate(current, target));
                          }
                        }}
                        className="w-24 px-3 py-1 text-center border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none font-semibold"
                      />
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="1000"
                      step="1"
                      value={formData.target_user_base || 0}
                      onChange={e => {
                        const value = e.target.value;
                        setFormData({ ...formData, target_user_base: value });
                        const target = parseInt(value) || 0;
                        const current = parseInt(formData.current_active_users) || 0;
                        if (target > 0) {
                          setPreviewAdoptionRate(calculateAdoptionRate(current, target));
                        }
                      }}
                      className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer"
                      style={{
                        background: `linear-gradient(to right, #10b981 0%, #10b981 ${(parseInt(formData.target_user_base) || 0) / 10}%, #e2e8f0 ${(parseInt(formData.target_user_base) || 0) / 10}%)`
                      }}
                    />
                    <div className="flex justify-between mt-1 text-xs text-slate-500">
                      <span>0</span>
                      <span>250</span>
                      <span>500</span>
                      <span>750</span>
                      <span>1000</span>
                    </div>
                    <p className="text-xs text-slate-500 mt-2">Total potential users for this agent</p>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-sm font-medium text-slate-700">
                        Current Active Users
                      </label>
                      <input
                        type="number"
                        min="0"
                        max={formData.target_user_base || 1000}
                        step="1"
                        value={formData.current_active_users}
                        onChange={e => {
                          const value = e.target.value;
                          setFormData({ ...formData, current_active_users: value });
                          const target = parseInt(formData.target_user_base) || 0;
                          const current = parseInt(value) || 0;
                          if (target > 0) {
                            setPreviewAdoptionRate(calculateAdoptionRate(current, target));
                          }
                        }}
                        className="w-24 px-3 py-1 text-center border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none font-semibold"
                      />
                    </div>
                    <input
                      type="range"
                      min="0"
                      max={formData.target_user_base || 1000}
                      step="1"
                      value={formData.current_active_users || 0}
                      onChange={e => {
                        const value = e.target.value;
                        setFormData({ ...formData, current_active_users: value });
                        const target = parseInt(formData.target_user_base) || 0;
                        const current = parseInt(value) || 0;
                        if (target > 0) {
                          setPreviewAdoptionRate(calculateAdoptionRate(current, target));
                        }
                      }}
                      className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer"
                      style={{
                        background: `linear-gradient(to right, #3b82f6 0%, #3b82f6 ${((parseInt(formData.current_active_users) || 0) / (parseInt(formData.target_user_base) || 1000)) * 100}%, #e2e8f0 ${((parseInt(formData.current_active_users) || 0) / (parseInt(formData.target_user_base) || 1000)) * 100}%)`
                      }}
                    />
                    <div className="flex justify-between mt-1 text-xs text-slate-500">
                      <span>0</span>
                      <span>{Math.round((parseInt(formData.target_user_base) || 1000) * 0.25)}</span>
                      <span>{Math.round((parseInt(formData.target_user_base) || 1000) * 0.5)}</span>
                      <span>{Math.round((parseInt(formData.target_user_base) || 1000) * 0.75)}</span>
                      <span>{formData.target_user_base || 1000}</span>
                    </div>
                    <p className="text-xs text-slate-500 mt-2">Current number of active users</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Adoption Methodology
                    </label>
                    <input
                      type="text"
                      value={formData.adoption_methodology}
                      onChange={e => setFormData({ ...formData, adoption_methodology: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
                      placeholder="e.g., Active logins in last 30 days"
                    />
                    <p className="text-xs text-slate-500 mt-1">How adoption is measured</p>
                  </div>
                </div>

                {formData.avg_time_without_agent_minutes && formData.avg_time_with_agent_minutes && formData.avg_usage_count && formData.target_user_base && (
                  <div className="mt-4">
                    <AdoptionSlider
                      avgTimeWithoutAgentMinutes={parseFloat(formData.avg_time_without_agent_minutes) || 0}
                      avgTimeWithAgentMinutes={parseFloat(formData.avg_time_with_agent_minutes) || 0}
                      avgUsageCount={parseInt(formData.avg_usage_count) || 0}
                      usageDiscountPercent={parseFloat(formData.default_usage_discount_percent) || 50}
                      avgHourlyWage={parseFloat(formData.avg_hourly_wage) || 20}
                      currentAdoptionRate={previewAdoptionRate}
                      targetUserBase={parseInt(formData.target_user_base) || 0}
                      currentActiveUsers={parseInt(formData.current_active_users) || 0}
                      showComparison={true}
                    />
                  </div>
                )}

                {adoptionHistory.length > 0 && (
                  <div className="mt-6 pt-4 border-t border-slate-200">
                    <h4 className="text-sm font-semibold text-slate-900 mb-3 flex items-center space-x-2">
                      <History className="w-4 h-4" />
                      <span>Adoption History</span>
                    </h4>
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                      {adoptionHistory.slice(0, 5).map((history) => (
                        <div key={history.id} className="flex items-center justify-between p-2 bg-slate-50 rounded-lg text-sm">
                          <div>
                            <span className="font-medium text-slate-900">
                              {history.previous_adoption_rate?.toFixed(1)}% → {history.new_adoption_rate?.toFixed(1)}%
                            </span>
                            {history.change_notes && (
                              <p className="text-xs text-slate-600 mt-1">{history.change_notes}</p>
                            )}
                          </div>
                          <span className="text-xs text-slate-500">
                            {new Date(history.created_at).toLocaleDateString()}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              </div>
              <div className="p-4 sm:p-6 border-t border-slate-200 flex-shrink-0 bg-white">
                <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3">
                  <button
                    type="button"
                    onClick={() => setShowEditModal(false)}
                    className="flex-1 px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors text-sm sm:text-base min-h-[44px]"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors text-sm sm:text-base min-h-[44px]"
                  >
                    Save Changes
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {showEditStudyModal && editingStudy && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-lg sm:rounded-xl shadow-xl max-w-2xl w-full my-4 sm:my-8 max-h-[98vh] flex flex-col">
            <div className="p-4 sm:p-6 border-b border-slate-200 flex-shrink-0">
              <h3 className="text-lg sm:text-xl font-bold text-slate-900">Edit Study</h3>
            </div>
            <form onSubmit={handleUpdateStudy} className="flex-1 overflow-y-auto overscroll-contain">
              <div className="p-4 sm:p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Task Description *
                </label>
                <input
                  type="text"
                  required
                  value={studyFormData.task_description}
                  onChange={e => setStudyFormData({ ...studyFormData, task_description: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Time Without AI (minutes) *
                  </label>
                  <input
                    type="number"
                    required
                    min="0"
                    step="0.01"
                    value={studyFormData.time_without_ai_minutes}
                    onChange={e => setStudyFormData({ ...studyFormData, time_without_ai_minutes: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Time With AI (minutes) *
                  </label>
                  <input
                    type="number"
                    required
                    min="0"
                    step="0.01"
                    value={studyFormData.time_with_ai_minutes}
                    onChange={e => setStudyFormData({ ...studyFormData, time_with_ai_minutes: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Usage Count *
                  </label>
                  <input
                    type="number"
                    required
                    min="1"
                    step="1"
                    value={studyFormData.usage_count}
                    onChange={e => setStudyFormData({ ...studyFormData, usage_count: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Usage Discount (%) *
                  </label>
                  <input
                    type="number"
                    required
                    min="0"
                    max="100"
                    step="0.01"
                    value={studyFormData.usage_discount_percent}
                    onChange={e => setStudyFormData({ ...studyFormData, usage_discount_percent: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Cost Per Hour ($) *
                  </label>
                  <input
                    type="number"
                    required
                    min="0"
                    step="0.01"
                    value={studyFormData.cost_per_hour}
                    onChange={e => setStudyFormData({ ...studyFormData, cost_per_hour: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Study Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={studyFormData.study_date}
                    onChange={e => setStudyFormData({ ...studyFormData, study_date: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Notes
                </label>
                <textarea
                  value={studyFormData.notes}
                  onChange={e => setStudyFormData({ ...studyFormData, notes: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
                  rows={3}
                />
              </div>
              </div>
              <div className="p-4 sm:p-6 border-t border-slate-200 flex-shrink-0 bg-white">
                <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3">
                  <button
                    type="button"
                    onClick={() => {
                      setShowEditStudyModal(false);
                      setEditingStudy(null);
                    }}
                    className="flex-1 px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors text-sm sm:text-base min-h-[44px]"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors text-sm sm:text-base min-h-[44px]"
                  >
                    Save Changes
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
