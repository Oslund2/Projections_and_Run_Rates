import { useState, useEffect } from 'react';
import { Plus, DollarSign, Cpu, Users as UsersIcon, Calendar } from 'lucide-react';
import { costTrackingService } from '../services/costTrackingService';
import { divisionService } from '../services/divisionService';
import { agentService } from '../services/agentService';
import type { Database } from '../lib/database.types';

type Division = Database['public']['Tables']['divisions']['Row'];
type PlatformCost = Database['public']['Tables']['platform_costs']['Row'];
type TokenUsage = Database['public']['Tables']['token_usage']['Row'];
type AITeamMember = Database['public']['Tables']['ai_team_members']['Row'];
type Agent = Database['public']['Tables']['agents']['Row'];

type CostTab = 'platform' | 'tokens' | 'team';

export default function CostTracking() {
  const [activeTab, setActiveTab] = useState<CostTab>('platform');
  const [divisions, setDivisions] = useState<Division[]>([]);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [platformCosts, setPlatformCosts] = useState<PlatformCost[]>([]);
  const [tokenUsage, setTokenUsage] = useState<TokenUsage[]>([]);
  const [teamMembers, setTeamMembers] = useState<AITeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  const [platformForm, setPlatformForm] = useState({
    division_id: '',
    cost_type: 'subscription',
    month: new Date().toISOString().substring(0, 7),
    cost_period: 'monthly' as 'monthly' | 'annual',
    monthly_amount: '',
    annual_amount: '',
    description: ''
  });

  const [tokenForm, setTokenForm] = useState({
    agent_id: '',
    month: new Date().toISOString().substring(0, 7),
    token_period: 'monthly' as 'monthly' | 'annual',
    monthly_token_count: '',
    annual_token_count: '',
    token_count: '',
    monthly_cost: '',
    annual_cost: '',
    cost: '',
    notes: ''
  });

  const [teamForm, setTeamForm] = useState({
    name: '',
    role: '',
    fte_percentage: '100',
    monthly_cost: '',
    division_id: '',
    start_date: new Date().toISOString().substring(0, 10)
  });

  useEffect(() => {
    loadData();
  }, [activeTab]);

  const loadData = async () => {
    try {
      setLoading(true);
      const divs = await divisionService.getAll();
      setDivisions(divs);
      const agentsList = await agentService.getAll();
      setAgents(agentsList);

      if (activeTab === 'platform') {
        const costs = await costTrackingService.getPlatformCosts();
        setPlatformCosts(costs);
      } else if (activeTab === 'tokens') {
        const usage = await costTrackingService.getTokenUsage();
        setTokenUsage(usage);
      } else if (activeTab === 'team') {
        const members = await costTrackingService.getAITeamMembers();
        setTeamMembers(members);
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePlatformSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const monthlyAmount = parseFloat(platformForm.monthly_amount);
      const annualAmount = parseFloat(platformForm.annual_amount);

      if (isNaN(monthlyAmount) || isNaN(annualAmount)) {
        alert('Please enter a valid cost amount');
        return;
      }

      const monthDate = `${platformForm.month}-01`;

      await costTrackingService.addPlatformCost({
        division_id: platformForm.division_id || null,
        cost_type: platformForm.cost_type,
        month: monthDate,
        amount: monthlyAmount,
        monthly_amount: monthlyAmount,
        annual_amount: annualAmount,
        cost_period: platformForm.cost_period,
        description: platformForm.description
      });
      setShowForm(false);
      setPlatformForm({
        division_id: '',
        cost_type: 'subscription',
        month: new Date().toISOString().substring(0, 7),
        cost_period: 'monthly',
        monthly_amount: '',
        annual_amount: '',
        description: ''
      });
      loadData();
    } catch (error) {
      console.error('Error adding platform cost:', error);
      alert('Error adding platform cost. Please try again.');
    }
  };

  const handleCostAmountChange = (value: string, period: 'monthly' | 'annual') => {
    const numValue = parseFloat(value);
    if (value === '' || isNaN(numValue)) {
      setPlatformForm({
        ...platformForm,
        monthly_amount: value,
        annual_amount: '',
        cost_period: period
      });
      return;
    }

    if (period === 'monthly') {
      setPlatformForm({
        ...platformForm,
        monthly_amount: value,
        annual_amount: (numValue * 12).toFixed(2),
        cost_period: 'monthly'
      });
    } else {
      setPlatformForm({
        ...platformForm,
        monthly_amount: (numValue / 12).toFixed(2),
        annual_amount: value,
        cost_period: 'annual'
      });
    }
  };

  const handleTokenCountChange = (value: string, period: 'monthly' | 'annual') => {
    const numValue = parseInt(value);
    if (value === '' || isNaN(numValue)) {
      setTokenForm({
        ...tokenForm,
        monthly_token_count: value,
        annual_token_count: '',
        token_count: value,
        token_period: period
      });
      return;
    }

    if (period === 'monthly') {
      setTokenForm({
        ...tokenForm,
        monthly_token_count: value,
        annual_token_count: (numValue * 12).toString(),
        token_count: value,
        token_period: 'monthly'
      });
    } else {
      setTokenForm({
        ...tokenForm,
        monthly_token_count: Math.round(numValue / 12).toString(),
        annual_token_count: value,
        token_count: Math.round(numValue / 12).toString(),
        token_period: 'annual'
      });
    }
  };

  const handleTokenCostChange = (value: string, period: 'monthly' | 'annual') => {
    const numValue = parseFloat(value);
    if (value === '' || isNaN(numValue)) {
      setTokenForm({
        ...tokenForm,
        monthly_cost: value,
        annual_cost: '',
        cost: value
      });
      return;
    }

    if (period === 'monthly') {
      setTokenForm({
        ...tokenForm,
        monthly_cost: value,
        annual_cost: (numValue * 12).toFixed(2),
        cost: value
      });
    } else {
      setTokenForm({
        ...tokenForm,
        monthly_cost: (numValue / 12).toFixed(2),
        annual_cost: value,
        cost: (numValue / 12).toFixed(2)
      });
    }
  };

  const handleTokenSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const monthlyTokenCount = parseInt(tokenForm.monthly_token_count);
      const annualTokenCount = parseInt(tokenForm.annual_token_count);
      const monthlyCost = parseFloat(tokenForm.monthly_cost);
      const annualCost = parseFloat(tokenForm.annual_cost);

      if (isNaN(monthlyTokenCount) || isNaN(annualTokenCount) || isNaN(monthlyCost) || isNaN(annualCost)) {
        alert('Please enter valid token count and cost values');
        return;
      }

      await costTrackingService.addTokenUsage({
        agent_id: tokenForm.agent_id,
        month: tokenForm.month,
        token_count: monthlyTokenCount,
        cost: monthlyCost,
        token_period: tokenForm.token_period,
        monthly_token_count: monthlyTokenCount,
        annual_token_count: annualTokenCount,
        monthly_cost: monthlyCost,
        annual_cost: annualCost,
        notes: tokenForm.notes
      });
      setShowForm(false);
      setTokenForm({
        agent_id: '',
        month: new Date().toISOString().substring(0, 7),
        token_period: 'monthly',
        monthly_token_count: '',
        annual_token_count: '',
        token_count: '',
        monthly_cost: '',
        annual_cost: '',
        cost: '',
        notes: ''
      });
      loadData();
    } catch (error) {
      console.error('Error adding token usage:', error);
      alert('Error adding token usage. Please try again.');
    }
  };

  const handleTeamSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await costTrackingService.addAITeamMember({
        name: teamForm.name,
        role: teamForm.role,
        fte_percentage: parseFloat(teamForm.fte_percentage),
        monthly_cost: parseFloat(teamForm.monthly_cost),
        division_id: teamForm.division_id || null,
        start_date: teamForm.start_date
      });
      setShowForm(false);
      setTeamForm({
        name: '',
        role: '',
        fte_percentage: '100',
        monthly_cost: '',
        division_id: '',
        start_date: new Date().toISOString().substring(0, 10)
      });
      loadData();
    } catch (error) {
      console.error('Error adding team member:', error);
    }
  };

  const getTotalCosts = () => {
    if (activeTab === 'platform') {
      return platformCosts.reduce((sum, cost) => sum + Number(cost.annual_amount || cost.amount * 12), 0);
    } else if (activeTab === 'tokens') {
      return tokenUsage.reduce((sum, usage) => sum + Number(usage.annual_cost || usage.cost * 12), 0);
    } else if (activeTab === 'team') {
      return teamMembers
        .filter(m => !m.end_date)
        .reduce((sum, member) => sum + (Number(member.monthly_cost) * Number(member.fte_percentage) / 100), 0);
    }
    return 0;
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">AI Program Cost Tracking</h2>
          <p className="text-slate-600 mt-1">Track platform costs, token usage, and team expenses</p>
        </div>
        {!showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add {activeTab === 'platform' ? 'Cost' : activeTab === 'tokens' ? 'Token Usage' : 'Team Member'}
          </button>
        )}
      </div>

      <div className="flex gap-2 border-b border-slate-200">
        <button
          onClick={() => setActiveTab('platform')}
          className={`px-4 py-2 font-medium transition-colors ${
            activeTab === 'platform'
              ? 'text-blue-600 border-b-2 border-blue-600'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <div className="flex items-center gap-2">
            <DollarSign className="w-4 h-4" />
            Platform Costs
          </div>
        </button>
        <button
          onClick={() => setActiveTab('tokens')}
          className={`px-4 py-2 font-medium transition-colors ${
            activeTab === 'tokens'
              ? 'text-blue-600 border-b-2 border-blue-600'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <div className="flex items-center gap-2">
            <Cpu className="w-4 h-4" />
            Token Usage
          </div>
        </button>
        <button
          onClick={() => setActiveTab('team')}
          className={`px-4 py-2 font-medium transition-colors ${
            activeTab === 'team'
              ? 'text-blue-600 border-b-2 border-blue-600'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <div className="flex items-center gap-2">
            <UsersIcon className="w-4 h-4" />
            AI Team
          </div>
        </button>
      </div>

      {showForm && activeTab === 'platform' && (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <h3 className="text-lg font-semibold text-slate-900 mb-4">Add Platform Cost</h3>
          <form onSubmit={handlePlatformSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Month</label>
              <input
                type="month"
                value={platformForm.month}
                onChange={(e) => setPlatformForm({ ...platformForm, month: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Cost Entry Type</label>
              <div className="flex gap-4 mb-3">
                <label className="flex items-center cursor-pointer">
                  <input
                    type="radio"
                    checked={platformForm.cost_period === 'monthly'}
                    onChange={() => {
                      setPlatformForm({ ...platformForm, cost_period: 'monthly' });
                      if (platformForm.monthly_amount) {
                        handleCostAmountChange(platformForm.monthly_amount, 'monthly');
                      }
                    }}
                    className="mr-2"
                  />
                  <span className="text-sm text-slate-700">Enter Monthly Cost</span>
                </label>
                <label className="flex items-center cursor-pointer">
                  <input
                    type="radio"
                    checked={platformForm.cost_period === 'annual'}
                    onChange={() => {
                      setPlatformForm({ ...platformForm, cost_period: 'annual' });
                      if (platformForm.annual_amount) {
                        handleCostAmountChange(platformForm.annual_amount, 'annual');
                      }
                    }}
                    className="mr-2"
                  />
                  <span className="text-sm text-slate-700">Enter Annual Cost</span>
                </label>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Monthly Cost ($)
                  {platformForm.cost_period === 'annual' && <span className="text-xs text-slate-500 ml-1">(auto-calculated)</span>}
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={platformForm.monthly_amount}
                  onChange={(e) => handleCostAmountChange(e.target.value, 'monthly')}
                  disabled={platformForm.cost_period === 'annual' && platformForm.annual_amount !== ''}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 disabled:bg-slate-50 disabled:text-slate-600"
                  placeholder="0.00"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Annual Cost ($)
                  {platformForm.cost_period === 'monthly' && <span className="text-xs text-slate-500 ml-1">(auto-calculated)</span>}
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={platformForm.annual_amount}
                  onChange={(e) => handleCostAmountChange(e.target.value, 'annual')}
                  disabled={platformForm.cost_period === 'monthly' && platformForm.monthly_amount !== ''}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 disabled:bg-slate-50 disabled:text-slate-600"
                  placeholder="0.00"
                  required
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Cost Type</label>
                <select
                  value={platformForm.cost_type}
                  onChange={(e) => setPlatformForm({ ...platformForm, cost_type: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="subscription">Subscription</option>
                  <option value="infrastructure">Infrastructure</option>
                  <option value="licensing">Licensing</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Division (Optional)</label>
                <select
                  value={platformForm.division_id}
                  onChange={(e) => setPlatformForm({ ...platformForm, division_id: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Shared / Unallocated</option>
                  {divisions.map((div) => (
                    <option key={div.id} value={div.id}>{div.name}</option>
                  ))}
                </select>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
              <input
                type="text"
                value={platformForm.description}
                onChange={(e) => setPlatformForm({ ...platformForm, description: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., OpenAI API subscription"
              />
            </div>
            <div className="flex gap-3 pt-2">
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Add Cost
              </button>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {showForm && activeTab === 'tokens' && (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <h3 className="text-lg font-semibold text-slate-900 mb-4">Add Token Usage</h3>
          <form onSubmit={handleTokenSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Agent</label>
                <select
                  value={tokenForm.agent_id}
                  onChange={(e) => setTokenForm({ ...tokenForm, agent_id: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="">Select an agent</option>
                  {agents.map((agent) => (
                    <option key={agent.id} value={agent.id}>{agent.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Month</label>
                <input
                  type="month"
                  value={tokenForm.month}
                  onChange={(e) => setTokenForm({ ...tokenForm, month: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Entry Type</label>
              <div className="flex gap-4 mb-3">
                <label className="flex items-center cursor-pointer">
                  <input
                    type="radio"
                    checked={tokenForm.token_period === 'monthly'}
                    onChange={() => {
                      setTokenForm({ ...tokenForm, token_period: 'monthly' });
                      if (tokenForm.monthly_token_count) {
                        handleTokenCountChange(tokenForm.monthly_token_count, 'monthly');
                      }
                      if (tokenForm.monthly_cost) {
                        handleTokenCostChange(tokenForm.monthly_cost, 'monthly');
                      }
                    }}
                    className="mr-2"
                  />
                  <span className="text-sm text-slate-700">Enter Monthly Values</span>
                </label>
                <label className="flex items-center cursor-pointer">
                  <input
                    type="radio"
                    checked={tokenForm.token_period === 'annual'}
                    onChange={() => {
                      setTokenForm({ ...tokenForm, token_period: 'annual' });
                      if (tokenForm.annual_token_count) {
                        handleTokenCountChange(tokenForm.annual_token_count, 'annual');
                      }
                      if (tokenForm.annual_cost) {
                        handleTokenCostChange(tokenForm.annual_cost, 'annual');
                      }
                    }}
                    className="mr-2"
                  />
                  <span className="text-sm text-slate-700">Enter Annual Values</span>
                </label>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Monthly Token Count
                  {tokenForm.token_period === 'annual' && <span className="text-xs text-slate-500 ml-1">(auto-calculated)</span>}
                </label>
                <input
                  type="number"
                  step="1"
                  min="0"
                  value={tokenForm.monthly_token_count}
                  onChange={(e) => handleTokenCountChange(e.target.value, 'monthly')}
                  disabled={tokenForm.token_period === 'annual' && tokenForm.annual_token_count !== ''}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 disabled:bg-slate-50 disabled:text-slate-600"
                  placeholder="0"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Annual Token Count
                  {tokenForm.token_period === 'monthly' && <span className="text-xs text-slate-500 ml-1">(auto-calculated)</span>}
                </label>
                <input
                  type="number"
                  step="1"
                  min="0"
                  value={tokenForm.annual_token_count}
                  onChange={(e) => handleTokenCountChange(e.target.value, 'annual')}
                  disabled={tokenForm.token_period === 'monthly' && tokenForm.monthly_token_count !== ''}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 disabled:bg-slate-50 disabled:text-slate-600"
                  placeholder="0"
                  required
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Monthly Cost ($)
                  {tokenForm.token_period === 'annual' && <span className="text-xs text-slate-500 ml-1">(auto-calculated)</span>}
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={tokenForm.monthly_cost}
                  onChange={(e) => handleTokenCostChange(e.target.value, 'monthly')}
                  disabled={tokenForm.token_period === 'annual' && tokenForm.annual_cost !== ''}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 disabled:bg-slate-50 disabled:text-slate-600"
                  placeholder="0.00"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Annual Cost ($)
                  {tokenForm.token_period === 'monthly' && <span className="text-xs text-slate-500 ml-1">(auto-calculated)</span>}
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={tokenForm.annual_cost}
                  onChange={(e) => handleTokenCostChange(e.target.value, 'annual')}
                  disabled={tokenForm.token_period === 'monthly' && tokenForm.monthly_cost !== ''}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 disabled:bg-slate-50 disabled:text-slate-600"
                  placeholder="0.00"
                  required
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Notes (Optional)</label>
              <input
                type="text"
                value={tokenForm.notes}
                onChange={(e) => setTokenForm({ ...tokenForm, notes: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., API usage for production workload"
              />
            </div>
            <div className="flex gap-3 pt-2">
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Add Token Usage
              </button>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {showForm && activeTab === 'team' && (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <h3 className="text-lg font-semibold text-slate-900 mb-4">Add Team Member</h3>
          <form onSubmit={handleTeamSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Name</label>
                <input
                  type="text"
                  value={teamForm.name}
                  onChange={(e) => setTeamForm({ ...teamForm, name: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Role</label>
                <input
                  type="text"
                  value={teamForm.role}
                  onChange={(e) => setTeamForm({ ...teamForm, role: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., AI Engineer"
                  required
                />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">FTE %</label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  max="100"
                  value={teamForm.fte_percentage}
                  onChange={(e) => setTeamForm({ ...teamForm, fte_percentage: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Monthly Cost ($)</label>
                <input
                  type="number"
                  step="0.01"
                  value={teamForm.monthly_cost}
                  onChange={(e) => setTeamForm({ ...teamForm, monthly_cost: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="Fully loaded cost"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Start Date</label>
                <input
                  type="date"
                  value={teamForm.start_date}
                  onChange={(e) => setTeamForm({ ...teamForm, start_date: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Division (Optional)</label>
              <select
                value={teamForm.division_id}
                onChange={(e) => setTeamForm({ ...teamForm, division_id: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="">No specific division</option>
                {divisions.map((div) => (
                  <option key={div.id} value={div.id}>{div.name}</option>
                ))}
              </select>
            </div>
            <div className="flex gap-3 pt-2">
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Add Team Member
              </button>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-slate-900">
            {activeTab === 'platform' ? 'Platform Costs' : activeTab === 'tokens' ? 'Token Usage' : 'AI Team Members'}
          </h3>
          <div className="text-right">
            <div className="text-2xl font-bold text-blue-600">
              ${getTotalCosts().toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <div className="text-sm text-slate-600">
              {activeTab === 'platform' && 'annual total'}
              {activeTab === 'tokens' && 'annual total'}
              {activeTab === 'team' && 'monthly total'}
            </div>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-8 text-slate-400">Loading...</div>
        ) : (
          <div className="space-y-2">
            {activeTab === 'platform' && platformCosts.length === 0 && (
              <p className="text-center py-8 text-slate-400">No platform costs recorded yet</p>
            )}
            {activeTab === 'platform' && platformCosts.map((cost) => {
              const division = divisions.find(d => d.id === cost.division_id);
              const monthlyAmount = cost.monthly_amount || cost.amount;
              const annualAmount = cost.annual_amount || cost.amount * 12;
              const enteredAs = cost.cost_period || 'monthly';
              return (
                <div key={cost.id} className="flex justify-between items-center p-3 hover:bg-slate-50 rounded-lg">
                  <div>
                    <div className="font-medium text-slate-900">{cost.description || cost.cost_type}</div>
                    <div className="text-sm text-slate-600">
                      <Calendar className="w-3 h-3 inline mr-1" />
                      {new Date(cost.month).toLocaleDateString('en-US', { year: 'numeric', month: 'long' })}
                      {division && ` • ${division.name}`}
                    </div>
                    <div className="text-xs text-slate-500 mt-1">
                      Monthly: ${Number(monthlyAmount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      {' • '}
                      Annual: ${Number(annualAmount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      {enteredAs && ` • Entered as ${enteredAs}`}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-semibold text-slate-900">
                      ${Number(annualAmount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </div>
                    <div className="text-xs text-slate-500">annual</div>
                  </div>
                </div>
              );
            })}

            {activeTab === 'team' && teamMembers.length === 0 && (
              <p className="text-center py-8 text-slate-400">No team members recorded yet</p>
            )}
            {activeTab === 'team' && teamMembers.map((member) => {
              const division = divisions.find(d => d.id === member.division_id);
              const allocatedCost = Number(member.monthly_cost) * Number(member.fte_percentage) / 100;
              return (
                <div key={member.id} className="flex justify-between items-center p-3 hover:bg-slate-50 rounded-lg">
                  <div>
                    <div className="font-medium text-slate-900">{member.name}</div>
                    <div className="text-sm text-slate-600">
                      {member.role} • {member.fte_percentage}% FTE
                      {division && ` • ${division.name}`}
                      {member.end_date && ' • Inactive'}
                    </div>
                  </div>
                  <div className="text-lg font-semibold text-slate-900">
                    ${allocatedCost.toLocaleString('en-US', { minimumFractionDigits: 2 })}/mo
                  </div>
                </div>
              );
            })}

            {activeTab === 'tokens' && tokenUsage.length === 0 && (
              <p className="text-center py-8 text-slate-400">No token usage recorded yet</p>
            )}
            {activeTab === 'tokens' && tokenUsage.map((usage) => {
              const agent = agents.find(a => a.id === usage.agent_id);
              const monthlyTokens = usage.monthly_token_count || usage.token_count;
              const annualTokens = usage.annual_token_count || usage.token_count * 12;
              const monthlyCost = usage.monthly_cost || usage.cost;
              const annualCost = usage.annual_cost || usage.cost * 12;
              const enteredAs = usage.token_period || 'monthly';
              return (
                <div key={usage.id} className="flex justify-between items-center p-3 hover:bg-slate-50 rounded-lg">
                  <div>
                    <div className="font-medium text-slate-900">{agent?.name || 'Unknown Agent'}</div>
                    <div className="text-sm text-slate-600">
                      <Calendar className="w-3 h-3 inline mr-1" />
                      {new Date(usage.month).toLocaleDateString('en-US', { year: 'numeric', month: 'long' })}
                      {usage.notes && ` • ${usage.notes}`}
                    </div>
                    <div className="text-xs text-slate-500 mt-1">
                      Monthly: {Number(monthlyTokens).toLocaleString()} tokens • ${Number(monthlyCost).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      {' • '}
                      Annual: {Number(annualTokens).toLocaleString()} tokens • ${Number(annualCost).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      {enteredAs && ` • Entered as ${enteredAs}`}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-semibold text-slate-900">
                      ${Number(annualCost).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </div>
                    <div className="text-xs text-slate-500">annual</div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
