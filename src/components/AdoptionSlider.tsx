import { useState, useEffect } from 'react';
import { Users, TrendingUp, DollarSign, Clock } from 'lucide-react';
import { calculateAdoptionScenario, formatCurrency, formatHours, calculateFTE } from '../utils/calculations';

interface AdoptionSliderProps {
  avgTimeWithoutAgentMinutes: number;
  avgTimeWithAgentMinutes: number;
  avgUsageCount: number;
  usageDiscountPercent: number;
  avgHourlyWage: number;
  currentAdoptionRate: number;
  targetUserBase: number;
  currentActiveUsers: number;
  onAdoptionChange?: (adoptionRate: number) => void;
  showComparison?: boolean;
}

export function AdoptionSlider({
  avgTimeWithoutAgentMinutes,
  avgTimeWithAgentMinutes,
  avgUsageCount,
  usageDiscountPercent,
  avgHourlyWage,
  currentAdoptionRate,
  targetUserBase,
  currentActiveUsers,
  onAdoptionChange,
  showComparison = true
}: AdoptionSliderProps) {
  const [sliderValue, setSliderValue] = useState(currentAdoptionRate);
  const [manualInput, setManualInput] = useState(currentAdoptionRate.toString());

  useEffect(() => {
    setSliderValue(currentAdoptionRate);
    setManualInput(currentAdoptionRate.toFixed(1));
  }, [currentAdoptionRate]);

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(e.target.value);
    setSliderValue(value);
    setManualInput(value.toFixed(1));
    onAdoptionChange?.(value);
  };

  const handleManualInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setManualInput(value);

    const numValue = parseFloat(value);
    if (!isNaN(numValue) && numValue >= 0 && numValue <= 100) {
      setSliderValue(numValue);
      onAdoptionChange?.(numValue);
    }
  };

  const handleReset = () => {
    setSliderValue(currentAdoptionRate);
    setManualInput(currentAdoptionRate.toFixed(1));
    onAdoptionChange?.(currentAdoptionRate);
  };

  const currentImpact = calculateAdoptionScenario({
    avgTimeWithoutAgentMinutes,
    avgTimeWithAgentMinutes,
    avgUsageCount,
    usageDiscountPercent,
    avgHourlyWage,
    scenarioAdoptionPercent: currentAdoptionRate
  });

  const sliderImpact = calculateAdoptionScenario({
    avgTimeWithoutAgentMinutes,
    avgTimeWithAgentMinutes,
    avgUsageCount,
    usageDiscountPercent,
    avgHourlyWage,
    scenarioAdoptionPercent: sliderValue
  });

  const potentialImpact = calculateAdoptionScenario({
    avgTimeWithoutAgentMinutes,
    avgTimeWithAgentMinutes,
    avgUsageCount,
    usageDiscountPercent,
    avgHourlyWage,
    scenarioAdoptionPercent: 100
  });

  const isAtCurrent = Math.abs(sliderValue - currentAdoptionRate) < 0.1;
  const usersAtSliderValue = Math.round((targetUserBase * sliderValue) / 100);

  const getAdoptionColor = (rate: number) => {
    if (rate < 33) return 'text-red-600';
    if (rate < 67) return 'text-amber-600';
    return 'text-emerald-600';
  };

  const getAdoptionBgColor = (rate: number) => {
    if (rate < 33) return 'bg-red-50';
    if (rate < 67) return 'bg-amber-50';
    return 'bg-emerald-50';
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg border border-slate-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h4 className="text-lg font-semibold text-slate-900">Adoption Rate</h4>
            <p className="text-sm text-slate-600">
              {currentActiveUsers} of {targetUserBase} target users
            </p>
          </div>
          <div className="flex items-center space-x-3">
            <input
              type="number"
              min="0"
              max="100"
              step="0.1"
              value={manualInput}
              onChange={handleManualInputChange}
              className="w-20 px-3 py-2 border border-slate-300 rounded-lg text-center font-semibold text-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
            />
            <span className="text-2xl font-bold text-slate-900">%</span>
            {!isAtCurrent && (
              <button
                onClick={handleReset}
                className="px-3 py-2 text-sm bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors"
              >
                Reset
              </button>
            )}
          </div>
        </div>

        <div className="relative">
          <input
            type="range"
            min="0"
            max="100"
            step="0.1"
            value={sliderValue}
            onChange={handleSliderChange}
            className="w-full h-3 bg-slate-200 rounded-lg appearance-none cursor-pointer"
            style={{
              background: `linear-gradient(to right,
                #ef4444 0%,
                #f59e0b 33%,
                #10b981 67%,
                #10b981 ${sliderValue}%,
                #e2e8f0 ${sliderValue}%)`
            }}
          />
          <div className="flex justify-between mt-2 text-xs text-slate-500">
            <span>0%</span>
            <span>25%</span>
            <span>50%</span>
            <span>75%</span>
            <span>100%</span>
          </div>
        </div>

        <div className={`mt-4 p-3 ${getAdoptionBgColor(sliderValue)} rounded-lg`}>
          <div className="flex items-center space-x-2">
            <Users className={`w-5 h-5 ${getAdoptionColor(sliderValue)}`} />
            <span className="font-semibold text-slate-900">
              At {sliderValue.toFixed(1)}% adoption: {usersAtSliderValue} users
            </span>
          </div>
        </div>
      </div>

      {showComparison && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-blue-50 rounded-lg border border-blue-200 p-4">
            <h5 className="text-sm font-semibold text-slate-700 mb-3 flex items-center space-x-2">
              <span>Current Impact</span>
              <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
                {currentAdoptionRate.toFixed(0)}%
              </span>
            </h5>
            <div className="space-y-3">
              <div>
                <p className="text-xs text-slate-600 flex items-center space-x-1">
                  <Clock className="w-3 h-3" />
                  <span>Annual Time Saved</span>
                </p>
                <p className="text-lg font-bold text-blue-700">
                  {formatHours(currentImpact.annualTimeSavedHours)}h
                </p>
              </div>
              <div>
                <p className="text-xs text-slate-600 flex items-center space-x-1">
                  <DollarSign className="w-3 h-3" />
                  <span>Annual Cost Savings</span>
                </p>
                <p className="text-lg font-bold text-blue-700">
                  {formatCurrency(currentImpact.annualCostSavings)}
                </p>
              </div>
              <div>
                <p className="text-xs text-slate-600 flex items-center space-x-1">
                  <Users className="w-3 h-3" />
                  <span>FTE Equivalent</span>
                </p>
                <p className="text-lg font-bold text-blue-700">
                  {currentImpact.fteEquivalent.toFixed(2)}
                </p>
              </div>
            </div>
          </div>

          <div className={`rounded-lg border p-4 ${
            isAtCurrent
              ? 'bg-slate-50 border-slate-200'
              : 'bg-gradient-to-br from-emerald-50 to-teal-50 border-emerald-200'
          }`}>
            <h5 className="text-sm font-semibold text-slate-700 mb-3 flex items-center space-x-2">
              <TrendingUp className="w-4 h-4" />
              <span>Slider Preview</span>
              <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-1 rounded">
                {sliderValue.toFixed(0)}%
              </span>
            </h5>
            <div className="space-y-3">
              <div>
                <p className="text-xs text-slate-600 flex items-center space-x-1">
                  <Clock className="w-3 h-3" />
                  <span>Annual Time Saved</span>
                </p>
                <p className="text-lg font-bold text-emerald-700">
                  {formatHours(sliderImpact.annualTimeSavedHours)}h
                </p>
                {!isAtCurrent && (
                  <p className="text-xs text-emerald-600">
                    +{formatHours(sliderImpact.annualTimeSavedHours - currentImpact.annualTimeSavedHours)}h
                  </p>
                )}
              </div>
              <div>
                <p className="text-xs text-slate-600 flex items-center space-x-1">
                  <DollarSign className="w-3 h-3" />
                  <span>Annual Cost Savings</span>
                </p>
                <p className="text-lg font-bold text-emerald-700">
                  {formatCurrency(sliderImpact.annualCostSavings)}
                </p>
                {!isAtCurrent && (
                  <p className="text-xs text-emerald-600">
                    +{formatCurrency(sliderImpact.annualCostSavings - currentImpact.annualCostSavings)}
                  </p>
                )}
              </div>
              <div>
                <p className="text-xs text-slate-600 flex items-center space-x-1">
                  <Users className="w-3 h-3" />
                  <span>FTE Equivalent</span>
                </p>
                <p className="text-lg font-bold text-emerald-700">
                  {sliderImpact.fteEquivalent.toFixed(2)}
                </p>
                {!isAtCurrent && (
                  <p className="text-xs text-emerald-600">
                    +{(sliderImpact.fteEquivalent - currentImpact.fteEquivalent).toFixed(2)}
                  </p>
                )}
              </div>
            </div>
          </div>

          <div className="bg-violet-50 rounded-lg border border-violet-200 p-4">
            <h5 className="text-sm font-semibold text-slate-700 mb-3 flex items-center space-x-2">
              <span>Full Potential</span>
              <span className="text-xs bg-violet-100 text-violet-700 px-2 py-1 rounded">
                100%
              </span>
            </h5>
            <div className="space-y-3">
              <div>
                <p className="text-xs text-slate-600 flex items-center space-x-1">
                  <Clock className="w-3 h-3" />
                  <span>Annual Time Saved</span>
                </p>
                <p className="text-lg font-bold text-violet-700">
                  {formatHours(potentialImpact.annualTimeSavedHours)}h
                </p>
                <p className="text-xs text-violet-600">
                  +{formatHours(potentialImpact.annualTimeSavedHours - currentImpact.annualTimeSavedHours)}h opportunity
                </p>
              </div>
              <div>
                <p className="text-xs text-slate-600 flex items-center space-x-1">
                  <DollarSign className="w-3 h-3" />
                  <span>Annual Cost Savings</span>
                </p>
                <p className="text-lg font-bold text-violet-700">
                  {formatCurrency(potentialImpact.annualCostSavings)}
                </p>
                <p className="text-xs text-violet-600">
                  +{formatCurrency(potentialImpact.annualCostSavings - currentImpact.annualCostSavings)} opportunity
                </p>
              </div>
              <div>
                <p className="text-xs text-slate-600 flex items-center space-x-1">
                  <Users className="w-3 h-3" />
                  <span>FTE Equivalent</span>
                </p>
                <p className="text-lg font-bold text-violet-700">
                  {potentialImpact.fteEquivalent.toFixed(2)}
                </p>
                <p className="text-xs text-violet-600">
                  +{(potentialImpact.fteEquivalent - currentImpact.fteEquivalent).toFixed(2)} opportunity
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
