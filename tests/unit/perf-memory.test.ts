import { describe, it, expect, beforeEach } from "vitest";
import {
  takeSnapshot,
  getMemoryStats,
  clearMemoryStats,
  formatBytes,
  getMemoryPressureLevel,
} from "../../core/perf/memory";

describe("Memory Profiler", () => {
  beforeEach(() => {
    clearMemoryStats();
  });

  describe("takeSnapshot", () => {
    it("should return null in test environment", () => {
      // In vitest, performance.memory is not available
      const snapshot = takeSnapshot();
      expect(snapshot).toBeNull();
    });
  });

  describe("getMemoryStats", () => {
    it("should return empty stats initially", () => {
      const stats = getMemoryStats();
      expect(stats.current).toBeNull();
      expect(stats.peak).toBeNull();
      expect(stats.samples.length).toBe(0);
    });
  });

  describe("clearMemoryStats", () => {
    it("should clear all stats", () => {
      clearMemoryStats();
      const stats = getMemoryStats();
      expect(stats.samples.length).toBe(0);
    });
  });

  describe("formatBytes", () => {
    it("should format bytes correctly", () => {
      expect(formatBytes(0)).toBe("0 B");
      expect(formatBytes(1024)).toBe("1 KB");
      expect(formatBytes(1024 * 1024)).toBe("1 MB");
      expect(formatBytes(1024 * 1024 * 1024)).toBe("1 GB");
    });

    it("should format fractional values", () => {
      expect(formatBytes(1536)).toBe("1.5 KB");
    });
  });

  describe("getMemoryPressureLevel", () => {
    it("should return low when no samples", () => {
      expect(getMemoryPressureLevel()).toBe("low");
    });
  });
});
