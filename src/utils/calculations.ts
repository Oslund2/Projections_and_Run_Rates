export interface StudyCalculationInputs {
  timeWithoutAiMinutes: number;
  timeWithAiMinutes: number;
  usageCount: number;
  usageDiscountPercent: number;
  costPerHour: number;
}

export interface StudyCalculationResults {
  timeSavedMinutes: number;
  netUsage: number;
  netTimeSavedHours: number;
  potentialSavings: number;
}

export function calculateStudyMetrics(inputs: StudyCalculationInputs): StudyCalculationResults {
  const timeSavedMinutes = inputs.timeWithoutAiMinutes - inputs.timeWithAiMinutes;

  const netUsage = inputs.usageCount * (1 - inputs.usageDiscountPercent / 100);

  const netTimeSavedHours = (timeSavedMinutes * netUsage) / 60;

  const potentialSavings = netTimeSavedHours * inputs.costPerHour;

  return {
    timeSavedMinutes,
    netUsage,
    netTimeSavedHours,
    potentialSavings
  };
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount);
}

export function formatHours(hours: number): string {
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(hours);
}

export function formatNumber(num: number): string {
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(num);
}

export function calculateFTE(totalHours: number, hoursPerYear: number = 2080): number {
  return totalHours / hoursPerYear;
}

export interface AgentProjectionInputs {
  avgTimeWithoutAgentMinutes: number;
  avgTimeWithAgentMinutes: number;
  avgUsageCount: number;
  usageDiscountPercent: number;
  avgHourlyWage: number;
}

export interface AgentProjectionResults {
  timeSavedPerUseMinutes: number;
  annualTimeSavedHours: number;
  annualCostSavings: number;
  fteEquivalent: number;
}

export function calculateAgentProjections(inputs: AgentProjectionInputs): AgentProjectionResults {
  const timeSavedPerUseMinutes = inputs.avgTimeWithoutAgentMinutes - inputs.avgTimeWithAgentMinutes;

  const netUsageCount = inputs.avgUsageCount * (1 - inputs.usageDiscountPercent / 100);

  const annualTimeSavedHours = (timeSavedPerUseMinutes * netUsageCount) / 60;

  const annualCostSavings = annualTimeSavedHours * inputs.avgHourlyWage;

  const fteEquivalent = calculateFTE(annualTimeSavedHours);

  return {
    timeSavedPerUseMinutes,
    annualTimeSavedHours,
    annualCostSavings,
    fteEquivalent
  };
}

export interface AdoptionAdjustedInputs {
  avgTimeWithoutAgentMinutes: number;
  avgTimeWithAgentMinutes: number;
  avgUsageCount: number;
  usageDiscountPercent: number;
  avgHourlyWage: number;
  adoptionRatePercent: number;
  targetUserBase?: number;
  currentActiveUsers?: number;
}

export interface AdoptionAdjustedResults {
  currentImpact: AgentProjectionResults;
  potentialImpact: AgentProjectionResults;
  opportunityGap: {
    timeSavedHours: number;
    costSavings: number;
    fteEquivalent: number;
  };
  adoptionMetrics: {
    adoptionRate: number;
    targetUsers: number;
    currentUsers: number;
    usersToFullAdoption: number;
  };
  incrementalValuePerPercent: {
    timeSavedHours: number;
    costSavings: number;
  };
}

