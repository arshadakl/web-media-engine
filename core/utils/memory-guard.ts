/**
 * Memory guard for adaptive chunk sizing.
 * Polls performance.memory (Chromium) and navigator.deviceMemory.
 * Emits memory:pressure events when heap drops below threshold.
 */

export interface MemoryInfo {
  usedJSHeapSize: number;
  jsHeapSizeLimit: number;
  totalJSHeapSize: number;
}

export interface MemoryGuardOptions {
  /** Polling interval in milliseconds (default: 2000) */
  pollInterval?: number;
  /** Pressure threshold percentage (0-1, default: 0.8) */
  pressureThreshold?: number;
  /** Default chunk size in MB (default: 50) */
  defaultChunkSizeMB?: number;
  /** Minimum chunk size in MB (default: 10) */
  minChunkSizeMB?: number;
  /** Maximum chunk size in MB (default: 200) */
  maxChunkSizeMB?: number;
}

type MemoryPressureHandler = (info: MemoryInfo) => void;

/**
 * Monitors memory usage and provides adaptive chunk sizing.
 */
export class MemoryGuard {
  private readonly pollInterval: number;
  private readonly pressureThreshold: number;
  private readonly defaultChunkSizeMB: number;
  private readonly minChunkSizeMB: number;
  private readonly maxChunkSizeMB: number;
  private pollingTimer: ReturnType<typeof setInterval> | null = null;
  private pressureHandlers: MemoryPressureHandler[] = [];
  private currentChunkSizeMB: number;
  private lastMemoryInfo: MemoryInfo | null = null;

  constructor(options: MemoryGuardOptions = {}) {
    this.pollInterval = options.pollInterval ?? 2000;
    this.pressureThreshold = options.pressureThreshold ?? 0.8;
    this.defaultChunkSizeMB = options.defaultChunkSizeMB ?? 50;
    this.minChunkSizeMB = options.minChunkSizeMB ?? 10;
    this.maxChunkSizeMB = options.maxChunkSizeMB ?? 200;
    this.currentChunkSizeMB = this.calculateInitialChunkSize();
  }

  /**
   * Get the current maximum chunk size based on available memory.
   * @returns Chunk size in MB
   */
  getMaxChunkSizeMB(): number {
    return this.currentChunkSizeMB;
  }

  /**
   * Get the last measured memory info.
   * @returns Memory info or null if not yet measured
   */
  getLastMemoryInfo(): MemoryInfo | null {
    return this.lastMemoryInfo;
  }

  /**
   * Check if memory pressure is currently active.
   * @returns True if under memory pressure
   */
  isUnderPressure(): boolean {
    if (!this.lastMemoryInfo) {
      return false;
    }
    const usageRatio =
      this.lastMemoryInfo.usedJSHeapSize / this.lastMemoryInfo.jsHeapSizeLimit;
    return usageRatio >= this.pressureThreshold;
  }

  /**
   * Register a handler for memory pressure events.
   * @param handler - Callback function when pressure is detected
   */
  onPressure(handler: MemoryPressureHandler): void {
    this.pressureHandlers.push(handler);
  }

  /**
   * Remove a pressure handler.
   * @param handler - Handler to remove
   */
  offPressure(handler: MemoryPressureHandler): void {
    const index = this.pressureHandlers.indexOf(handler);
    if (index !== -1) {
      this.pressureHandlers.splice(index, 1);
    }
  }

  /**
   * Start polling memory usage.
   */
  start(): void {
    if (this.pollingTimer !== null) {
      return;
    }

    this.poll();
    this.pollingTimer = setInterval(() => this.poll(), this.pollInterval);
  }

  /**
   * Stop polling memory usage.
   */
  stop(): void {
    if (this.pollingTimer !== null) {
      clearInterval(this.pollingTimer);
      this.pollingTimer = null;
    }
  }

  /**
   * Force an immediate memory check.
   */
  checkNow(): void {
    this.poll();
  }

  private poll(): void {
    const memoryInfo = this.getMemoryInfo();
    if (!memoryInfo) {
      return;
    }

    this.lastMemoryInfo = memoryInfo;
    this.updateChunkSize(memoryInfo);
    this.checkPressure(memoryInfo);
  }

  private getMemoryInfo(): MemoryInfo | null {
    // Chromium-specific performance.memory
    if (typeof performance !== "undefined" && "memory" in performance) {
      const memory = (performance as { memory: MemoryInfo }).memory;
      return {
        usedJSHeapSize: memory.usedJSHeapSize,
        jsHeapSizeLimit: memory.jsHeapSizeLimit,
        totalJSHeapSize: memory.totalJSHeapSize,
      };
    }

    // Fallback: estimate from navigator.deviceMemory (GB)
    if (typeof navigator !== "undefined" && "deviceMemory" in navigator) {
      const deviceMemoryGB = (navigator as { deviceMemory: number })
        .deviceMemory;
      const estimatedHeapBytes = deviceMemoryGB * 1024 * 1024 * 1024 * 0.5; // 50% of device memory
      return {
        usedJSHeapSize: estimatedHeapBytes * 0.3, // Assume 30% used
        jsHeapSizeLimit: estimatedHeapBytes,
        totalJSHeapSize: estimatedHeapBytes,
      };
    }

    return null;
  }

  private calculateInitialChunkSize(): number {
    if (typeof navigator !== "undefined" && "deviceMemory" in navigator) {
      const deviceMemoryGB = (navigator as { deviceMemory: number })
        .deviceMemory;
      // Scale chunk size based on device memory
      if (deviceMemoryGB <= 2) return this.minChunkSizeMB;
      if (deviceMemoryGB <= 4) return 25;
      if (deviceMemoryGB <= 8) return this.defaultChunkSizeMB;
      return Math.min(this.defaultChunkSizeMB * 2, this.maxChunkSizeMB);
    }
    return this.defaultChunkSizeMB;
  }

  private updateChunkSize(info: MemoryInfo): void {
    const usageRatio = info.usedJSHeapSize / info.jsHeapSizeLimit;

    if (usageRatio >= this.pressureThreshold) {
      // Under pressure: reduce chunk size
      this.currentChunkSizeMB = Math.max(
        this.minChunkSizeMB,
        this.currentChunkSizeMB * 0.5,
      );
    } else if (usageRatio < this.pressureThreshold * 0.5) {
      // Plenty of memory: increase chunk size
      this.currentChunkSizeMB = Math.min(
        this.maxChunkSizeMB,
        this.currentChunkSizeMB * 1.25,
      );
    }
  }

  private checkPressure(info: MemoryInfo): void {
    const usageRatio = info.usedJSHeapSize / info.jsHeapSizeLimit;
    if (usageRatio >= this.pressureThreshold) {
      for (const handler of this.pressureHandlers) {
        handler(info);
      }
    }
  }
}

/**
 * Create a memory guard instance.
 * @param options - Configuration options
 * @returns MemoryGuard instance
 */
export function createMemoryGuard(options?: MemoryGuardOptions): MemoryGuard {
  return new MemoryGuard(options);
}
