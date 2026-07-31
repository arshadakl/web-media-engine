import { describe, it, expect, beforeEach } from "vitest";
import {
  configureWorkerPool,
  getWorkerPoolConfig,
  getWorkerPoolStats,
  updateWorkerPoolStats,
  getOptimalWorkerCount,
  shouldSpawnWorker,
  shouldTerminateWorker,
  resetWorkerPoolStats,
} from "../../core/perf/worker-pool";

describe("Worker Pool", () => {
  beforeEach(() => {
    resetWorkerPoolStats();
  });

  describe("configureWorkerPool", () => {
    it("should update config", () => {
      configureWorkerPool({ maxWorkers: 8 });
      expect(getWorkerPoolConfig().maxWorkers).toBe(8);
    });

    it("should preserve other config values", () => {
      configureWorkerPool({ maxWorkers: 8 });
      expect(getWorkerPoolConfig().minWorkers).toBe(1);
    });
  });

  describe("getWorkerPoolStats", () => {
    it("should return initial stats", () => {
      const stats = getWorkerPoolStats();
      expect(stats.totalWorkers).toBe(0);
      expect(stats.busyWorkers).toBe(0);
      expect(stats.idleWorkers).toBe(0);
    });
  });

  describe("updateWorkerPoolStats", () => {
    it("should update stats", () => {
      updateWorkerPoolStats({ totalWorkers: 4, busyWorkers: 2 });
      const stats = getWorkerPoolStats();
      expect(stats.totalWorkers).toBe(4);
      expect(stats.busyWorkers).toBe(2);
    });
  });

  describe("getOptimalWorkerCount", () => {
    it("should return a positive number", () => {
      const count = getOptimalWorkerCount();
      expect(count).toBeGreaterThan(0);
    });
  });

  describe("shouldSpawnWorker", () => {
    it("should return true when no idle workers", () => {
      resetWorkerPoolStats();
      expect(shouldSpawnWorker()).toBe(true);
    });

    it("should return false when idle workers exist", () => {
      updateWorkerPoolStats({ idleWorkers: 2 });
      expect(shouldSpawnWorker()).toBe(false);
    });
  });

  describe("shouldTerminateWorker", () => {
    it("should return false when tasks queued", () => {
      updateWorkerPoolStats({ idleWorkers: 2, queuedTasks: 1 });
      expect(shouldTerminateWorker()).toBe(false);
    });

    it("should return true when idle and no tasks", () => {
      updateWorkerPoolStats({ idleWorkers: 2, queuedTasks: 0 });
      expect(shouldTerminateWorker()).toBe(true);
    });
  });
});
