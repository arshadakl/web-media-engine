import { describe, it, expect, beforeEach } from "vitest";
import {
  recordMetric,
  getMetrics,
  clearMetrics,
  checkBudget,
  measure,
  measureAsync,
} from "../../core/perf/monitor";

describe("Performance Monitor", () => {
  beforeEach(() => {
    clearMetrics();
  });

  describe("recordMetric", () => {
    it("should record a metric", () => {
      recordMetric("test", 100, "ms");
      const metrics = getMetrics("test");
      expect(metrics.length).toBe(1);
      expect(metrics[0].value).toBe(100);
      expect(metrics[0].unit).toBe("ms");
    });

    it("should record multiple metrics", () => {
      recordMetric("test", 100);
      recordMetric("test", 200);
      recordMetric("other", 300);
      expect(getMetrics("test").length).toBe(2);
      expect(getMetrics("other").length).toBe(1);
    });
  });

  describe("getMetrics", () => {
    it("should return all metrics when no name specified", () => {
      recordMetric("a", 1);
      recordMetric("b", 2);
      expect(getMetrics().length).toBe(2);
    });

    it("should filter by name", () => {
      recordMetric("a", 1);
      recordMetric("b", 2);
      expect(getMetrics("a").length).toBe(1);
    });
  });

  describe("clearMetrics", () => {
    it("should clear all metrics", () => {
      recordMetric("test", 100);
      clearMetrics();
      expect(getMetrics().length).toBe(0);
    });
  });

  describe("checkBudget", () => {
    it("should pass when within budget", () => {
      recordMetric("edlRecompute", 30);
      const result = checkBudget();
      expect(result.passed).toBe(true);
    });

    it("should fail when exceeding budget", () => {
      recordMetric("edlRecompute", 100);
      const result = checkBudget();
      expect(result.passed).toBe(false);
      expect(result.violations.length).toBe(1);
    });
  });

  describe("measure", () => {
    it("should measure sync function", () => {
      const result = measure("test", () => 42);
      expect(result).toBe(42);
      expect(getMetrics("test").length).toBe(1);
    });
  });

  describe("measureAsync", () => {
    it("should measure async function", async () => {
      const result = await measureAsync("test", async () => 42);
      expect(result).toBe(42);
      expect(getMetrics("test").length).toBe(1);
    });
  });
});
