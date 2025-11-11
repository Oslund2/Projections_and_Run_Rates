export interface DataPoint {
  date: string;
  value: number;
}

export interface RegressionResult {
  slope: number;
  intercept: number;
  rSquared: number;
  predictions: DataPoint[];
}

export interface StatisticalSummary {
  mean: number;
  median: number;
  standardDeviation: number;
  variance: number;
  min: number;
  max: number;
  count: number;
}

export interface ConfidenceInterval {
  lower: number;
  upper: number;
  confidenceLevel: number;
}

export interface OutlierResult {
  value: number;
  index: number;
  zScore: number;
  isOutlier: boolean;
}

export class StatisticsService {
  calculateMean(values: number[]): number {
    if (values.length === 0) return 0;
    return values.reduce((sum, val) => sum + val, 0) / values.length;
  }

  calculateMedian(values: number[]): number {
    if (values.length === 0) return 0;
    const sorted = [...values].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    return sorted.length % 2 === 0
      ? (sorted[mid - 1] + sorted[mid]) / 2
      : sorted[mid];
  }

  calculateVariance(values: number[]): number {
    if (values.length === 0) return 0;
    const mean = this.calculateMean(values);
    const squaredDiffs = values.map(val => Math.pow(val - mean, 2));
    return this.calculateMean(squaredDiffs);
  }

  calculateStandardDeviation(values: number[]): number {
    return Math.sqrt(this.calculateVariance(values));
  }

  calculateStatisticalSummary(values: number[]): StatisticalSummary {
    if (values.length === 0) {
      return {
        mean: 0,
        median: 0,
        standardDeviation: 0,
        variance: 0,
        min: 0,
        max: 0,
        count: 0,
      };
    }

    return {
      mean: this.calculateMean(values),
      median: this.calculateMedian(values),
      standardDeviation: this.calculateStandardDeviation(values),
      variance: this.calculateVariance(values),
      min: Math.min(...values),
      max: Math.max(...values),
      count: values.length,
    };
  }

  calculateConfidenceInterval(
    values: number[],
    confidenceLevel: number = 0.95
  ): ConfidenceInterval {
    const mean = this.calculateMean(values);
    const stdDev = this.calculateStandardDeviation(values);
    const n = values.length;

    const zScore = confidenceLevel === 0.95 ? 1.96 : confidenceLevel === 0.99 ? 2.576 : 1.645;
    const marginOfError = zScore * (stdDev / Math.sqrt(n));

    return {
      lower: mean - marginOfError,
      upper: mean + marginOfError,
      confidenceLevel,
    };
  }

  detectOutliers(values: number[], threshold: number = 3): OutlierResult[] {
    const mean = this.calculateMean(values);
    const stdDev = this.calculateStandardDeviation(values);

    return values.map((value, index) => {
      const zScore = stdDev === 0 ? 0 : (value - mean) / stdDev;
      return {
        value,
        index,
        zScore,
        isOutlier: Math.abs(zScore) > threshold,
      };
    });
  }

  calculateMovingAverage(dataPoints: DataPoint[], windowSize: number): DataPoint[] {
    if (dataPoints.length < windowSize) return [];

    const result: DataPoint[] = [];
    for (let i = windowSize - 1; i < dataPoints.length; i++) {
      const window = dataPoints.slice(i - windowSize + 1, i + 1);
      const avg = this.calculateMean(window.map(p => p.value));
      result.push({
        date: dataPoints[i].date,
        value: avg,
      });
    }
    return result;
  }

  performLinearRegression(dataPoints: DataPoint[]): RegressionResult {
    const n = dataPoints.length;
    if (n < 2) {
      return {
        slope: 0,
        intercept: 0,
        rSquared: 0,
        predictions: [],
      };
    }

    const xValues = dataPoints.map((_, i) => i);
    const yValues = dataPoints.map(p => p.value);

    const sumX = xValues.reduce((sum, x) => sum + x, 0);
    const sumY = yValues.reduce((sum, y) => sum + y, 0);
    const sumXY = xValues.reduce((sum, x, i) => sum + x * yValues[i], 0);
    const sumXX = xValues.reduce((sum, x) => sum + x * x, 0);
    const sumYY = yValues.reduce((sum, y) => sum + y * y, 0);

    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;

    const yMean = sumY / n;
    const ssTotal = yValues.reduce((sum, y) => sum + Math.pow(y - yMean, 2), 0);
    const ssResidual = yValues.reduce((sum, y, i) => {
      const predicted = slope * i + intercept;
      return sum + Math.pow(y - predicted, 2);
    }, 0);
    const rSquared = ssTotal === 0 ? 0 : 1 - ssResidual / ssTotal;

    const predictions = dataPoints.map((point, i) => ({
      date: point.date,
      value: slope * i + intercept,
    }));

    return { slope, intercept, rSquared, predictions };
  }

  forecastFuture(
    dataPoints: DataPoint[],
    periodsAhead: number
  ): DataPoint[] {
    const regression = this.performLinearRegression(dataPoints);
    const lastIndex = dataPoints.length - 1;
    const forecasts: DataPoint[] = [];

    for (let i = 1; i <= periodsAhead; i++) {
      const futureIndex = lastIndex + i;
      const predictedValue = regression.slope * futureIndex + regression.intercept;

      const lastDate = new Date(dataPoints[lastIndex].date);
      const futureDate = new Date(lastDate);
      futureDate.setDate(futureDate.getDate() + i);

      forecasts.push({
        date: futureDate.toISOString().split('T')[0],
        value: Math.max(0, predictedValue),
      });
    }

    return forecasts;
  }

  calculateGrowthRate(dataPoints: DataPoint[]): number {
    if (dataPoints.length < 2) return 0;

    const firstValue = dataPoints[0].value;
    const lastValue = dataPoints[dataPoints.length - 1].value;

    if (firstValue === 0) return 0;

    return ((lastValue - firstValue) / firstValue) * 100;
  }

  calculateCorrelation(values1: number[], values2: number[]): number {
    const n = Math.min(values1.length, values2.length);
    if (n < 2) return 0;

    const mean1 = this.calculateMean(values1.slice(0, n));
    const mean2 = this.calculateMean(values2.slice(0, n));
    const stdDev1 = this.calculateStandardDeviation(values1.slice(0, n));
    const stdDev2 = this.calculateStandardDeviation(values2.slice(0, n));

    if (stdDev1 === 0 || stdDev2 === 0) return 0;

    let correlation = 0;
    for (let i = 0; i < n; i++) {
      correlation += ((values1[i] - mean1) / stdDev1) * ((values2[i] - mean2) / stdDev2);
    }

    return correlation / n;
  }

  calculateCoefficientOfVariation(values: number[]): number {
    const mean = this.calculateMean(values);
    if (mean === 0) return 0;
    const stdDev = this.calculateStandardDeviation(values);
    return (stdDev / mean) * 100;
  }
}

export const statisticsService = new StatisticsService();
