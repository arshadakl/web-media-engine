export interface MemorySnapshot {
  usedJSHeapSize: number;
  totalJSHeapSize: number;
  jsHeapSizeLimit: number;
  timestamp: number;
}

export interface MemoryStats {
  current: MemorySnapshot | null;
  peak: MemorySnapshot | null;
  samples: MemorySnapshot[];
}

const samples: MemorySnapshot[] = [];
let peakMemory: MemorySnapshot | null = null;

export function takeSnapshot(): MemorySnapshot | null {
  if (typeof performance === "undefined" || !("memory" in performance)) {
    return null;
  }

  const memory = (
    performance as {
      memory?: {
        usedJSHeapSize: number;
        totalJSHeapSize: number;
        jsHeapSizeLimit: number;
      };
    }
  ).memory;
  const snapshot: MemorySnapshot = {
    usedJSHeapSize: memory.usedJSHeapSize,
    totalJSHeapSize: memory.totalJSHeapSize,
    jsHeapSizeLimit: memory.jsHeapSizeLimit,
    timestamp: performance.now(),
  };

  samples.push(snapshot);

  if (!peakMemory || snapshot.usedJSHeapSize > peakMemory.usedJSHeapSize) {
    peakMemory = snapshot;
  }

  return snapshot;
}

export function getMemoryStats(): MemoryStats {
  return {
    current: samples[samples.length - 1] ?? null,
    peak: peakMemory,
    samples: [...samples],
  };
}

export function clearMemoryStats(): void {
  samples.length = 0;
  peakMemory = null;
}

export function isMemoryPressure(thresholdMB: number = 500): boolean {
  const current = samples[samples.length - 1];
  if (!current) return false;
  return current.usedJSHeapSize > thresholdMB * 1024 * 1024;
}

export function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}

export function getMemoryPressureLevel():
  "low" | "medium" | "high" | "critical" {
  const current = samples[samples.length - 1];
  if (!current) return "low";

  const usedMB = current.usedJSHeapSize / (1024 * 1024);
  if (usedMB < 200) return "low";
  if (usedMB < 400) return "medium";
  if (usedMB < 600) return "high";
  return "critical";
}
