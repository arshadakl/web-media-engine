export interface PerformanceMetric {
  name: string;
  value: number;
  unit: string;
  timestamp: number;
}

export interface PerformanceBudget {
  firstInteractiveCold: number;
  firstInteractiveWarm: number;
  vadProcessingPerHour: number;
  exportCopyPerHour: number;
  exportReencodePerHour: number;
  waveformFPS: number;
  edlRecompute: number;
  peakRAM: number;
}

export const DEFAULT_BUDGET: PerformanceBudget = {
  firstInteractiveCold: 3000,
  firstInteractiveWarm: 1000,
  vadProcessingPerHour: 240000, // 4 minutes
  exportCopyPerHour: 300000, // 5 minutes
  exportReencodePerHour: 1200000, // 20 minutes
  waveformFPS: 60,
  edlRecompute: 50,
  peakRAM: 600 * 1024 * 1024, // 600MB
};

const metrics: PerformanceMetric[] = [];

export function recordMetric(
  name: string,
  value: number,
  unit: string = "ms",
): void {
  metrics.push({
    name,
    value,
    unit,
    timestamp: performance.now(),
  });
}

export function getMetrics(name?: string): PerformanceMetric[] {
  if (name) {
    return metrics.filter((m) => m.name === name);
  }
  return [...metrics];
}

export function clearMetrics(): void {
  metrics.length = 0;
}

export function checkBudget(budget: PerformanceBudget = DEFAULT_BUDGET): {
  passed: boolean;
  violations: string[];
} {
  const violations: string[] = [];

  const checkMetric = (name: string, maxValue: number, unit: string) => {
    const metric = metrics.find((m) => m.name === name);
    if (metric && metric.value > maxValue) {
      violations.push(
        `${name}: ${metric.value.toFixed(2)}${unit} exceeds budget ${maxValue}${unit}`,
      );
    }
  };

  checkMetric("firstInteractive", budget.firstInteractiveCold, "ms");
  checkMetric("vadProcessing", budget.vadProcessingPerHour, "ms");
  checkMetric("exportProcessing", budget.exportCopyPerHour, "ms");
  checkMetric("edlRecompute", budget.edlRecompute, "ms");

  return {
    passed: violations.length === 0,
    violations,
  };
}

export function measureAsync<T>(
  name: string,
  fn: () => Promise<T>,
): Promise<T> {
  const start = performance.now();
  return fn().then((result) => {
    const duration = performance.now() - start;
    recordMetric(name, duration);
    return result;
  });
}

export function measure<T>(name: string, fn: () => T): T {
  const start = performance.now();
  const result = fn();
  const duration = performance.now() - start;
  recordMetric(name, duration);
  return result;
}
