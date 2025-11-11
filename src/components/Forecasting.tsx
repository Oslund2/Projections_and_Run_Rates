import { useEffect, useState } from 'react';
import { TrendingUp, TrendingDown, BarChart3, Calendar, AlertCircle, CheckCircle, RefreshCw, Sparkles, Trash2, Database } from 'lucide-react';
import { trendService, type TrendData, type DataSourceInfo } from '../services/trendService';
import { agentService } from '../services/agentService';
import { formatCurrency, formatHours, formatNumber } from '../utils/calculations';
import { Tooltip } from './Tooltip';
import DivisionSelector from './DivisionSelector';
import { ConfirmModal } from './ConfirmModal';

type MetricType = 'time_saved' | 'cost_savings' | 'study_count';

export function Forecasting() {
  const [trendData, setTrendData] = useState<TrendData | null>(null);
  const [loading, setLoading] = useState(true);
  const [generatingData, setGeneratingData] = useState(false);
  const [snapshotMessage, setSnapshotMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [selectedMetric, setSelectedMetric] = useState<MetricType>('cost_savings');
  const [selectedAgent, setSelectedAgent] = useState<string | null>(null);
  const [selectedDivision, setSelectedDivision] = useState<string | null>(null);
  const [agents, setAgents] = useState<any[]>([]);
  const [forecastDays, setForecastDays] = useState(30);
  const [dataSourceInfo, setDataSourceInfo] = useState<DataSourceInfo | null>(null);
  const [showClearModal, setShowClearModal] = useState(false);
  const [clearModalConfig, setClearModalConfig] = useState<{
    title: string;
    message: string;
    action: () => Promise<void>;
  } | null>(null);

  useEffect(() => {
    loadAgents();
    loadDataSourceInfo();
  }, []);

  useEffect(() => {
    loadTrendData();
  }, [selectedMetric, selectedAgent, selectedDivision, forecastDays]);

  const loadAgents = async () => {
    try {
      const data = await agentService.getAll();
      setAgents(data);
    } catch (error) {
      console.error('Error loading agents:', error);
    }
  };

  const loadTrendData = async () => {
    setLoading(true);
    try {
      const data = await trendService.getTrendAnalysis(
        selectedAgent,
        selectedMetric,
        forecastDays,
        selectedDivision
      );
      setTrendData(data);
    } catch (error) {
      console.error('Error loading trend data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadDataSourceInfo = async () => {
    try {
      const info = await trendService.getDataSourceInfo();
      setDataSourceInfo(info);
    } catch (error) {
      console.error('Error loading data source info:', error);
    }
  };

  const handleGenerateSeedData = async () => {
    setGeneratingData(true);
    setSnapshotMessage(null);
    try {
      await trendService.generateSeedData(30);
      setSnapshotMessage({ type: 'success', text: '30 days of sample data generated successfully!' });
      await loadTrendData();
      await loadDataSourceInfo();
      setTimeout(() => setSnapshotMessage(null), 5000);
    } catch (error) {
      console.error('Error generating seed data:', error);
      setSnapshotMessage({ type: 'error', text: 'Failed to generate data. Please try again.' });
    } finally {
      setGeneratingData(false);
    }
  };

  const handleCreateSnapshot = async () => {
    setGeneratingData(true);
    setSnapshotMessage(null);
    try {
      await trendService.createSnapshot();
      setSnapshotMessage({ type: 'success', text: 'Daily snapshot created successfully!' });
      await loadTrendData();
      await loadDataSourceInfo();
      setTimeout(() => setSnapshotMessage(null), 5000);
    } catch (error) {
      console.error('Error creating snapshot:', error);
      setSnapshotMessage({ type: 'error', text: 'Failed to create snapshot. Please try again.' });
    } finally {
      setGeneratingData(false);
    }
  };

  const handleClearSyntheticData = () => {
    setClearModalConfig({
      title: 'Clear Synthetic Data',
      message: 'This will permanently delete all AI-generated sample data. Real snapshots from your time-motion studies will be preserved. This action cannot be undone.',
      action: async () => {
        await trendService.clearSyntheticData();
        setSnapshotMessage({ type: 'success', text: 'Synthetic data cleared successfully!' });
        await loadTrendData();
        await loadDataSourceInfo();
        setTimeout(() => setSnapshotMessage(null), 5000);
      },
    });
    setShowClearModal(true);
  };

  const handleClearAllData = () => {
    setClearModalConfig({
      title: 'Clear All Data',
      message: 'This will permanently delete ALL historical snapshots, including both synthetic and real data. This action cannot be undone. Are you sure you want to proceed?',
      action: async () => {
        await trendService.clearHistoricalData();
        setSnapshotMessage({ type: 'success', text: 'All historical data cleared successfully!' });
        await loadTrendData();
        await loadDataSourceInfo();
        setTimeout(() => setSnapshotMessage(null), 5000);
      },
    });
    setShowClearModal(true);
  };

  const handleConfirmClear = async () => {
    if (!clearModalConfig) return;
    setGeneratingData(true);
    try {
      await clearModalConfig.action();
      setShowClearModal(false);
      setClearModalConfig(null);
    } catch (error) {
      console.error('Error clearing data:', error);
      setSnapshotMessage({ type: 'error', text: 'Failed to clear data. Please try again.' });
    } finally {
      setGeneratingData(false);
    }
  };

  const formatValue = (value: number) => {
    switch (selectedMetric) {
      case 'time_saved':
        return formatHours(value);
      case 'cost_savings':
        return formatCurrency(value);
      case 'study_count':
        return formatNumber(value);
      default:
        return formatNumber(value);
    }
  };

  const getMetricLabel = () => {
    switch (selectedMetric) {
      case 'time_saved':
        return 'Time Saved (hours)';
      case 'cost_savings':
        return 'Cost Savings ($)';
      case 'study_count':
        return 'Study Count';
      default:
        return 'Metric';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
      </div>
    );
  }

  const currentValue = trendData?.historical[trendData.historical.length - 1]?.value || 0;
  const forecastedValue = trendData?.forecast[trendData.forecast.length - 1]?.value || 0;
  const growthRate = trendData?.statistics.growthRate || 0;
  const hasData = trendData && trendData.historical.length > 0;
  const hasEnoughData = trendData && trendData.historical.length >= 7;
  const dataQuality = trendData?.regression.rSquared || 0;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold text-slate-900">Forecasting & Trends</h2>
        <p className="text-slate-600 mt-2">Predictive analytics and historical trend analysis</p>
        {snapshotMessage && (
          <div className={`mt-3 p-3 rounded-lg flex items-center space-x-2 ${
            snapshotMessage.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
              : 'bg-rose-50 text-rose-800 border border-rose-200'
          }`}>
            {snapshotMessage.type === 'success' ? (
              <CheckCircle className="w-5 h-5 flex-shrink-0" />
            ) : (
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
            )}
            <span className="text-sm font-medium">{snapshotMessage.text}</span>
          </div>
        )}
      </div>

      {hasData && !hasEnoughData && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex items-start space-x-3">
          <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <h4 className="font-semibold text-amber-900 mb-1">Limited Historical Data</h4>
            <p className="text-sm text-amber-800">
              You have {trendData?.historical.length || 0} data point{(trendData?.historical.length || 0) !== 1 ? 's' : ''}.
              Forecasts are more reliable with at least 7-14 days of data. Continue collecting daily snapshots to improve accuracy.
            </p>
          </div>
        </div>
      )}

      {dataSourceInfo && (dataSourceInfo.hasSynthetic || dataSourceInfo.hasReal) && (
        <div className="bg-white rounded-lg border border-slate-200 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Database className="w-5 h-5 text-blue-600" />
              <div>
                <h4 className="font-semibold text-slate-900">Data Source</h4>
                <div className="flex items-center space-x-4 mt-1 text-sm">
                  {dataSourceInfo.hasSynthetic && (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                      {dataSourceInfo.syntheticCount} Synthetic
                    </span>
                  )}
                  {dataSourceInfo.hasReal && (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800">
                      {dataSourceInfo.realCount} Real
                    </span>
                  )}
                  <span className="text-slate-500">
                    Total: {dataSourceInfo.totalCount} snapshots
                  </span>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              {dataSourceInfo.hasSynthetic && (
                <button
                  onClick={handleClearSyntheticData}
                  disabled={generatingData}
                  className="px-3 py-1.5 text-sm border border-purple-300 text-purple-700 rounded-lg hover:bg-purple-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-1.5"
                  title="Clear only synthetic data"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Clear Synthetic</span>
                </button>
              )}
              <button
                onClick={handleClearAllData}
                disabled={generatingData}
                className="px-3 py-1.5 text-sm border border-rose-300 text-rose-700 rounded-lg hover:bg-rose-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-1.5"
                title="Clear all historical data"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Clear All</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {hasData && dataQuality < 0.5 && hasEnoughData && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-start space-x-3">
          <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <h4 className="font-semibold text-blue-900 mb-1">Variable Performance Detected</h4>
            <p className="text-sm text-blue-800">
              Your data shows high variability, which makes long-term predictions less certain.
              This is normal for new implementations or changing workflows. Use forecasts as general guidance.
            </p>
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl border border-slate-200 p-4">
        <div className="mb-4">
          <label className="block text-sm font-medium text-slate-700 mb-2">Division</label>
          <DivisionSelector
            value={selectedDivision}
            onChange={setSelectedDivision}
            showAllOption={true}
            showUnassignedOption={false}
          />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Metric</label>
            <select
              value={selectedMetric}
              onChange={e => setSelectedMetric(e.target.value as MetricType)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
            >
              <option value="cost_savings">Cost Savings</option>
              <option value="time_saved">Time Saved</option>
              <option value="study_count">Study Count</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Agent</label>
            <select
              value={selectedAgent || ''}
              onChange={e => setSelectedAgent(e.target.value || null)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
            >
              <option value="">Organization-wide</option>
              {agents.map(agent => (
                <option key={agent.id} value={agent.id}>{agent.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Forecast Period</label>
            <select
              value={forecastDays}
              onChange={e => setForecastDays(parseInt(e.target.value))}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
            >
              <option value={7}>7 days</option>
              <option value={30}>30 days</option>
              <option value={60}>60 days</option>
              <option value={90}>90 days</option>
              <option value={180}>180 days</option>
            </select>
          </div>

          <div className="flex items-end space-x-2">
            <button
              onClick={loadTrendData}
              disabled={generatingData}
              className="flex-1 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
            >
              <RefreshCw className={`w-4 h-4 ${generatingData ? 'animate-spin' : ''}`} />
              <span>Update</span>
            </button>
            <button
              onClick={handleCreateSnapshot}
              disabled={generatingData}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
              title="Create a snapshot of current data"
            >
              <Calendar className="w-4 h-4" />
              <span>Snapshot</span>
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center space-x-2">
              <BarChart3 className="w-5 h-5 text-slate-400" />
              <p className="text-sm text-slate-600">Current Value</p>
            </div>
            <Tooltip content="The most recent recorded value from your historical data. This represents run rate performance, not a prediction." />
          </div>
          <p className="text-2xl font-bold text-slate-900">{formatValue(currentValue)}</p>
        </div>

        <div className="bg-blue-50 rounded-xl border border-blue-200 p-6">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center space-x-2">
              <Calendar className="w-5 h-5 text-blue-600" />
              <p className="text-sm text-blue-700">Forecasted Value</p>
            </div>
            <Tooltip content="The predicted value at the end of your selected forecast period. This is calculated using statistical analysis of historical trends." />
          </div>
          <p className="text-2xl font-bold text-blue-900">{formatValue(forecastedValue)}</p>
        </div>

        <div className={`rounded-xl border p-6 ${
          growthRate >= 0 ? 'bg-emerald-50 border-emerald-200' : 'bg-rose-50 border-rose-200'
        }`}>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center space-x-2">
              {growthRate >= 0 ? (
                <TrendingUp className="w-5 h-5 text-emerald-600" />
              ) : (
                <TrendingDown className="w-5 h-5 text-rose-600" />
              )}
              <p className={`text-sm ${growthRate >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
                Growth Rate
              </p>
            </div>
            <Tooltip content="The percentage change from your first data point to your most recent. Positive means improvement, negative means decline." />
          </div>
          <p className={`text-2xl font-bold ${growthRate >= 0 ? 'text-emerald-900' : 'text-rose-900'}`}>
            {growthRate >= 0 ? '+' : ''}{growthRate.toFixed(1)}%
          </p>
        </div>

        <div className="bg-slate-50 rounded-xl border border-slate-200 p-6">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center space-x-2">
              <TrendingUp className="w-5 h-5 text-slate-400" />
              <p className="text-sm text-slate-600">Avg Daily Value</p>
            </div>
            <Tooltip content="The average (mean) value across all your historical data points. This helps you understand typical performance." />
          </div>
          <p className="text-2xl font-bold text-slate-900">
            {formatValue(trendData?.statistics.mean || 0)}
          </p>
        </div>
      </div>

      {trendData && trendData.historical.length > 0 && (
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <h3 className="text-lg font-bold text-slate-900 mb-4">{getMetricLabel()} Trend</h3>

          <div className="relative h-64 mb-4">
            <svg viewBox="0 0 800 250" className="w-full h-full">
              <defs>
                <linearGradient id="historicalGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#10b981" stopOpacity="0.3" />
                  <stop offset="100%" stopColor="#10b981" stopOpacity="0" />
                </linearGradient>
                <linearGradient id="forecastGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.2" />
                  <stop offset="100%" stopColor="#3b82f6" stopOpacity="0" />
                </linearGradient>
              </defs>

              {/* Grid lines */}
              {[0, 50, 100, 150, 200, 250].map(y => (
                <line
                  key={y}
                  x1="0"
                  y1={y}
                  x2="800"
                  y2={y}
                  stroke="#e2e8f0"
                  strokeWidth="1"
                />
              ))}

              {/* Historical data */}
              {trendData.historical.length > 1 && (() => {
                const allValues = [...trendData.historical, ...trendData.forecast].map(p => p.value);
                const maxValue = Math.max(...allValues) * 1.1;
                const minValue = Math.min(...allValues, 0);
                const range = maxValue - minValue;

                const historicalPoints = trendData.historical.map((point, i) => {
                  const x = (i / (trendData.historical.length + trendData.forecast.length - 1)) * 800;
                  const y = 250 - ((point.value - minValue) / range) * 250;
                  return `${x},${y}`;
                }).join(' ');

                const forecastStartX = ((trendData.historical.length - 1) / (trendData.historical.length + trendData.forecast.length - 1)) * 800;
                const forecastStartY = 250 - ((trendData.historical[trendData.historical.length - 1].value - minValue) / range) * 250;

                const forecastPoints = trendData.forecast.map((point, i) => {
                  const x = ((trendData.historical.length + i) / (trendData.historical.length + trendData.forecast.length - 1)) * 800;
                  const y = 250 - ((point.value - minValue) / range) * 250;
                  return `${x},${y}`;
                }).join(' ');

                const historicalArea = `${historicalPoints} ${historicalPoints.split(' ').reverse()[0].split(',')[0]},250 0,250`;
                const forecastArea = `${forecastStartX},${forecastStartY} ${forecastPoints} ${forecastPoints.split(' ').reverse()[0].split(',')[0]},250 ${forecastStartX},250`;

                return (
                  <>
                    {/* Historical area */}
                    <polygon
                      points={historicalArea}
                      fill="url(#historicalGradient)"
                    />
                    {/* Historical line */}
                    <polyline
                      points={historicalPoints}
                      fill="none"
                      stroke="#10b981"
                      strokeWidth="3"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />

                    {/* Forecast area */}
                    <polygon
                      points={forecastArea}
                      fill="url(#forecastGradient)"
                    />
                    {/* Forecast line */}
                    <polyline
                      points={`${forecastStartX},${forecastStartY} ${forecastPoints}`}
                      fill="none"
                      stroke="#3b82f6"
                      strokeWidth="3"
                      strokeDasharray="8,4"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </>
                );
              })()}
            </svg>
          </div>

          <div className="flex items-center justify-center space-x-6 text-sm">
            <div className="flex items-center space-x-2">
              <div className="w-4 h-0.5 bg-emerald-600"></div>
              <span className="text-slate-600">Historical Data</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-4 h-0.5 bg-blue-600 border-t-2 border-dashed border-blue-600"></div>
              <span className="text-slate-600">Forecast</span>
            </div>
          </div>
        </div>
      )}

      {trendData && (
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-slate-900">Statistical Summary</h3>
            {!hasEnoughData && (
              <div className="flex items-center space-x-2 text-amber-600 text-sm">
                <AlertCircle className="w-4 h-4" />
                <span>Limited data - forecasts may be less reliable</span>
              </div>
            )}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4 bg-slate-50 rounded-lg">
              <div className="flex items-center justify-between mb-1">
                <p className="text-sm text-slate-600">Mean Value</p>
                <Tooltip content="The average value across all data points. This is your typical performance level." />
              </div>
              <p className="text-xl font-bold text-slate-900">
                {formatValue(trendData.statistics.mean)}
              </p>
            </div>
            <div className="p-4 bg-slate-50 rounded-lg">
              <div className="flex items-center justify-between mb-1">
                <p className="text-sm text-slate-600">Variability</p>
                <Tooltip content="Standard deviation measures how much your values typically vary from the average. Lower numbers mean more consistent performance." />
              </div>
              <p className="text-xl font-bold text-slate-900">
                {formatValue(trendData.statistics.standardDeviation)}
              </p>
            </div>
            <div className="p-4 bg-slate-50 rounded-lg">
              <div className="flex items-center justify-between mb-1">
                <p className="text-sm text-slate-600">Consistency</p>
                <Tooltip content="Shows data stability as a percentage. Under 20% is very consistent, 20-40% is moderate, over 40% is highly variable." />
              </div>
              <p className="text-xl font-bold text-slate-900">
                {trendData.statistics.coefficientOfVariation.toFixed(1)}%
              </p>
            </div>
            <div className="p-4 bg-slate-50 rounded-lg">
              <div className="flex items-center justify-between mb-1">
                <p className="text-sm text-slate-600">Forecast Accuracy</p>
                <Tooltip content="R-Squared shows how well the trend line fits your data. Above 80% is excellent, 50-80% is good, below 50% means predictions are less reliable." />
              </div>
              <p className={`text-xl font-bold ${
                dataQuality > 0.8 ? 'text-emerald-600' : dataQuality > 0.5 ? 'text-amber-600' : 'text-rose-600'
              }`}>
                {(trendData.regression.rSquared * 100).toFixed(1)}%
              </p>
            </div>
          </div>

          <div className={`mt-6 p-4 rounded-lg border ${
            dataQuality > 0.8 ? 'bg-emerald-50 border-emerald-200' :
            dataQuality > 0.5 ? 'bg-blue-50 border-blue-200' :
            'bg-amber-50 border-amber-200'
          }`}>
            <h4 className={`text-sm font-semibold mb-2 ${
              dataQuality > 0.8 ? 'text-emerald-900' :
              dataQuality > 0.5 ? 'text-blue-900' :
              'text-amber-900'
            }`}>What This Means</h4>
            <p className={`text-sm ${
              dataQuality > 0.8 ? 'text-emerald-800' :
              dataQuality > 0.5 ? 'text-blue-800' :
              'text-amber-800'
            }`}>
              {trendData.regression.rSquared > 0.8 ? (
                '✓ Your data shows a strong, clear trend. The forecast predictions are highly reliable and you can confidently use them for planning.'
              ) : trendData.regression.rSquared > 0.5 ? (
                '○ Your data shows a moderate trend. The forecast gives a reasonable estimate, but consider it as guidance rather than certainty.'
              ) : (
                '⚠ Your data shows weak patterns or high variability. Collect more data points over time for more accurate forecasts.'
              )}
              {' '}
              Your performance consistency is{' '}
              {trendData.statistics.coefficientOfVariation < 20 ? 'excellent - very stable and predictable' :
               trendData.statistics.coefficientOfVariation < 40 ? 'moderate - some variation is normal' :
               'variable - results fluctuate significantly'}.
            </p>
          </div>
        </div>
      )}

      {(!trendData || trendData.historical.length === 0) && (
        <div className="bg-gradient-to-br from-blue-50 to-emerald-50 rounded-xl border-2 border-dashed border-slate-300 p-12">
          <div className="max-w-2xl mx-auto text-center">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-white rounded-full shadow-lg mb-6">
              <Sparkles className="w-10 h-10 text-emerald-600" />
            </div>
            <h3 className="text-2xl font-bold text-slate-900 mb-3">Start Forecasting Your AI ROI</h3>
            <p className="text-slate-600 mb-6 text-lg">
              Forecasting uses historical data to predict future performance. To get started, you need to create data snapshots.
            </p>

            <div className="bg-white rounded-lg p-6 mb-6 text-left shadow-sm">
              <h4 className="font-semibold text-slate-900 mb-3 flex items-center">
                <CheckCircle className="w-5 h-5 text-emerald-600 mr-2" />
                What You Can Do:
              </h4>
              <ul className="space-y-2 text-slate-700">
                <li className="flex items-start">
                  <span className="font-semibold mr-2 text-emerald-600">1.</span>
                  <span><strong>Generate Sample Data:</strong> Create 30 days of realistic demo data to explore forecasting features immediately</span>
                </li>
                <li className="flex items-start">
                  <span className="font-semibold mr-2 text-blue-600">2.</span>
                  <span><strong>Create Real Snapshot:</strong> Capture your current agent performance as a single data point</span>
                </li>
                <li className="flex items-start">
                  <span className="font-semibold mr-2 text-slate-600">3.</span>
                  <span><strong>Schedule Daily Snapshots:</strong> Set up automated daily snapshots to build historical data over time</span>
                </li>
              </ul>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={handleGenerateSeedData}
                disabled={generatingData}
                className="px-6 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2 font-medium shadow-md hover:shadow-lg"
              >
                {generatingData ? (
                  <RefreshCw className="w-5 h-5 animate-spin" />
                ) : (
                  <Sparkles className="w-5 h-5" />
                )}
                <span>Generate Sample Data</span>
              </button>
              <button
                onClick={handleCreateSnapshot}
                disabled={generatingData}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2 font-medium shadow-md hover:shadow-lg"
              >
                <Calendar className="w-5 h-5" />
                <span>Create Snapshot Now</span>
              </button>
            </div>

            <p className="text-sm text-slate-500 mt-6">
              <strong>Pro Tip:</strong> Forecasts become more accurate with more data points. Aim for at least 7-14 days of snapshots for reliable predictions.
            </p>
          </div>
        </div>
      )}

      <ConfirmModal
        isOpen={showClearModal}
        onClose={() => {
          setShowClearModal(false);
          setClearModalConfig(null);
        }}
        onConfirm={handleConfirmClear}
        title={clearModalConfig?.title || ''}
        message={clearModalConfig?.message || ''}
        confirmText="Delete"
        confirmButtonClass="bg-rose-600 hover:bg-rose-700"
        isProcessing={generatingData}
      />
    </div>
  );
}