export function calculateAdoptionAdjustedProjections(inputs: AdoptionAdjustedInputs): AdoptionAdjustedResults {
  const adoptionMultiplier = inputs.adoptionRatePercent / 100;

  const currentUsageCount = inputs.avgUsageCount * adoptionMultiplier;

  const currentImpact = calculateAgentProjections({
    avgTimeWithoutAgentMinutes: inputs.avgTimeWithoutAgentMinutes,
    avgTimeWithAgentMinutes: inputs.avgTimeWithAgentMinutes,
    avgUsageCount: currentUsageCount,
    usageDiscountPercent: inputs.usageDiscountPercent,
    avgHourlyWage: inputs.avgHourlyWage
  });

  const potentialImpact = calculateAgentProjections({
    avgTimeWithoutAgentMinutes: inputs.avgTimeWithoutAgentMinutes,
    avgTimeWithAgentMinutes: inputs.avgTimeWithAgentMinutes,
    avgUsageCount: inputs.avgUsageCount,
    usageDiscountPercent: inputs.usageDiscountPercent,
    avgHourlyWage: inputs.avgHourlyWage
  });

  const opportunityGap = {
    timeSavedHours: potentialImpact.annualTimeSavedHours - currentImpact.annualTimeSavedHours,
    costSavings: potentialImpact.annualCostSavings - currentImpact.annualCostSavings,
    fteEquivalent: potentialImpact.fteEquivalent - currentImpact.fteEquivalent
  };

  const remainingAdoptionPercent = 100 - inputs.adoptionRatePercent;
  const incrementalValuePerPercent = {
    timeSavedHours: remainingAdoptionPercent > 0 ? opportunityGap.timeSavedHours / remainingAdoptionPercent : 0,
    costSavings: remainingAdoptionPercent > 0 ? opportunityGap.costSavings / remainingAdoptionPercent : 0
  };

  const adoptionMetrics = {
    adoptionRate: inputs.adoptionRatePercent,
    targetUsers: inputs.targetUserBase || 0,
    currentUsers: inputs.currentActiveUsers || 0,
    usersToFullAdoption: (inputs.targetUserBase || 0) - (inputs.currentActiveUsers || 0)
  };

  return {
    currentImpact,
    potentialImpact,
    opportunityGap,
    adoptionMetrics,
    incrementalValuePerPercent
  };
}

export function calculateAdoptionRate(currentUsers: number, targetUsers: number): number {
  if (targetUsers <= 0) return 0;
  return Math.min(100, (currentUsers / targetUsers) * 100);
}

export function calculateProjectedUsageAtAdoption(baseUsage: number, adoptionPercent: number): number {
  return baseUsage * (adoptionPercent / 100);
}

export interface AdoptionScenarioInputs {
  avgTimeWithoutAgentMinutes: number;
  avgTimeWithAgentMinutes: number;
  avgUsageCount: number;
  usageDiscountPercent: number;
  avgHourlyWage: number;
  scenarioAdoptionPercent: number;
}

export function calculateAdoptionScenario(inputs: AdoptionScenarioInputs): AgentProjectionResults {
  const scenarioUsageCount = calculateProjectedUsageAtAdoption(inputs.avgUsageCount, inputs.scenarioAdoptionPercent);

  return calculateAgentProjections({
    avgTimeWithoutAgentMinutes: inputs.avgTimeWithoutAgentMinutes,
    avgTimeWithAgentMinutes: inputs.avgTimeWithAgentMinutes,
    avgUsageCount: scenarioUsageCount,
    usageDiscountPercent: inputs.usageDiscountPercent,
    avgHourlyWage: inputs.avgHourlyWage
  });
}

export function formatMinutesToTime(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = Math.round(minutes % 60);

  if (hours === 0) {
    return `${mins}m`;
  }

  if (mins === 0) {
    return `${hours}h`;
  }

  return `${hours}h ${mins}m`;
}

export function parseTimeToMinutes(timeString: string): number {
  const parts = timeString.toLowerCase().split(/\s+/);
  let totalMinutes = 0;

  for (const part of parts) {
    if (part.includes('h')) {
      const hours = parseFloat(part.replace('h', ''));
      if (!isNaN(hours)) {
        totalMinutes += hours * 60;
      }
    } else if (part.includes('m')) {
      const minutes = parseFloat(part.replace('m', ''));
      if (!isNaN(minutes)) {
        totalMinutes += minutes;
      }
    } else if (part.includes(':')) {
      const [hours, minutes] = part.split(':').map(Number);
      if (!isNaN(hours) && !isNaN(minutes)) {
        totalMinutes += hours * 60 + minutes;
      }
    } else {
      const num = parseFloat(part);
      if (!isNaN(num)) {
        totalMinutes += num;
      }
    }
  }

  return totalMinutes;
}
