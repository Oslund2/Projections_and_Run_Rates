import { useEffect, useState } from 'react';
import { Save, X, Calculator } from 'lucide-react';
import { agentService } from '../services/agentService';
import { studyService, type StudyWithAgent } from '../services/studyService';
import { calculateStudyMetrics, formatCurrency, formatHours } from '../utils/calculations';
import type { Database } from '../lib/database.types';

type Agent = Database['public']['Tables']['agents']['Row'];

interface StudyFormProps {
  study?: StudyWithAgent | null;
  onClose: () => void;
  onSuccess: () => void;
}

export function StudyForm({ study, onClose, onSuccess }: StudyFormProps) {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);
  const [formData, setFormData] = useState({
    agent_id: '',
    task_description: '',
    time_without_ai_minutes: '',
    time_with_ai_minutes: '',
    usage_count: '',
    usage_discount_percent: '50',
    cost_per_hour: '20',
    study_date: new Date().toISOString().split('T')[0],
    notes: ''
  });
  const [calculation, setCalculation] = useState({
    timeSavedMinutes: 0,
    netUsage: 0,
    netTimeSavedHours: 0,
    potentialSavings: 0
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (study) {
      setFormData({
        agent_id: study.agent_id,
        task_description: study.task_description,
        time_without_ai_minutes: study.time_without_ai_minutes.toString(),
        time_with_ai_minutes: study.time_with_ai_minutes.toString(),
        usage_count: study.usage_count.toString(),
        usage_discount_percent: study.usage_discount_percent.toString(),
        cost_per_hour: study.cost_per_hour.toString(),
        study_date: study.study_date,
        notes: study.notes || ''
      });
      const agent = agents.find(a => a.id === study.agent_id);
      setSelectedAgent(agent || null);
    }
  }, [study, agents]);

  useEffect(() => {
    if (
      formData.time_without_ai_minutes &&
      formData.time_with_ai_minutes &&
      formData.usage_count &&
      formData.usage_discount_percent &&
      formData.cost_per_hour
    ) {
      const result = calculateStudyMetrics({
        timeWithoutAiMinutes: parseFloat(formData.time_without_ai_minutes),
        timeWithAiMinutes: parseFloat(formData.time_with_ai_minutes),
        usageCount: parseInt(formData.usage_count),
        usageDiscountPercent: parseFloat(formData.usage_discount_percent),
        costPerHour: parseFloat(formData.cost_per_hour)
      });
      setCalculation(result);
    }
  }, [
    formData.time_without_ai_minutes,
    formData.time_with_ai_minutes,
    formData.usage_count,
    formData.usage_discount_percent,
    formData.cost_per_hour
  ]);

  const loadData = async () => {
    try {
      const agentsData = await agentService.getAll();
      setAgents(agentsData);
    } catch (error) {
      console.error('Error loading data:', error);
    }
  };

  const handleAgentChange = (agentId: string) => {
    const agent = agents.find(a => a.id === agentId);
    setSelectedAgent(agent || null);
    setFormData({
      ...formData,
      agent_id: agentId,
      time_without_ai_minutes: agent?.avg_time_without_agent_minutes ? agent.avg_time_without_agent_minutes.toString() : '',
      time_with_ai_minutes: agent?.avg_time_with_agent_minutes ? agent.avg_time_with_agent_minutes.toString() : '',
      usage_count: agent?.avg_usage_count ? agent.avg_usage_count.toString() : '',
      usage_discount_percent: agent?.default_usage_discount_percent.toString() || '50',
      cost_per_hour: agent?.avg_hourly_wage ? agent.avg_hourly_wage.toString() : (agent?.default_cost_per_employee_hour.toString() || '20')
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const studyData = {
        agent_id: formData.agent_id,
        task_description: formData.task_description,
        time_without_ai_minutes: parseFloat(formData.time_without_ai_minutes),
        time_with_ai_minutes: parseFloat(formData.time_with_ai_minutes),
        usage_count: parseInt(formData.usage_count),
        usage_discount_percent: parseFloat(formData.usage_discount_percent),
        cost_per_hour: parseFloat(formData.cost_per_hour),
        study_date: formData.study_date,
        notes: formData.notes || null
      };

      if (study) {
        await studyService.update(study.id, studyData);
      } else {
        await studyService.create(studyData);
      }

      onSuccess();
      onClose();
    } catch (error) {
      console.error(`Error ${study ? 'updating' : 'creating'} study:`, error);
      alert(`Failed to ${study ? 'update' : 'create'} study. Please try again.`);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-lg sm:rounded-xl shadow-xl max-w-3xl w-full my-4 sm:my-8 max-h-[98vh] flex flex-col">
        <div className="p-4 sm:p-6 border-b border-slate-200 flex-shrink-0">
          <div className="flex justify-between items-center">
            <h3 className="text-lg sm:text-xl font-bold text-slate-900">
              {study ? 'Edit Study' : 'Add Study'}
            </h3>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors min-w-[44px] min-h-[44px] touch-manipulation"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto overscroll-contain">
          <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-1">
                AI Agent *
              </label>
              <select
                required
                value={formData.agent_id}
                onChange={e => handleAgentChange(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
              >
                <option value="">Select an agent...</option>
                {agents.map(agent => (
                  <option key={agent.id} value={agent.id}>
                    {agent.name} {agent.category ? `(${agent.category})` : ''}
                  </option>
                ))}
              </select>
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Task Description *
              </label>
              <input
                type="text"
                required
                value={formData.task_description}
                onChange={e => setFormData({ ...formData, task_description: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
                placeholder="e.g., Turning print articles into broadcast-ready formats"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Time Without AI (minutes) *
              </label>
              <input
                type="number"
                required
                min="0"
                step="0.01"
                value={formData.time_without_ai_minutes}
                onChange={e => setFormData({ ...formData, time_without_ai_minutes: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
                placeholder="e.g., 2.00"
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
                value={formData.time_with_ai_minutes}
                onChange={e => setFormData({ ...formData, time_with_ai_minutes: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
                placeholder="e.g., 1.00"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Usage Count *
              </label>
              <input
                type="number"
                required
                min="0"
                step="1"
                value={formData.usage_count}
                onChange={e => setFormData({ ...formData, usage_count: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
                placeholder="e.g., 15800"
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
                value={formData.usage_discount_percent}
                onChange={e => setFormData({ ...formData, usage_discount_percent: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
                placeholder="e.g., 50"
              />
              {selectedAgent && (
                <p className="text-xs text-slate-500 mt-1">
                  Agent default: {selectedAgent.default_usage_discount_percent}% (pre-filled from agent)
                </p>
              )}
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
                value={formData.cost_per_hour}
                onChange={e => setFormData({ ...formData, cost_per_hour: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
                placeholder="e.g., 20"
              />
              {selectedAgent && (
                <p className="text-xs text-slate-500 mt-1">
                  Agent default: ${selectedAgent.avg_hourly_wage || selectedAgent.default_cost_per_employee_hour} (pre-filled from agent)
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Study Date *
              </label>
              <input
                type="date"
                required
                value={formData.study_date}
                onChange={e => setFormData({ ...formData, study_date: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Notes
              </label>
              <textarea
                value={formData.notes}
                onChange={e => setFormData({ ...formData, notes: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
                rows={2}
                placeholder="Additional observations or context..."
              />
            </div>
          </div>

          {calculation.potentialSavings > 0 && (
            <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3 sm:p-4">
              <div className="flex items-center space-x-2 mb-3">
                <Calculator className="w-5 h-5 text-emerald-600" />
                <h4 className="font-semibold text-slate-900">Calculated Results</h4>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
                <div>
                  <p className="text-xs text-slate-600">Time Saved</p>
                  <p className="text-sm font-semibold text-slate-900">{calculation.timeSavedMinutes.toFixed(2)} min</p>
                </div>
                <div>
                  <p className="text-xs text-slate-600">Net Usage</p>
                  <p className="text-sm font-semibold text-slate-900">{calculation.netUsage.toFixed(0)}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-600">Net Time Saved</p>
                  <p className="text-sm font-semibold text-emerald-700">{formatHours(calculation.netTimeSavedHours)} hours</p>
                </div>
                <div>
                  <p className="text-xs text-slate-600">Potential Savings</p>
                  <p className="text-sm font-semibold text-emerald-700">{formatCurrency(calculation.potentialSavings)}</p>
                </div>
              </div>
            </div>
          )}
          </div>
          <div className="p-4 sm:p-6 border-t border-slate-200 flex-shrink-0 bg-white">
            <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors text-sm sm:text-base min-h-[44px]"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="flex-1 flex items-center justify-center space-x-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed min-h-[44px]"
              >
                <Save className="w-4 h-4" />
                <span>{submitting ? 'Saving...' : 'Save Study'}</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
