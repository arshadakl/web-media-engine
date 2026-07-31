import { describe, it, expect } from "vitest";
import { computeStats, formatDuration } from "../../core/preview/stats";
import type { EDL } from "../../core/timeline/edl";

function createTestEDL(): EDL {
  return {
    entries: [
      {
        action: "keep",
        startMs: 0,
        endMs: 1000,
        startSample: 0,
        endSample: 44100,
      },
      {
        action: "cut",
        startMs: 1000,
        endMs: 2000,
        startSample: 44100,
        endSample: 88200,
      },
      {
        action: "keep",
        startMs: 2000,
        endMs: 3500,
        startSample: 88200,
        endSample: 154350,
      },
      {
        action: "cut",
        startMs: 3500,
        endMs: 4500,
        startSample: 154350,
        endSample: 198450,
      },
    ],
    totalDurationMs: 4500,
    outputDurationMs: 2500,
  };
}

describe("computeStats", () => {
  it("should compute correct stats", () => {
    const stats = computeStats(createTestEDL());
    expect(stats.originalDurationMs).toBe(4500);
    expect(stats.outputDurationMs).toBe(2500);
    expect(stats.timeRemovedMs).toBe(2000);
    expect(stats.percentageRemoved).toBeCloseTo(44.44, 1);
    expect(stats.numberOfCuts).toBe(2);
    expect(stats.avgSilenceRemovedMs).toBe(1000);
  });

  it("should handle empty EDL", () => {
    const edl: EDL = { entries: [], totalDurationMs: 0, outputDurationMs: 0 };
    const stats = computeStats(edl);
    expect(stats.numberOfCuts).toBe(0);
    expect(stats.avgSilenceRemovedMs).toBe(0);
  });
});

describe("formatDuration", () => {
  it("should format milliseconds correctly", () => {
    expect(formatDuration(0)).toBe("00:00.00");
    expect(formatDuration(1000)).toBe("00:01.00");
    expect(formatDuration(60000)).toBe("01:00.00");
    expect(formatDuration(90500)).toBe("01:30.50");
  });
});
