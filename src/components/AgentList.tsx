import { useEffect, useState } from 'react';
import { Plus, Clock, DollarSign, FileText, Trash2, ChevronRight } from 'lucide-react';
import { agentService } from '../services/agentService';
import { divisionService } from '../services/divisionService';
import { formatCurrency, formatHours, formatNumber, calculateAdoptionRate } from '../utils/calculations';
import type { Database } from '../lib/database.types';
import DivisionSelector from './DivisionSelector';
import { AdoptionSlider } from './AdoptionSlider';

type Agent = Database['public']['Tables']['agents']['Row'];

interface AgentWithSummary extends Agent {
  agent_summaries: Array<{
    total_studies: number;
    total_time_saved_hours: number;
    total_potential_savings: number;
    avg_time_saved_per_study: number;
    last_study_date: string | null;
  }>;
}

interface AgentListProps {
  onSelectAgent: (agentId: string) => void;
}

export function AgentList({ onSelectAgent }: AgentListProps) {
  const [agents, setAgents] = useState<AgentWithSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedDivision, setSelectedDivision] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    category: '',
    description: '',
    division_id: '',
    lifecycle_status: 'production',
    avg_time_without_agent_minutes: '',
    avg_time_with_agent_minutes: '',
    avg_usage_count: '',
    avg_hourly_wage: '20',
    default_usage_discount_percent: '50',
    target_user_base: '',
    current_active_users: '',
    adoption_methodology: ''
  });
  const [previewAdoptionRate, setPreviewAdoptionRate] = useState(100);

  useEffect(() => {
    loadAgents();
  }, []);

  const loadAgents = async () => {
    try {
      const data = await agentService.getWithSummaries();
      setAgents(data as AgentWithSummary[]);
    } catch (error) {
      console.error('Error loading agents:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await agentService.create({
        name: formData.name,
        category: formData.category || null,
        description: formData.description || null,
        division_id: formData.division_id || null,
        lifecycle_status: formData.lifecycle_status,
        avg_time_without_agent_minutes: parseFloat(formData.avg_time_without_agent_minutes) || 0,
        avg_time_with_agent_minutes: parseFloat(formData.avg_time_with_agent_minutes) || 0,
        avg_usage_count: parseInt(formData.avg_usage_count) || 0,
        avg_hourly_wage: parseFloat(formData.avg_hourly_wage) || 20,
        default_usage_discount_percent: parseFloat(formData.default_usage_discount_percent),
        target_user_base: parseInt(formData.target_user_base) || 0,
        current_active_users: parseInt(formData.current_active_users) || 0,
        adoption_methodology: formData.adoption_methodology || null
      });
      setShowAddModal(false);
      setFormData({
        name: '',
        category: '',
        description: '',
        division_id: '',
        lifecycle_status: 'production',
        avg_time_without_agent_minutes: '',
        avg_time_with_agent_minutes: '',
        avg_usage_count: '',
        avg_hourly_wage: '20',
        default_usage_discount_percent: '50',
        target_user_base: '',
        current_active_users: '',
        adoption_methodology: ''
      });
      setPreviewAdoptionRate(100);
      loadAgents();
    } catch (error) {
      console.error('Error creating agent:', error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this agent? This will also delete all associated studies.')) {
      return;
    }

    try {
      await agentService.delete(id);
      loadAgents();
    } catch (error) {
      console.error('Error deleting agent:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold text-slate-900">AI Agents</h2>
          <p className="text-slate-600 mt-2">Manage and track AI agent performance</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="btn-primary"
        >
          <Plus className="w-4 h-4" />
          <span>Add Agent</span>
        </button>
      </div>

      {agents.length === 0 ? (
        <div className="card-elevated p-12 text-center">
          <p className="text-slate-500 mb-4">No agents found. Create your first agent to get started.</p>
          <button
            onClick={() => setShowAddModal(true)}
            className="btn-primary"
          >
            <Plus className="w-4 h-4" />
            <span>Add Your First Agent</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {agents.map(agent => {
            const summary = agent.agent_summaries?.[0];
            return (
              <div
                key={agent.id}
                className="card-elevated p-6 animate-in"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h3 className="text-xl font-bold text-slate-900">{agent.name}</h3>
                      {agent.category && (
                        <span className="badge bg-accent-100 text-accent-700">
                          {agent.category}
                        </span>
                      )}
                      <span className={`badge ${
                        agent.status === 'active'
                          ? 'bg-success-100 text-success-700'
                          : 'bg-slate-100 text-slate-600'
                      }`}>
                        {agent.status}
                      </span>
                    </div>
                    {agent.description && (
                      <p className="text-slate-600 mb-4">{agent.description}</p>
                    )}

                    {summary ? (
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                        <div className="flex items-center space-x-2">
                          <FileText className="w-4 h-4 text-slate-400" />
                          <div>
                            <p className="text-xs text-slate-500">Studies</p>
                            <p className="font-semibold text-slate-900">{formatNumber(summary.total_studies)}</p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Clock className="w-4 h-4 text-slate-400" />
                          <div>
                            <p className="text-xs text-slate-500">Time Saved</p>
                            <p className="font-semibold text-slate-900">{formatHours(summary.total_time_saved_hours)}h</p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <DollarSign className="w-4 h-4 text-slate-400" />
                          <div>
                            <p className="text-xs text-slate-500">Cost Savings</p>
                            <p className="font-semibold text-slate-900">{formatCurrency(summary.total_potential_savings)}</p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Clock className="w-4 h-4 text-slate-400" />
                          <div>
                            <p className="text-xs text-slate-500">Avg/Study</p>
                            <p className="font-semibold text-slate-900">{formatHours(summary.avg_time_saved_per_study)}h</p>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <p className="text-sm text-slate-500 italic">No studies yet</p>
                    )}

                    {agent.target_user_base > 0 && (
                      <div className="mt-4 pt-4 border-t border-slate-200">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium text-slate-700">Adoption Progress</span>
                          <span className="text-sm font-semibold text-slate-900">
                            {agent.current_active_users} / {agent.target_user_base} users
                          </span>
                        </div>
                        <div className="relative">
                          <div className="overflow-hidden h-2.5 text-xs flex rounded-full bg-slate-200">
                            <div
                              style={{ width: `${Math.min(100, calculateAdoptionRate(agent.current_active_users, agent.target_user_base))}%` }}
                              className={`shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center transition-all duration-300 ${
                                calculateAdoptionRate(agent.current_active_users, agent.target_user_base) < 33 ? 'bg-red-500' :
                                calculateAdoptionRate(agent.current_active_users, agent.target_user_base) < 67 ? 'bg-amber-500' : 'bg-emerald-500'
                              }`}
                            ></div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center space-x-2 ml-4">
                    <button
                      onClick={() => onSelectAgent(agent.id)}
                      className="p-2 text-slate-600 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-all duration-200"
                      title="View details"
                    >
                      <ChevronRight className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => handleDelete(agent.id)}
                      className="p-2 text-slate-600 hover:text-danger-600 hover:bg-danger-50 rounded-lg transition-all duration-200"
                      title="Delete agent"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-lg sm:rounded-xl shadow-xl max-w-2xl w-full my-4 sm:my-8 max-h-[98vh] flex flex-col">
            <div className="p-4 sm:p-6 border-b border-slate-200 flex-shrink-0">
              <h3 className="text-lg sm:text-xl font-bold text-slate-900">Add New Agent</h3>
            </div>
            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto overscroll-contain">
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
                    Lifecycle Status
                  </label>
                  <select
                    value={formData.lifecycle_status}
                    onChange={e => setFormData({ ...formData, lifecycle_status: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
                  >
                    <option value="concept">Concept</option>
                    <option value="planned">Planned</option>
                    <option value="in_development">In Development</option>
                    <option value="pilot">Pilot</option>
                    <option value="production">Production</option>
                    <option value="retired">Retired</option>
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

                  {formData.target_user_base && parseInt(formData.target_user_base) > 0 && (
                    <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-sm font-medium text-slate-700">Adoption Rate</span>
                        <span className={`text-2xl font-bold ${
                          previewAdoptionRate < 33 ? 'text-red-600' :
                          previewAdoptionRate < 67 ? 'text-amber-600' : 'text-emerald-600'
                        }`}>
                          {previewAdoptionRate.toFixed(1)}%
                        </span>
                      </div>
                      <div className="relative">
                        <div className="overflow-hidden h-3 text-xs flex rounded-full bg-slate-200">
                          <div
                            style={{ width: `${Math.min(100, previewAdoptionRate)}%` }}
                            className={`shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center transition-all duration-300 ${
                              previewAdoptionRate < 33 ? 'bg-red-500' :
                              previewAdoptionRate < 67 ? 'bg-amber-500' : 'bg-emerald-500'
                            }`}
                          ></div>
                        </div>
                        <div className="flex justify-between mt-1 text-xs text-slate-500">
                          <span>0%</span>
                          <span>25%</span>
                          <span>50%</span>
                          <span>75%</span>
                          <span>100%</span>
                        </div>
                      </div>
                      <p className="text-xs text-slate-500 mt-2 text-center">
                        {formData.current_active_users || 0} of {formData.target_user_base} users
                      </p>
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Adoption Methodology
                    </label>
                    <input
                      type="text"
                      value={formData.adoption_methodology}
                      onChange={e => setFormData({ ...formData, adoption_methodology: e.target.value })}
                      className="input-field"
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
              </div>
              </div>
              <div className="p-4 sm:p-6 border-t border-slate-200 flex-shrink-0 bg-white">
                <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3">
                  <button
                    type="button"
                    onClick={() => {
                      setShowAddModal(false);
                      setFormData({
                        name: '',
                        category: '',
                        description: '',
                        division_id: '',
                        lifecycle_status: 'production',
                        avg_time_without_agent_minutes: '',
                        avg_time_with_agent_minutes: '',
                        avg_usage_count: '',
                        avg_hourly_wage: '20',
                        default_usage_discount_percent: '50',
                        target_user_base: '',
                        current_active_users: '',
                        adoption_methodology: ''
                      });
                      setPreviewAdoptionRate(100);
                    }}
                    className="flex-1 px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors text-sm sm:text-base min-h-[44px]"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors text-sm sm:text-base min-h-[44px]"
                  >
                    Add Agent
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
