import { useEffect, useState } from 'react';
import { Clock, DollarSign, FileText, TrendingUp, Briefcase, Target, CheckCircle2, Activity, AlertCircle, Users, MessageCircle } from 'lucide-react';
import { summaryService } from '../services/summaryService';
import { goalService, type GoalWithAgent } from '../services/goalService';
import { organizationService } from '../services/organizationService';
import { formatCurrency, formatHours, formatNumber, calculateFTE } from '../utils/calculations';
import { DrillDownModal } from './DrillDownModal';
import DivisionSelector from './DivisionSelector';
import { ButtonTooltip } from './ButtonTooltip';
import { QuoteFooter } from './QuoteFooter';

interface SummaryData {
  totalTimeSaved: number;
  totalSavings: number;
  totalStudies?: number;
  activeAgents: number;
  avgSavingsPerAgent: number;
  fteEquivalent: number;
}

interface GlobalSummary {
  projected: SummaryData;
  actual: SummaryData;
  hasProjectedData: boolean;
  hasActualData: boolean;
}

type DrillDownType = 'runrate-agents' | 'runrate-time' | 'runrate-cost' | 'runrate-fte' | 'actual-agents' | 'actual-time' | 'actual-cost' | 'actual-studies';

interface DashboardProps {
  onChatPromptTrigger?: (prompt: string) => void;
  onDivisionChange?: (divisionId: string | null) => void;
}

