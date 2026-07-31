import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { MemoryGuard, createMemoryGuard } from "../../core/utils/memory-guard";

describe("MemoryGuard", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  describe("createMemoryGuard", () => {
    it("should create a memory guard instance", () => {
      const guard = createMemoryGuard();
      expect(guard).toBeInstanceOf(MemoryGuard);
    });
  });

  describe("getMaxChunkSizeMB", () => {
    it("should return default chunk size initially", () => {
      const guard = createMemoryGuard({ defaultChunkSizeMB: 50 });
      expect(guard.getMaxChunkSizeMB()).toBe(50);
    });

    it("should return custom default chunk size", () => {
      const guard = createMemoryGuard({ defaultChunkSizeMB: 100 });
      expect(guard.getMaxChunkSizeMB()).toBe(100);
    });
  });

  describe("pressure detection", () => {
    it("should not be under pressure initially", () => {
      const guard = createMemoryGuard();
      expect(guard.isUnderPressure()).toBe(false);
    });

    it("should fire pressure event when threshold exceeded", () => {
      const handler = vi.fn();
      const guard = createMemoryGuard({ pressureThreshold: 0.8 });
      guard.onPressure(handler);

      // Mock performance.memory with high usage
      Object.defineProperty(performance, "memory", {
        value: {
          usedJSHeapSize: 850 * 1024 * 1024,
          jsHeapSizeLimit: 1000 * 1024 * 1024,
          totalJSHeapSize: 900 * 1024 * 1024,
        },
        writable: true,
        configurable: true,
      });

      guard.checkNow();
      expect(handler).toHaveBeenCalled();
    });

    it("should not fire pressure event below threshold", () => {
      const handler = vi.fn();
      const guard = createMemoryGuard({ pressureThreshold: 0.8 });
      guard.onPressure(handler);

      // Mock performance.memory with low usage
      Object.defineProperty(performance, "memory", {
        value: {
          usedJSHeapSize: 400 * 1024 * 1024,
          jsHeapSizeLimit: 1000 * 1024 * 1024,
          totalJSHeapSize: 500 * 1024 * 1024,
        },
        writable: true,
        configurable: true,
      });

      guard.checkNow();
      expect(handler).not.toHaveBeenCalled();
    });

    it("should remove pressure handler", () => {
      const handler = vi.fn();
      const guard = createMemoryGuard();
      guard.onPressure(handler);
      guard.offPressure(handler);

      Object.defineProperty(performance, "memory", {
        value: {
          usedJSHeapSize: 900 * 1024 * 1024,
          jsHeapSizeLimit: 1000 * 1024 * 1024,
          totalJSHeapSize: 950 * 1024 * 1024,
        },
        writable: true,
        configurable: true,
      });

      guard.checkNow();
      expect(handler).not.toHaveBeenCalled();
    });
  });

  describe("chunk size adaptation", () => {
    it("should reduce chunk size under memory pressure", () => {
      const guard = createMemoryGuard({
        defaultChunkSizeMB: 100,
        pressureThreshold: 0.8,
      });

      // Mock high memory usage
      Object.defineProperty(performance, "memory", {
        value: {
          usedJSHeapSize: 850 * 1024 * 1024,
          jsHeapSizeLimit: 1000 * 1024 * 1024,
          totalJSHeapSize: 900 * 1024 * 1024,
        },
        writable: true,
        configurable: true,
      });

      guard.checkNow();
      expect(guard.getMaxChunkSizeMB()).toBeLessThan(100);
    });

    it("should increase chunk size when memory is available", () => {
      const guard = createMemoryGuard({
        defaultChunkSizeMB: 50,
        pressureThreshold: 0.8,
      });

      // Mock low memory usage
      Object.defineProperty(performance, "memory", {
        value: {
          usedJSHeapSize: 200 * 1024 * 1024,
          jsHeapSizeLimit: 1000 * 1024 * 1024,
          totalJSHeapSize: 300 * 1024 * 1024,
        },
        writable: true,
        configurable: true,
      });

      guard.checkNow();
      expect(guard.getMaxChunkSizeMB()).toBeGreaterThan(50);
    });

    it("should not go below minimum chunk size", () => {
      const guard = createMemoryGuard({
        defaultChunkSizeMB: 20,
        minChunkSizeMB: 10,
        pressureThreshold: 0.8,
      });

      // Mock very high memory usage
      Object.defineProperty(performance, "memory", {
        value: {
          usedJSHeapSize: 950 * 1024 * 1024,
          jsHeapSizeLimit: 1000 * 1024 * 1024,
          totalJSHeapSize: 980 * 1024 * 1024,
        },
        writable: true,
        configurable: true,
      });

      guard.checkNow();
      expect(guard.getMaxChunkSizeMB()).toBeGreaterThanOrEqual(10);
    });

    it("should not exceed maximum chunk size", () => {
      const guard = createMemoryGuard({
        defaultChunkSizeMB: 150,
        maxChunkSizeMB: 200,
        pressureThreshold: 0.8,
      });

      // Mock very low memory usage
      Object.defineProperty(performance, "memory", {
        value: {
          usedJSHeapSize: 100 * 1024 * 1024,
          jsHeapSizeLimit: 1000 * 1024 * 1024,
          totalJSHeapSize: 150 * 1024 * 1024,
        },
        writable: true,
        configurable: true,
      });

      guard.checkNow();
      expect(guard.getMaxChunkSizeMB()).toBeLessThanOrEqual(200);
    });
  });

  describe("polling", () => {
    it("should start and stop polling", () => {
      const guard = createMemoryGuard({ pollInterval: 1000 });

      guard.start();
      vi.advanceTimersByTime(3000);

      guard.stop();
      // No error means it stopped successfully
    });

    it("should not start polling twice", () => {
      const guard = createMemoryGuard({ pollInterval: 1000 });

      guard.start();
      guard.start(); // Should not throw

      vi.advanceTimersByTime(2000);
      guard.stop();
    });
  });

  describe("getLastMemoryInfo", () => {
    it("should return null initially", () => {
      const guard = createMemoryGuard();
      expect(guard.getLastMemoryInfo()).toBeNull();
    });

    it("should return memory info after check", () => {
      const guard = createMemoryGuard();

      Object.defineProperty(performance, "memory", {
        value: {
          usedJSHeapSize: 500 * 1024 * 1024,
          jsHeapSizeLimit: 1000 * 1024 * 1024,
          totalJSHeapSize: 600 * 1024 * 1024,
        },
        writable: true,
        configurable: true,
      });

      guard.checkNow();
      const info = guard.getLastMemoryInfo();
      expect(info).not.toBeNull();
      expect(info?.usedJSHeapSize).toBe(500 * 1024 * 1024);
    });
  });
});
