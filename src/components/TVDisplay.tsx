import { useEffect, useState } from 'react';
import { TrendingUp, Clock, Target, CheckCircle2, Users, Zap, Award, Activity } from 'lucide-react';
import { summaryService } from '../services/summaryService';
import { formatCurrency, formatHours, formatNumber } from '../utils/calculations';
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

export function TVDisplay() {
  const [summary, setSummary] = useState<GlobalSummary | null>(null);
  const [currentView, setCurrentView] = useState(0);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState(new Date());
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    console.log('TV Display: Component mounted');
    let isSubscribed = true;

    const loadInitialData = async () => {
      try {
        console.log('TV Display: Loading initial data...');
        const summaryData = await summaryService.getGlobalSummary(null);
        if (isSubscribed) {
          console.log('TV Display: Initial data loaded:', summaryData);
          setSummary(summaryData);
          setLastUpdate(new Date());
          setLoading(false);
          setError(null);
        }
      } catch (err) {
        if (isSubscribed) {
          console.error('TV Display: Error loading initial data:', err);
          setError(err instanceof Error ? err.message : 'Unknown error');
          setLoading(false);
        }
      }
    };

    loadInitialData();

    const refreshInterval = setInterval(() => {
      if (isSubscribed) {
        loadSummaryQuietly();
      }
    }, 30000);

    return () => {
      isSubscribed = false;
      clearInterval(refreshInterval);
    };
  }, []);

  useEffect(() => {
    const viewInterval = setInterval(() => {
      setCurrentView((prev) => (prev + 1) % 3);
    }, 10000);

    return () => clearInterval(viewInterval);
  }, []);

  const loadSummaryQuietly = async () => {
    try {
      console.log('TV Display: Refreshing data...');
      const summaryData = await summaryService.getGlobalSummary(null);
      console.log('TV Display: Data refreshed:', summaryData);
      setSummary(summaryData);
      setLastUpdate(new Date());
    } catch (err) {
      console.error('TV Display: Error refreshing data:', err);
    }
  };

  if (loading) {
    return (
      <div className="h-screen w-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-24 w-24 border-b-4 border-blue-400 mx-auto"></div>
          <p className="text-white text-3xl mt-8 font-semibold">Loading Dashboard...</p>
          <p className="text-blue-300 text-xl mt-4">This may take a few seconds...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-screen w-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center p-12">
        <div className="text-center max-w-4xl">
          <Activity className="w-32 h-32 text-red-400 mx-auto mb-8" />
          <h1 className="text-6xl font-bold text-white mb-6">Connection Error</h1>
          <p className="text-3xl text-red-200 mb-8">{error}</p>
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-8 border border-white/20">
            <p className="text-xl text-white">Please check your internet connection and try refreshing the page.</p>
          </div>
        </div>
      </div>
    );
  }

  if (!summary || (!summary.hasProjectedData && !summary.hasActualData)) {
    return (
      <div className="h-screen w-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center p-12">
        <div className="text-center max-w-4xl">
          <Activity className="w-32 h-32 text-blue-400 mx-auto mb-8 animate-pulse" />
          <h1 className="text-6xl font-bold text-white mb-6">AI Impact Dashboard</h1>
          <p className="text-3xl text-blue-200 mb-8">Waiting for data...</p>
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-8 border border-white/20">
            <p className="text-2xl text-white mb-4">To see data on this display:</p>
            <ul className="text-xl text-blue-200 space-y-3 text-left max-w-2xl mx-auto">
              <li>• Add AI agents with projection variables, or</li>
              <li>• Complete time & motion studies for existing agents</li>
              <li>• Data updates automatically every 30 seconds</li>
            </ul>
          </div>
          <p className="text-lg text-blue-300 mt-8">Last checked: {lastUpdate.toLocaleTimeString()}</p>
        </div>
      </div>
    );
  }

  const hasActual = summary.hasActualData;
  const hasProjected = summary.hasProjectedData;
  const data = summary.projected;
  const dataType = 'Projected Impact';

  console.log('TV Display: Rendering with projection data:', { data, dataType, hasActual, hasProjected });

  const views = [
    {
      title: 'AI Agents Driving Innovation',
      icon: Zap,
      cards: [
        {
          label: 'AI Agents in Use',
          value: formatNumber(data.activeAgents),
          subtext: 'Enhancing productivity',
          icon: Users,
          gradient: 'from-blue-500 to-cyan-500',
        },
        {
          label: 'Hours Redeployed',
          value: formatHours(data.totalTimeSaved),
          subtext: 'To strategic initiatives',
          icon: Clock,
          gradient: 'from-emerald-500 to-teal-500',
        },
        {
          label: 'Studies Completed',
          value: formatNumber(data.totalStudies || 0),
          subtext: 'Validation successes',
          icon: CheckCircle2,
          gradient: 'from-violet-500 to-purple-500',
        },
      ],
    },
    {
      title: 'Productivity Gains & Savings',
      icon: TrendingUp,
      cards: [
        {
          label: 'Cost Savings',
          value: formatCurrency(data.totalSavings),
          subtext: 'Annual value created',
          icon: Award,
          gradient: 'from-amber-500 to-orange-500',
        },
        {
          label: 'Time Per Agent',
          value: data.activeAgents > 0 ? formatHours(data.totalTimeSaved / data.activeAgents) : '0',
          subtext: 'Average hours saved',
          icon: Clock,
          gradient: 'from-emerald-500 to-teal-500',
        },
        {
          label: 'Value Per Agent',
          value: formatCurrency(data.avgSavingsPerAgent),
          subtext: 'Average ROI',
          icon: Target,
          gradient: 'from-blue-500 to-cyan-500',
        },
      ],
    },
    {
      title: 'Team Achievement Highlights',
      icon: Award,
      cards: [
        {
          label: 'Total Hours Redeployed',
          value: formatNumber(Math.round(data.totalTimeSaved)),
          subtext: 'For high-value work',
          icon: Clock,
          gradient: 'from-cyan-500 to-blue-500',
        },
        {
          label: 'Innovation Adoption',
          value: `${formatNumber(data.activeAgents)} Agents`,
          subtext: 'Technology enablement',
          icon: Zap,
          gradient: 'from-violet-500 to-purple-500',
        },
        {
          label: 'Efficiency Improvement',
          value: formatCurrency(data.totalSavings),
          subtext: 'Value unlocked',
          icon: TrendingUp,
          gradient: 'from-emerald-500 to-teal-500',
        },
      ],
    },
  ];

  const currentViewData = views[currentView];
  const ViewIcon = currentViewData.icon;

  return (
    <div className="h-screen w-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 overflow-hidden p-8">
      <div className="h-full flex flex-col">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-6">
            <div className="p-4 bg-white/10 rounded-2xl backdrop-blur-sm">
              <ViewIcon className="w-12 h-12 text-blue-300" />
            </div>
            <div>
              <h1 className="text-5xl font-bold text-white mb-2">{currentViewData.title}</h1>
              <div className="flex items-center space-x-4">
                <span className="px-4 py-2 bg-blue-500/20 text-blue-200 text-xl font-medium rounded-lg backdrop-blur-sm">
                  {dataType}
                </span>
                {hasActual && hasProjected && (
                  <span className="px-4 py-2 bg-emerald-500/20 text-emerald-200 text-xl font-medium rounded-lg backdrop-blur-sm">
                    Validated Data
                  </span>
                )}
              </div>
            </div>
          </div>
          <div className="text-right">
            <p className="text-blue-200 text-2xl font-medium">
              {lastUpdate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
            </p>
            <p className="text-blue-300 text-lg">Last Updated</p>
          </div>
        </div>

        <div className="flex-1 grid grid-cols-3 gap-8">
          {currentViewData.cards.map((card, index) => {
            const CardIcon = card.icon;
            return (
              <div
                key={index}
                className="bg-white/10 backdrop-blur-md rounded-3xl p-8 border border-white/20 shadow-2xl flex flex-col justify-between transform hover:scale-105 transition-all duration-300"
                style={{
                  animation: `fadeInUp 0.6s ease-out ${index * 0.2}s both`,
                }}
              >
                <div>
                  <div className={`inline-flex p-6 bg-gradient-to-br ${card.gradient} rounded-2xl mb-6 shadow-lg`}>
                    <CardIcon className="w-16 h-16 text-white" />
                  </div>
                  <h3 className="text-3xl font-semibold text-blue-100 mb-4">{card.label}</h3>
                </div>
                <div>
                  <p className="text-7xl font-bold text-white mb-4 leading-tight break-words">{card.value}</p>
                  <p className="text-2xl text-blue-200 font-medium">{card.subtext}</p>
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-8 flex justify-center space-x-3">
          {views.map((_, index) => (
            <div
              key={index}
              className={`h-3 rounded-full transition-all duration-300 ${
                index === currentView ? 'w-12 bg-blue-400' : 'w-3 bg-blue-600/40'
              }`}
            />
          ))}
        </div>

        <QuoteFooter tvMode={true} />
      </div>

      <style>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
}
