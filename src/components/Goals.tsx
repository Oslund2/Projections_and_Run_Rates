import { useEffect, useState } from 'react';
import { Plus, Target, TrendingUp, AlertCircle, CheckCircle2, Clock, X, Edit2, ChevronDown, ChevronUp, Users } from 'lucide-react';
import { goalService, type GoalWithAgent, type GoalType, type GoalStatus, type GoalDataSource, type CreateGoalInput } from '../services/goalService';
import { agentService } from '../services/agentService';
import { organizationService } from '../services/organizationService';
import { formatCurrency, formatHours, formatNumber } from '../utils/calculations';
import { AgentContributions } from './AgentContributions';

export function Goals() {
  const [goals, setGoals] = useState<GoalWithAgent[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingGoalId, setEditingGoalId] = useState<string | null>(null);
  const [agents, setAgents] = useState<any[]>([]);
  const [filterStatus, setFilterStatus] = useState<'all' | GoalStatus>('all');
  const [expandedGoalId, setExpandedGoalId] = useState<string | null>(null);
  const [totalEmployees, setTotalEmployees] = useState<number>(100);

  const [formData, setFormData] = useState<CreateGoalInput>({
    agent_id: null,
    goal_type: 'time_saved',
    target_value: 0,
    target_date: '',
    description: '',
    data_source: 'projected',
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [goalsData, agentsData, empCount] = await Promise.all([
        goalService.getAll(),
        agentService.getAll(),
        organizationService.getTotalEmployees()
      ]);
      setGoals(goalsData);
      setAgents(agentsData);
      setTotalEmployees(empCount);
    } catch (error) {
      console.error('Error loading goals:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await goalService.create(formData);
      setShowAddModal(false);
      setFormData({
        agent_id: null,
        goal_type: 'time_saved',
        target_value: 0,
        target_date: '',
        description: '',
        data_source: 'projected',
      });
      loadData();
    } catch (error) {
      console.error('Error creating goal:', error);
    }
  };

  const handleUpdateStatus = async (id: string, status: GoalStatus) => {
    try {
      await goalService.update(id, { status });
      loadData();
    } catch (error) {
      console.error('Error updating goal:', error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this goal?')) {
      return;
    }

    try {
      await goalService.delete(id);
      loadData();
    } catch (error) {
      console.error('Error deleting goal:', error);
    }
  };

  const handleEdit = (goal: GoalWithAgent) => {
    setEditingGoalId(goal.id);
    setFormData({
      agent_id: goal.agent_id,
      goal_type: goal.goal_type as GoalType,
      target_value: goal.target_value,
      target_date: goal.target_date,
      description: goal.description || '',
      data_source: goal.data_source as GoalDataSource,
    });
    setShowEditModal(true);
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingGoalId) return;

    try {
      await goalService.update(editingGoalId, {
        target_value: formData.target_value,
        target_date: formData.target_date,
        description: formData.description,
      });
      setShowEditModal(false);
      setEditingGoalId(null);
      setFormData({
        agent_id: null,
        goal_type: 'time_saved',
        target_value: 0,
        target_date: '',
        description: '',
        data_source: 'projected',
      });
      loadData();
    } catch (error) {
      console.error('Error updating goal:', error);
    }
  };

  const filteredGoals = filterStatus === 'all'
    ? goals
    : goals.filter(g => g.status === filterStatus);

  const getStatusIcon = (status: GoalStatus) => {
    switch (status) {
      case 'achieved':
        return <CheckCircle2 className="w-5 h-5 text-blue-600" />;
      case 'on_track':
        return <TrendingUp className="w-5 h-5 text-emerald-600" />;
      case 'at_risk':
        return <AlertCircle className="w-5 h-5 text-amber-600" />;
      case 'behind':
        return <AlertCircle className="w-5 h-5 text-rose-600" />;
      default:
        return <Clock className="w-5 h-5 text-slate-400" />;
    }
  };

  const getStatusColor = (status: GoalStatus) => {
    const colors = {
      achieved: 'bg-blue-50 text-blue-700 border-blue-200',
      on_track: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      at_risk: 'bg-amber-50 text-amber-700 border-amber-200',
      behind: 'bg-rose-50 text-rose-700 border-rose-200',
      cancelled: 'bg-slate-50 text-slate-600 border-slate-200',
    };
    return colors[status];
  };

  const formatGoalValue = (type: GoalType, value: number, showContext = false) => {
    switch (type) {
      case 'time_saved':
        return `${formatHours(value)} hours`;
      case 'cost_saved':
        return formatCurrency(value);
      case 'study_count':
        return `${formatNumber(value)} studies`;
      case 'fte_impact':
        const percentage = value * 100;
        const fteCount = (value * totalEmployees);
        if (showContext) {
          return `${percentage.toFixed(1)}% (${fteCount.toFixed(2)} FTEs of ${totalEmployees} employees)`;
        }
        return `${percentage.toFixed(1)}%`;
      default:
        return formatNumber(value);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  const summary = {
    total: goals.length,
    achieved: goals.filter(g => g.status === 'achieved').length,
    on_track: goals.filter(g => g.status === 'on_track').length,
    at_risk: goals.filter(g => g.status === 'at_risk').length,
    behind: goals.filter(g => g.status === 'behind').length,
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 sm:gap-0">
        <div>
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900">Goals & Targets</h2>
          <p className="text-sm sm:text-base text-slate-600 mt-1 sm:mt-2">Track progress toward your AI ROI objectives</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="btn-primary w-full sm:w-auto text-sm sm:text-base"
        >
          <Plus className="w-4 h-4" />
          <span>Add Goal</span>
        </button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 sm:gap-4">
        <div className="bg-white rounded-lg border border-slate-200 p-4">
          <p className="text-sm text-slate-600 mb-1">Total Goals</p>
          <p className="text-2xl font-bold text-slate-900">{summary.total}</p>
        </div>
        <div className="bg-emerald-50 rounded-lg border border-emerald-200 p-4">
          <p className="text-sm text-emerald-700 mb-1">On Track</p>
          <p className="text-2xl font-bold text-emerald-900">{summary.on_track}</p>
        </div>
        <div className="bg-amber-50 rounded-lg border border-amber-200 p-4">
          <p className="text-sm text-amber-700 mb-1">At Risk</p>
          <p className="text-2xl font-bold text-amber-900">{summary.at_risk}</p>
        </div>
        <div className="bg-rose-50 rounded-lg border border-rose-200 p-4">
          <p className="text-sm text-rose-700 mb-1">Behind</p>
          <p className="text-2xl font-bold text-rose-900">{summary.behind}</p>
        </div>
        <div className="bg-blue-50 rounded-lg border border-blue-200 p-4">
          <p className="text-sm text-blue-700 mb-1">Achieved</p>
          <p className="text-2xl font-bold text-blue-900">{summary.achieved}</p>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-slate-200 p-3 sm:p-4">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs sm:text-sm font-medium text-slate-700">Filter:</span>
          <button
            onClick={() => setFilterStatus('all')}
            className={`px-2 sm:px-3 py-1 rounded text-xs sm:text-sm font-medium transition-colors ${
              filterStatus === 'all' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            All
          </button>
          <button
            onClick={() => setFilterStatus('on_track')}
            className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
              filterStatus === 'on_track' ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            On Track
          </button>
          <button
            onClick={() => setFilterStatus('at_risk')}
            className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
              filterStatus === 'at_risk' ? 'bg-amber-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            At Risk
          </button>
          <button
            onClick={() => setFilterStatus('behind')}
            className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
              filterStatus === 'behind' ? 'bg-rose-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Behind
          </button>
          <button
            onClick={() => setFilterStatus('achieved')}
            className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
              filterStatus === 'achieved' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Achieved
          </button>
        </div>
      </div>

      {filteredGoals.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
          <Target className="w-16 h-16 text-slate-300 mx-auto mb-4" />
          <p className="text-slate-500 mb-4">
            {filterStatus === 'all'
              ? 'No goals found. Create your first goal to start tracking progress.'
              : `No ${filterStatus.replace('_', ' ')} goals found.`}
          </p>
          {filterStatus === 'all' && (
            <button
              onClick={() => setShowAddModal(true)}
              className="inline-flex items-center space-x-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Add Your First Goal</span>
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {filteredGoals.map(goal => {
            const progress = goalService.calculateProgress(goal);
            const daysRemaining = goalService.getDaysRemaining(goal);

            return (
              <div
                key={goal.id}
                className={`bg-white rounded-xl border-2 p-4 sm:p-6 transition-all ${getStatusColor(goal.status)}`}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                      {getStatusIcon(goal.status)}
                      <h3 className="text-base sm:text-lg font-bold text-slate-900">
                        {goalService.getGoalTypeLabel(goal.goal_type)}
                      </h3>
                      {goal.agents && (
                        <span className="px-2 py-1 bg-slate-100 text-slate-700 text-xs font-medium rounded-full">
                          {goal.agents.name}
                        </span>
                      )}
                      {!goal.agents && (
                        <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded-full">
                          Organization-wide
                        </span>
                      )}
                      <span className={`px-2 py-1 ${goal.data_source === 'projected' ? 'bg-blue-100 text-blue-700' : 'bg-emerald-100 text-emerald-700'} text-xs font-medium rounded-full`}>
                        {goalService.getDataSourceLabel(goal.data_source)}
                      </span>
                    </div>

                    {goal.description && (
                      <p className="text-sm text-slate-600 mb-3">{goal.description}</p>
                    )}

                    <div className="space-y-2">
                      <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-6 text-xs sm:text-sm">
                        <div>
                          <span className="text-slate-500">Target: </span>
                          <span className="font-semibold text-slate-900">
                            {formatGoalValue(goal.goal_type, goal.target_value)}
                          </span>
                        </div>
                        <div>
                          <span className="text-slate-500">Current: </span>
                          <span className="font-semibold text-slate-900">
                            {formatGoalValue(goal.goal_type, goal.current_value)}
                          </span>
                        </div>
                        <div>
                          <span className="text-slate-500">Due: </span>
                          <span className="font-semibold text-slate-900">
                            {new Date(goal.target_date).toLocaleDateString()}
                            {daysRemaining >= 0 && (
                              <span className="text-xs ml-1 text-slate-500">
                                ({daysRemaining} days)
                              </span>
                            )}
                          </span>
                        </div>
                      </div>
                      {goal.goal_type === 'fte_impact' && (
                        <div className="flex items-center space-x-2 text-xs text-slate-600 bg-slate-50 px-3 py-2 rounded-lg">
                          <Users className="w-4 h-4" />
                          <span>
                            <span className="font-medium">Target:</span> {formatGoalValue(goal.goal_type, goal.target_value, true)} ·
                            <span className="font-medium ml-2">Current:</span> {formatGoalValue(goal.goal_type, goal.current_value, true)}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex sm:flex-col flex-row sm:space-y-2 space-x-2 sm:space-x-0 sm:ml-4">
                    <button
                      onClick={() => handleEdit(goal)}
                      className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      title="Edit goal"
                    >
                      <Edit2 className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => handleDelete(goal.id)}
                      className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                      title="Delete goal"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between items-center text-sm">
                    <span className="font-medium text-slate-700">Progress</span>
                    <span className="font-bold text-slate-900">{progress.toFixed(1)}%</span>
                  </div>
                  <div className="w-full bg-slate-200 rounded-full h-3 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        goal.status === 'achieved' ? 'bg-blue-600' :
                        goal.status === 'on_track' ? 'bg-emerald-600' :
                        goal.status === 'at_risk' ? 'bg-amber-600' :
                        'bg-rose-600'
                      }`}
                      style={{ width: `${Math.min(100, progress)}%` }}
                    />
                  </div>
                </div>

                {goal.data_source === 'projected' && !goal.agent_id && (
                  <div className="mt-4 pt-4 border-t border-slate-200">
                    <button
                      onClick={() => setExpandedGoalId(expandedGoalId === goal.id ? null : goal.id)}
                      className="flex items-center space-x-2 text-sm font-medium text-blue-600 hover:text-blue-700 transition-colors"
                    >
                      {expandedGoalId === goal.id ? (
                        <>
                          <ChevronUp className="w-4 h-4" />
                          <span>Hide Agent Breakdown</span>
                        </>
                      ) : (
                        <>
                          <ChevronDown className="w-4 h-4" />
                          <span>Show Agent Breakdown</span>
                        </>
                      )}
                    </button>
                    {expandedGoalId === goal.id && (
                      <div className="mt-3">
                        <AgentContributions goalId={goal.id} goalType={goal.goal_type} />
                      </div>
                    )}
                  </div>
                )}

                {goal.status !== 'achieved' && goal.status !== 'cancelled' && (
                  <div className="mt-4 pt-4 border-t border-slate-200 flex items-center space-x-2">
                    <button
                      onClick={() => handleUpdateStatus(goal.id, 'achieved')}
                      className="px-3 py-1 bg-blue-100 text-blue-700 rounded text-xs font-medium hover:bg-blue-200 transition-colors"
                    >
                      Mark Achieved
                    </button>
                    <button
                      onClick={() => handleUpdateStatus(goal.id, 'cancelled')}
                      className="px-3 py-1 bg-slate-100 text-slate-700 rounded text-xs font-medium hover:bg-slate-200 transition-colors"
                    >
                      Cancel Goal
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-lg sm:rounded-xl shadow-xl max-w-md w-full p-4 sm:p-6 my-4 sm:my-0 max-h-[95vh] overflow-y-auto">
            <h3 className="text-lg sm:text-xl font-bold text-slate-900 mb-4">Add New Goal</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Data Source *
                </label>
                <select
                  required
                  value={formData.data_source}
                  onChange={e => setFormData({ ...formData, data_source: e.target.value as GoalDataSource })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
                >
                  <option value="projected">Projections from Agent Variables</option>
                  <option value="actual">Run Rate from Studies</option>
                </select>
                <p className="text-xs text-slate-500 mt-1">
                  {formData.data_source === 'projected'
                    ? 'Goal will track against agent projection variables (time, usage, cost estimates)'
                    : 'Goal will track against run rate measured data from completed time & motion studies'}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Goal Type *
                </label>
                <select
                  required
                  value={formData.goal_type}
                  onChange={e => setFormData({ ...formData, goal_type: e.target.value as GoalType })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
                >
                  <option value="time_saved">Time Saved (hours)</option>
                  <option value="cost_saved">Cost Savings ($)</option>
                  {formData.data_source === 'actual' && <option value="study_count">Study Count</option>}
                  <option value="fte_impact">FTE Impact (%)</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Agent
                </label>
                <select
                  value={formData.agent_id || ''}
                  onChange={e => setFormData({ ...formData, agent_id: e.target.value || null })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
                >
                  <option value="">Organization-wide {formData.data_source === 'projected' && '(aggregates all agent projections)'}</option>
                  {agents.map(agent => (
                    <option key={agent.id} value={agent.id}>{agent.name}</option>
                  ))}
                </select>
                {formData.data_source === 'projected' && !formData.agent_id && (
                  <p className="text-xs text-blue-600 mt-1">
                    Organization-wide projection goals will automatically sum projections from all active agents
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Target Value *
                </label>
                <input
                  type="number"
                  required
                  min="0"
                  step="0.01"
                  value={formData.target_value}
                  onChange={e => setFormData({ ...formData, target_value: parseFloat(e.target.value) || 0 })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
                  placeholder="Enter target value"
                />
                {formData.goal_type === 'fte_impact' && (
                  <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="flex items-start space-x-2">
                      <Users className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                      <div className="text-xs text-blue-800">
                        <p className="font-medium mb-1">FTE Impact Percentage</p>
                        <p>For FTE goals, enter the target as a decimal. For example:</p>
                        <ul className="mt-1 space-y-0.5 list-disc list-inside">
                          <li><span className="font-medium">0.02</span> = 2% of workforce ({(0.02 * totalEmployees).toFixed(2)} FTEs of {totalEmployees} employees)</li>
                          <li><span className="font-medium">0.05</span> = 5% of workforce ({(0.05 * totalEmployees).toFixed(2)} FTEs of {totalEmployees} employees)</li>
                          <li><span className="font-medium">0.10</span> = 10% of workforce ({(0.10 * totalEmployees).toFixed(2)} FTEs of {totalEmployees} employees)</li>
                        </ul>
                        <p className="mt-2 text-blue-700">
                          Current employee count: <span className="font-semibold">{totalEmployees}</span> (configure in Settings)
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Target Date *
                </label>
                <input
                  type="date"
                  required
                  value={formData.target_date}
                  onChange={e => setFormData({ ...formData, target_date: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={e => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
                  rows={3}
                  placeholder="Optional description or notes about this goal"
                />
              </div>

              <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddModal(false);
                    setFormData({
                      agent_id: null,
                      goal_type: 'time_saved',
                      target_value: 0,
                      target_date: '',
                      description: '',
                      data_source: 'projected',
                    });
                  }}
                  className="flex-1 px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
                >
                  Add Goal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showEditModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-lg sm:rounded-xl shadow-xl max-w-md w-full p-4 sm:p-6 my-4 sm:my-0 max-h-[95vh] overflow-y-auto">
            <h3 className="text-lg sm:text-xl font-bold text-slate-900 mb-4">Edit Goal</h3>
            <form onSubmit={handleUpdate} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Goal Type
                </label>
                <input
                  type="text"
                  disabled
                  value={goalService.getGoalTypeLabel(formData.goal_type)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-slate-50 text-slate-600 cursor-not-allowed"
                />
                <p className="text-xs text-slate-500 mt-1">Goal type cannot be changed</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Agent
                </label>
                <input
                  type="text"
                  disabled
                  value={
                    formData.agent_id
                      ? agents.find(a => a.id === formData.agent_id)?.name || 'Unknown'
                      : 'Organization-wide'
                  }
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-slate-50 text-slate-600 cursor-not-allowed"
                />
                <p className="text-xs text-slate-500 mt-1">Agent assignment cannot be changed</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Target Value *
                </label>
                <input
                  type="number"
                  required
                  min="0"
                  step="0.01"
                  value={formData.target_value}
                  onChange={e => setFormData({ ...formData, target_value: parseFloat(e.target.value) || 0 })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  placeholder="Enter target value"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Target Date *
                </label>
                <input
                  type="date"
                  required
                  value={formData.target_date}
                  onChange={e => setFormData({ ...formData, target_date: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={e => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  rows={3}
                  placeholder="Optional description or notes about this goal"
                />
              </div>

              <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowEditModal(false);
                    setEditingGoalId(null);
                    setFormData({
                      agent_id: null,
                      goal_type: 'time_saved',
                      target_value: 0,
                      target_date: '',
                      description: '',
                      data_source: 'projected',
                    });
                  }}
                  className="flex-1 px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Update Goal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