export function Dashboard({ onChatPromptTrigger, onDivisionChange }: DashboardProps = {}) {
  const [summary, setSummary] = useState<GlobalSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'combined' | 'runrate' | 'actual'>('runrate');
  const [goals, setGoals] = useState<GoalWithAgent[]>([]);
  const [totalEmployees, setTotalEmployees] = useState<number>(100);
  const [selectedDivision, setSelectedDivision] = useState<string | null>(null);
  const [drillDownModal, setDrillDownModal] = useState<{
    isOpen: boolean;
    type: DrillDownType | null;
    title: string;
    data: any[];
  }>({ isOpen: false, type: null, title: '', data: [] });

  useEffect(() => {
    loadSummary();
  }, [selectedDivision]);

  useEffect(() => {
    if (onDivisionChange) {
      onDivisionChange(selectedDivision);
    }
  }, [selectedDivision, onDivisionChange]);

  const loadSummary = async () => {
    try {
      console.log('Loading summary for division:', selectedDivision);
      const [summaryData, goalsData, empCount] = await Promise.all([
        summaryService.getGlobalSummary(selectedDivision),
        goalService.getActiveGoals(selectedDivision),
        organizationService.getTotalEmployees(selectedDivision)
      ]);
      console.log('Summary data loaded:', summaryData);
      setSummary(summaryData);
      setGoals(goalsData);
      setTotalEmployees(empCount);
    } catch (error) {
      console.error('Error loading summary:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDrillDown = async (type: DrillDownType, title: string) => {
    try {
      let data: any[] = [];

      if (type.startsWith('runrate')) {
        data = await summaryService.getProjectedAgentsDetail(selectedDivision);
      } else if (type.startsWith('actual')) {
        data = await summaryService.getActualStudiesDetail(selectedDivision);
      }

      setDrillDownModal({
        isOpen: true,
        type,
        title,
        data
      });
    } catch (error) {
      console.error('Error loading drill-down data:', error);
    }
  };

  const closeDrillDown = () => {
    setDrillDownModal({ isOpen: false, type: null, title: '', data: [] });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!summary) {
    return (
      <div className="text-center py-12">
        <p className="text-slate-500">Unable to load dashboard data</p>
      </div>
    );
  }

  const showProjections = viewMode === 'combined' || viewMode === 'runrate';
  const showRunRate = viewMode === 'combined' || viewMode === 'actual';
  const canCompare = summary.hasProjectedData && summary.hasActualData;

  const getVariance = (actual: number, projected: number): number => {
    if (projected === 0) return 0;
    return ((actual / projected) * 100) - 100;
  };

  const getVarianceColor = (variance: number): string => {
    if (variance >= 0) return 'text-emerald-600';
    if (variance >= -15) return 'text-amber-600';
    return 'text-rose-600';
  };

  const projectionStats = [
    {
      label: 'Agents with Projections',
      value: formatNumber(summary.projected.activeAgents),
      icon: Target,
      color: 'blue',
      subtext: `${formatCurrency(summary.projected.avgSavingsPerAgent)} avg per agent`,
      actual: summary.actual.activeAgents,
      projected: summary.projected.activeAgents,
      showValidation: true,
      chatPrompts: [
        "Which agents have projections but haven't been validated yet?",
        "Show me the agents with the highest projected savings",
        "Break down agents by category with their projection estimates"
      ]
    },
    {
      label: 'Hours to Redeploy (time saved)',
      value: formatHours(summary.projected.totalTimeSaved) + ' hours',
      icon: Clock,
      color: 'blue',
      subtext: `${formatNumber(summary.projected.totalTimeSaved * 60)} minutes annually`,
      actual: summary.actual.totalTimeSaved,
      projected: summary.projected.totalTimeSaved,
      chatPrompts: [
        "Show me a breakdown of projected time savings by agent category",
        "Which agents are expected to save the most time?",
        "Explain how these hours can be redeployed strategically"
      ]
    },
    {
      label: 'Projected Cost Savings',
      value: formatCurrency(summary.projected.totalSavings),
      icon: DollarSign,
      color: 'blue',
      subtext: 'Annualized Projection',
      actual: summary.actual.totalSavings,
      projected: summary.projected.totalSavings,
      chatPrompts: [
        "Which agents provide the highest ROI based on projections?",
        "Compare projected cost savings across different agent categories",
        "What assumptions are these savings based on?"
      ]
    },
    {
      label: 'Projected FTE Impact',
      value: ((summary.projected.fteEquivalent / totalEmployees) * 100).toFixed(2) + '%',
      icon: Briefcase,
      color: 'blue',
      subtext: `${summary.projected.fteEquivalent.toFixed(2)} FTEs freed (${formatHours(summary.projected.totalTimeSaved)} hrs ÷ 2,080/yr)`,
      actual: summary.actual.fteEquivalent,
      projected: summary.projected.fteEquivalent,
      chatPrompts: [
        "Explain the workforce redeployment opportunities from these FTE savings",
        "How does this FTE impact compare to our total workforce?",
        "What strategic initiatives could we fund with this freed capacity?"
      ]
    }
  ];

  const runRateStats = [
    {
      label: 'Agents with Run Rate Data',
      value: formatNumber(summary.actual.activeAgents),
      icon: CheckCircle2,
      color: 'emerald',
      subtext: `${formatCurrency(summary.actual.avgSavingsPerAgent)} avg per agent`,
      chatPrompts: [
        "How do the validated agents compare to their projections?",
        "Which validated agents are performing better than projected?",
        "Show me the validation rate breakdown by category"
      ]
    },
    {
      label: 'Run Rate Time Saved',
      value: formatHours(summary.actual.totalTimeSaved) + ' hours',
      icon: Clock,
      color: 'emerald',
      subtext: `${formatNumber(summary.actual.totalTimeSaved * 60)} minutes measured`,
      chatPrompts: [
        "Break down run rate time savings by agent and category",
        "Compare run rate vs projected time savings - what's the variance?",
        "Which time savings are most consistent across studies?"
      ]
    },
    {
      label: 'Run Rate Cost Savings',
      value: formatCurrency(summary.actual.totalSavings),
      icon: DollarSign,
      color: 'emerald',
      subtext: 'Measured expense reduction',
      chatPrompts: [
        "Show me which agents deliver the highest measured ROI",
        "How accurate were our cost savings projections?",
        "What's driving the difference between projected and run rate savings?"
      ]
    },
    {
      label: 'Run Rate FTE Impact',
      value: ((summary.actual.fteEquivalent / totalEmployees) * 100).toFixed(2) + '%',
      icon: Briefcase,
      color: 'emerald',
      subtext: `${summary.actual.fteEquivalent.toFixed(2)} FTEs freed (${formatHours(summary.actual.totalTimeSaved)} hrs ÷ 2,080/yr)`,
      chatPrompts: [
        "How have teams redeployed the freed capacity?",
        "Compare run rate FTE impact to our initial projections",
        "What's the measured productivity gain from these FTE savings?"
      ]
    },
    {
      label: 'Run Rate Studies Completed',
      value: formatNumber(summary.actual.totalStudies || 0),
      icon: FileText,
      color: 'emerald',
      subtext: 'Completed analyses',
      chatPrompts: [
        "Show me the recent studies and their key findings",
        "Which agents need more studies for better validation?",
        "What patterns are emerging from completed studies?"
      ]
    },
    {
      label: 'Avg Savings/Agent',
      value: formatCurrency(summary.actual.avgSavingsPerAgent),
      icon: TrendingUp,
      color: 'emerald',
      subtext: 'Per AI agent measured',
      chatPrompts: [
        "Which agent categories have the best average ROI?",
        "Compare average savings across different deployment types",
        "What factors contribute to higher average savings per agent?"
      ]
    }
  ];


  return (
    <div className="space-y-6 sm:space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div className="flex-1">
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900">Executive Dashboard</h2>
          <p className="text-sm sm:text-base text-slate-600 mt-1 sm:mt-2">Time & Money Impact</p>
          <div className="mt-3">
            <DivisionSelector
              value={selectedDivision}
              onChange={setSelectedDivision}
              showAllOption={true}
              showUnassignedOption={true}
            />
          </div>
        </div>

        <div className="flex items-center space-x-2 bg-slate-50 rounded-xl border border-slate-200 p-1.5 w-full sm:w-auto shadow-inner-soft">
          <button
            onClick={() => setViewMode('runrate')}
            className={`flex-1 sm:flex-none px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-medium transition-all duration-200 ${
              viewMode === 'runrate'
                ? 'bg-gradient-to-r from-accent-600 to-accent-500 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white'
            }`}
            disabled={!summary.hasProjectedData}
          >
            Projections
          </button>
          <ButtonTooltip
            content="No validation studies or actuals yet. Complete a study to enable this view."
            showTooltip={summary.hasProjectedData && !summary.hasActualData}
          >
            <button
              onClick={() => setViewMode('actual')}
              className={`flex-1 sm:flex-none px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-medium transition-all duration-200 ${
                viewMode === 'actual'
                  ? 'bg-gradient-to-r from-success-600 to-success-500 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white'
              }`}
              disabled={!summary.hasActualData}
            >
              Run Rate
            </button>
          </ButtonTooltip>
          <button
            onClick={() => setViewMode('combined')}
            className={`flex-1 sm:flex-none px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-medium transition-all duration-200 ${
              viewMode === 'combined'
                ? 'bg-gradient-to-r from-slate-700 to-slate-600 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white'
            }`}
          >
            Combined
          </button>
        </div>
      </div>

      {showProjections && !summary.hasProjectedData && (
        <div className="bg-gradient-to-br from-accent-50 to-accent-100/50 border border-accent-200 rounded-2xl p-8 text-center shadow-soft animate-in">
          <div className="inline-flex p-4 bg-white rounded-2xl shadow-sm mb-4">
            <Target className="w-12 h-12 text-accent-500" />
          </div>
          <h3 className="text-lg font-semibold text-slate-900 mb-2">No Projection Data Available</h3>
          <p className="text-slate-600">Add projection variables to your agents to see annualized impact estimates.</p>
        </div>
      )}

      {showProjections && summary.hasProjectedData && (
        <div>
          <div className="flex items-center space-x-2 mb-4">
            <Target className="w-5 h-5 text-blue-600" />
            <h3 className="text-xl font-bold text-slate-900">Projections Annual Impact</h3>
            <span className="px-2 py-1 bg-blue-50 text-blue-700 text-xs font-medium rounded">Annualized Estimates</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {projectionStats.map((stat, index) => {
              const Icon = stat.icon;
              const variance = canCompare && stat.actual !== undefined && stat.projected !== undefined
                ? getVariance(stat.actual, stat.projected)
                : null;

              const drillDownType: DrillDownType = index === 0 ? 'runrate-agents' : index === 1 ? 'runrate-time' : index === 2 ? 'runrate-cost' : 'runrate-fte';

              const validationRate = stat.showValidation && stat.projected !== undefined && stat.projected > 0
                ? (stat.actual || 0) / stat.projected
                : null;

              const getValidationColor = (rate: number): string => {
                if (rate >= 0.75) return 'text-emerald-600';
                if (rate >= 0.5) return 'text-amber-600';
                return 'text-rose-600';
              };

              const selectedPrompt = stat.chatPrompts?.[index % (stat.chatPrompts?.length || 1)] || '';

              return (
                <div
                  key={stat.label}
                  className="bg-white rounded-xl shadow-sm border border-blue-200 hover:shadow-lg hover:border-blue-300 transition-all overflow-hidden group"
                >
                  <button
                    onClick={() => handleDrillDown(drillDownType, stat.label)}
                    className="p-4 sm:p-6 text-left w-full cursor-pointer"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <p className="text-xs sm:text-sm font-medium text-slate-600 group-hover:text-blue-700 transition-colors">{stat.label}</p>
                        <p className="text-2xl sm:text-3xl font-bold text-slate-900 mt-1 sm:mt-2 break-words">{stat.value}</p>
                        <p className="text-xs sm:text-sm text-slate-500 mt-1">{stat.subtext}</p>
                        {canCompare && viewMode === 'combined' && stat.showValidation && validationRate !== null && (
                          <p className={`text-xs font-semibold mt-2 ${getValidationColor(validationRate)}`}>
                            {stat.actual || 0}/{stat.projected} Agents Validated
                          </p>
                        )}
                        {canCompare && viewMode === 'combined' && !stat.showValidation && variance !== null && (
                          <p className={`text-xs font-semibold mt-2 ${getVarianceColor(variance)}`}>
                            {variance >= 0
                              ? `Run rate exceeds projection by ${variance.toFixed(1)}%`
                              : `Projection exceeds run rate by ${Math.abs(variance).toFixed(1)}%`
                            }
                          </p>
                        )}
                        <p className="text-xs text-blue-600 mt-2 opacity-0 group-hover:opacity-100 transition-opacity hidden sm:block">Click to view details →</p>
                      </div>
                      <div className={`p-2 sm:p-3 rounded-lg bg-blue-50 text-blue-600 group-hover:bg-blue-100 transition-colors flex-shrink-0`}>
                        <Icon className="w-5 h-5 sm:w-6 sm:h-6" />
                      </div>
                    </div>
                  </button>

                  {selectedPrompt && onChatPromptTrigger && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onChatPromptTrigger(selectedPrompt);
                      }}
                      className="w-full px-4 py-3 border-t border-blue-100 bg-blue-50/30 hover:bg-blue-50 transition-colors flex items-center space-x-2 group/prompt min-h-[44px]"
                    >
                      <MessageCircle className="w-4 h-4 text-blue-600 flex-shrink-0" />
                      <span className="text-xs text-blue-700 text-left flex-1 group-hover/prompt:text-blue-800 transition-colors">
                        {selectedPrompt}
                      </span>
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {showRunRate && !summary.hasActualData && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-8 text-center">
          <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto mb-3" />
          <h3 className="text-lg font-semibold text-slate-900 mb-2">No Run Rate Data Available</h3>
          <p className="text-slate-600">Complete studies to see measured impact from real-world usage.</p>
        </div>
      )}

      {showRunRate && summary.hasActualData && (
        <div>
          <div className="flex items-center space-x-2 mb-4">
            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            <h3 className="text-xl font-bold text-slate-900">Run Rate Measured Impact</h3>
            <span className="px-2 py-1 bg-emerald-50 text-emerald-700 text-xs font-medium rounded">From Completed Studies</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {runRateStats.map((stat, index) => {
              const Icon = stat.icon;

              const drillDownType: DrillDownType = index === 0 ? 'actual-time' : index === 1 ? 'actual-cost' : index === 2 ? 'actual-time' : index === 3 ? 'actual-studies' : index === 4 ? 'actual-agents' : 'actual-cost';

              const selectedPrompt = stat.chatPrompts?.[index % (stat.chatPrompts?.length || 1)] || '';

              return (
                <div
                  key={stat.label}
                  className="bg-white rounded-xl shadow-sm border border-emerald-200 hover:shadow-lg hover:border-emerald-300 transition-all overflow-hidden group"
                >
                  <button
                    onClick={() => handleDrillDown(drillDownType, stat.label)}
                    className="p-4 sm:p-6 text-left w-full cursor-pointer"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <p className="text-xs sm:text-sm font-medium text-slate-600 group-hover:text-emerald-700 transition-colors">{stat.label}</p>
                        <p className="text-2xl sm:text-3xl font-bold text-slate-900 mt-1 sm:mt-2 break-words">{stat.value}</p>
                        <p className="text-xs sm:text-sm text-slate-500 mt-1">{stat.subtext}</p>
                        <p className="text-xs text-emerald-600 mt-2 opacity-0 group-hover:opacity-100 transition-opacity hidden sm:block">Click to view details →</p>
                      </div>
                      <div className={`p-2 sm:p-3 rounded-lg bg-emerald-50 text-emerald-600 group-hover:bg-emerald-100 transition-colors flex-shrink-0`}>
                        <Icon className="w-5 h-5 sm:w-6 sm:h-6" />
                      </div>
                    </div>
                  </button>

                  {selectedPrompt && onChatPromptTrigger && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onChatPromptTrigger(selectedPrompt);
                      }}
                      className="w-full px-4 py-3 border-t border-emerald-100 bg-emerald-50/30 hover:bg-emerald-50 transition-colors flex items-center space-x-2 group/prompt min-h-[44px]"
                    >
                      <MessageCircle className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                      <span className="text-xs text-emerald-700 text-left flex-1 group-hover/prompt:text-emerald-800 transition-colors">
                        {selectedPrompt}
                      </span>
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {!summary.hasProjectedData && !summary.hasActualData && (
        <div className="bg-slate-50 rounded-xl border border-slate-200 p-12 text-center">
          <Activity className="w-16 h-16 text-slate-400 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-slate-900 mb-2">No Data Available</h3>
          <p className="text-slate-600 mb-6">Get started by adding AI agents with projection variables or conducting run rate studies.</p>
          <div className="flex items-center justify-center space-x-4">
            <button className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium">
              Add Agent
            </button>
            <button className="px-6 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors font-medium">
              Add Study
            </button>
          </div>
        </div>
      )}

      {canCompare && viewMode === 'combined' && (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <div className="flex items-center space-x-2 mb-4">
            <Activity className="w-5 h-5 text-violet-600" />
            <h3 className="text-lg font-semibold text-slate-900">Projections vs Run Rate Comparison</h3>
          </div>
          <div className="space-y-4">
            <div className="flex justify-between items-center p-4 bg-slate-50 rounded-lg">
              <div className="flex-1">
                <p className="font-medium text-slate-900">Time Saved Performance</p>
                <p className="text-sm text-slate-600">Run Rate vs Projected annual hours</p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-slate-900">
                  {summary.projected.totalTimeSaved > 0 ? ((summary.actual.totalTimeSaved / summary.projected.totalTimeSaved) * 100).toFixed(1) : 0}%
                </p>
                <p className="text-sm text-slate-500">
                  {formatHours(summary.actual.totalTimeSaved)} / {formatHours(summary.projected.totalTimeSaved)}
                </p>
              </div>
            </div>

            <div className="flex justify-between items-center p-4 bg-slate-50 rounded-lg">
              <div className="flex-1">
                <p className="font-medium text-slate-900">Cost Savings Performance</p>
                <p className="text-sm text-slate-600">Run Rate vs Projected annual savings</p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-slate-900">
                  {summary.projected.totalSavings > 0 ? ((summary.actual.totalSavings / summary.projected.totalSavings) * 100).toFixed(1) : 0}%
                </p>
                <p className="text-sm text-slate-500">
                  {formatCurrency(summary.actual.totalSavings)} / {formatCurrency(summary.projected.totalSavings)}
                </p>
              </div>
            </div>

            <div className="flex justify-between items-center p-4 bg-slate-50 rounded-lg">
              <div className="flex-1">
                <p className="font-medium text-slate-900">Agent Validation Rate</p>
                <p className="text-sm text-slate-600">Agents with run rate studies vs projection estimates</p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-slate-900">
                  {summary.projected.activeAgents > 0 ? ((summary.actual.activeAgents / summary.projected.activeAgents) * 100).toFixed(1) : 0}%
                </p>
                <p className="text-sm text-slate-500">
                  {summary.actual.activeAgents} / {summary.projected.activeAgents} validated
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {(summary.hasProjectedData || summary.hasActualData) && (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <h3 className="text-lg font-semibold text-slate-900 mb-4">Workforce Impact Analysis</h3>
          <div className="space-y-4">
            {showProjections && summary.hasProjectedData && (
              <div className="flex justify-between items-center p-4 bg-blue-50 rounded-lg">
                <div>
                  <p className="font-medium text-slate-900">Projected Hours for Redeployment</p>
                  <p className="text-sm text-slate-600">Time that can be redirected to higher-value work</p>
                </div>
                <p className="text-2xl font-bold text-blue-600">{formatHours(summary.projected.totalTimeSaved)}</p>
              </div>
            )}

            {showRunRate && summary.hasActualData && (
              <div className="flex justify-between items-center p-4 bg-emerald-50 rounded-lg">
                <div>
                  <p className="font-medium text-slate-900">Run Rate Hours Saved</p>
                  <p className="text-sm text-slate-600">Measured time savings from studies</p>
                </div>
                <p className="text-2xl font-bold text-emerald-600">{formatHours(summary.actual.totalTimeSaved)}</p>
              </div>
            )}

            {showProjections && summary.hasProjectedData && (
              <div className="flex justify-between items-center p-4 bg-slate-50 rounded-lg">
                <div>
                  <p className="font-medium text-slate-900">Projected Staffing Impact</p>
                  <p className="text-sm text-slate-600">Based on 2,080 working hours per year</p>
                </div>
                <p className="text-2xl font-bold text-blue-600">{calculateFTE(summary.projected.totalTimeSaved).toFixed(2)} FTE</p>
              </div>
            )}

            {showRunRate && summary.hasActualData && summary.actual.totalStudies && summary.actual.totalStudies > 0 && (
              <div className="flex justify-between items-center p-4 bg-slate-50 rounded-lg">
                <div>
                  <p className="font-medium text-slate-900">Run Rate ROI per Study</p>
                  <p className="text-sm text-slate-600">Average cost savings measured per analysis</p>
                </div>
                <p className="text-2xl font-bold text-emerald-600">
                  {formatCurrency(summary.actual.totalSavings / summary.actual.totalStudies)}
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {(summary.hasProjectedData || summary.hasActualData) && (
        <div className={`bg-gradient-to-br rounded-xl border p-6 ${
          canCompare
            ? 'from-violet-50 to-blue-50 border-violet-200'
            : summary.hasActualData
            ? 'from-emerald-50 to-teal-50 border-emerald-200'
            : 'from-blue-50 to-sky-50 border-blue-200'
        }`}>
          <div className="flex items-start space-x-4">
            <div className="p-3 bg-white rounded-lg shadow-sm">
              <TrendingUp className={`w-8 h-8 ${
                canCompare ? 'text-violet-600' : summary.hasActualData ? 'text-emerald-600' : 'text-blue-600'
              }`} />
            </div>
            <div>
              <h3 className="text-xl font-bold text-slate-900">Key Insights</h3>
              <div className="mt-3 space-y-2 text-slate-700">
                {canCompare && (
                  <>
                    <p>
                      You have <span className="font-semibold text-blue-700">{summary.projected.activeAgents} agents with projections</span> expecting{' '}
                      <span className="font-semibold text-blue-700">{formatHours(summary.projected.totalTimeSaved)} hours</span> saved annually worth{' '}
                      <span className="font-semibold text-blue-700">{formatCurrency(summary.projected.totalSavings)}</span>.
                    </p>
                    <p>
                      Run rate measurements from <span className="font-semibold text-emerald-700">{summary.actual.totalStudies} studies</span> show{' '}
                      <span className="font-semibold text-emerald-700">{formatHours(summary.actual.totalTimeSaved)} hours</span> saved worth{' '}
                      <span className="font-semibold text-emerald-700">{formatCurrency(summary.actual.totalSavings)}</span>, achieving{' '}
                      <span className="font-semibold">{summary.projected.totalTimeSaved > 0 ? ((summary.actual.totalTimeSaved / summary.projected.totalTimeSaved) * 100).toFixed(1) : 0}%</span> of projected performance.
                    </p>
                    <p>
                      <span className="font-semibold">{summary.actual.activeAgents} of {summary.projected.activeAgents} agents</span> have been validated with run rate studies.{' '}
                      {summary.actual.activeAgents < summary.projected.activeAgents && (
                        <span>Consider conducting studies for the remaining agents to validate projections.</span>
                      )}
                    </p>
                  </>
                )}
                {!canCompare && summary.hasActualData && (
                  <>
                    <p>
                      AI agents have a run rate of <span className="font-semibold text-emerald-700">{formatHours(summary.actual.totalTimeSaved)} hours</span> saved across{' '}
                      <span className="font-semibold">{summary.actual.totalStudies} studies</span>, resulting in{' '}
                      <span className="font-semibold text-emerald-700">{formatCurrency(summary.actual.totalSavings)}</span> in measured cost savings.
                    </p>
                    <p>
                      This represents <span className="font-semibold">{(summary.actual.fteEquivalent * 100).toFixed(1)}%</span> of a full-time employee's annual capacity,
                      creating opportunities for workforce redeployment to strategic initiatives.
                    </p>
                  </>
                )}
                {!canCompare && summary.hasProjectedData && !summary.hasActualData && (
                  <>
                    <p>
                      You have <span className="font-semibold text-blue-700">{summary.projected.activeAgents} AI agents</span> with projections
                      expecting to save <span className="font-semibold text-blue-700">{formatHours(summary.projected.totalTimeSaved)} hours</span> annually,
                      worth <span className="font-semibold text-blue-700">{formatCurrency(summary.projected.totalSavings)}</span> in potential cost savings.
                    </p>
                    <p>
                      This represents <span className="font-semibold">{(summary.projected.fteEquivalent * 100).toFixed(1)}%</span> of a full-time employee's annual capacity.
                      Conduct studies to validate these projections with run rate measurements.
                    </p>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {goals.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <Target className="w-5 h-5 text-emerald-600" />
              <h3 className="text-lg font-semibold text-slate-900">Active Goals Progress</h3>
            </div>
            <a
              href="#"
              onClick={(e) => {
                e.preventDefault();
                window.location.hash = 'goals';
              }}
              className="text-sm text-emerald-600 hover:text-emerald-700 font-medium"
            >
              View All Goals →
            </a>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {goals.slice(0, 4).map(goal => {
              const progress = goalService.calculateProgress(goal);
              const daysRemaining = goalService.getDaysRemaining(goal);

              return (
                <div
                  key={goal.id}
                  className={`p-4 rounded-lg border-2 ${
                    goal.status === 'on_track' ? 'border-emerald-200 bg-emerald-50' :
                    goal.status === 'at_risk' ? 'border-amber-200 bg-amber-50' :
                    'border-rose-200 bg-rose-50'
                  }`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <p className="font-semibold text-slate-900 text-sm">
                        {goalService.getGoalTypeLabel(goal.goal_type)}
                      </p>
                      {goal.agents && (
                        <p className="text-xs text-slate-600">{goal.agents.name}</p>
                      )}
                      {!goal.agents && (
                        <p className="text-xs text-slate-600">Organization-wide</p>
                      )}
                      <div className="flex items-center space-x-2 mt-1">
                        <span className={`px-2 py-0.5 ${goal.data_source === 'projected' ? 'bg-blue-100 text-blue-700' : 'bg-emerald-100 text-emerald-700'} text-xs font-medium rounded`}>
                          {goal.data_source === 'projected' ? 'Projections' : 'Run Rate'}
                        </span>
                        {goal.status === 'at_risk' && (
                          <span className="flex items-center text-xs text-amber-700">
                            <AlertCircle className="w-3 h-3 mr-1" />
                            At Risk
                          </span>
                        )}
                        {goal.status === 'behind' && (
                          <span className="flex items-center text-xs text-rose-700">
                            <AlertCircle className="w-3 h-3 mr-1" />
                            Behind
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-slate-900">{progress.toFixed(0)}%</p>
                      {daysRemaining >= 0 && (
                        <p className="text-xs text-slate-500">{daysRemaining}d left</p>
                      )}
                    </div>
                  </div>
                  <div className="w-full bg-slate-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full transition-all ${
                        goal.status === 'on_track' ? 'bg-emerald-600' :
                        goal.status === 'at_risk' ? 'bg-amber-600' :
                        'bg-rose-600'
                      }`}
                      style={{ width: `${Math.min(100, progress)}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
          {goals.length > 4 && (
            <p className="text-center text-sm text-slate-500 mt-4">
              Showing 4 of {goals.length} active goals
            </p>
          )}
        </div>
      )}

      <DrillDownModal
        isOpen={drillDownModal.isOpen}
        onClose={closeDrillDown}
        title={drillDownModal.title}
        type={drillDownModal.type || 'projected-agents'}
        data={drillDownModal.data}
      />

      <QuoteFooter />
    </div>
  );
}
