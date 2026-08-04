import { logger } from './logger';

export interface MemoryInfo {
  usedJSHeapSize?: number;
  totalJSHeapSize?: number;
  jsHeapSizeLimit?: number;
  estimatedAvailableMB: number;
  pressureLevel: 'low' | 'medium' | 'high' | 'critical';
}

type MemoryPressureListener = (info: MemoryInfo) => void;

class MemoryGuard {
  private listeners: Set<MemoryPressureListener> = new Set();
  private intervalId: number | null = null;
  private currentInfo: MemoryInfo = {
    estimatedAvailableMB: 2048,
    pressureLevel: 'low',
  };

  constructor() {
    this.updateMemoryInfo();
    this.startPolling();
  }

  private updateMemoryInfo() {
    const perfMemory = (typeof performance !== 'undefined' && 'memory' in performance)
      ? (performance as unknown as { memory: { usedJSHeapSize: number; totalJSHeapSize: number; jsHeapSizeLimit: number } }).memory
      : null;

    let availableMB = 2048;
    let level: MemoryInfo['pressureLevel'] = 'low';

    if (perfMemory) {
      const usedMB = perfMemory.usedJSHeapSize / (1024 * 1024);
      const limitMB = perfMemory.jsHeapSizeLimit / (1024 * 1024);
      availableMB = Math.max(0, limitMB - usedMB);

      const usedRatio = perfMemory.usedJSHeapSize / perfMemory.jsHeapSizeLimit;
      if (usedRatio > 0.85) {
        level = 'critical';
      } else if (usedRatio > 0.7) {
        level = 'high';
      } else if (usedRatio > 0.5) {
        level = 'medium';
      }

      this.currentInfo = {
        usedJSHeapSize: perfMemory.usedJSHeapSize,
        totalJSHeapSize: perfMemory.totalJSHeapSize,
        jsHeapSizeLimit: perfMemory.jsHeapSizeLimit,
        estimatedAvailableMB: Math.round(availableMB),
        pressureLevel: level,
      };
    } else {
      this.currentInfo = {
        estimatedAvailableMB: availableMB,
        pressureLevel: 'low',
      };
    }

    if (level === 'critical' || level === 'high') {
      logger.warn('MemoryGuard', `High memory pressure detected: level=${level}, available=${Math.round(availableMB)}MB`);
      this.listeners.forEach((listener) => listener(this.currentInfo));
    }
  }

  private startPolling() {
    if (typeof window !== 'undefined') {
      this.intervalId = window.setInterval(() => this.updateMemoryInfo(), 3000) as unknown as number;
    }
  }

  public stop() {
    if (this.intervalId !== null) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  public getMaxChunkSizeMB(): number {
    const level = this.currentInfo.pressureLevel;
    switch (level) {
      case 'critical':
        return 8;
      case 'high':
        return 16;
      case 'medium':
        return 32;
      case 'low':
      default:
        return 64;
    }
  }

  public getMemoryInfo(): MemoryInfo {
    this.updateMemoryInfo();
    return { ...this.currentInfo };
  }

  public onPressureChange(listener: MemoryPressureListener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }
}

export const memoryGuard = new MemoryGuard();
