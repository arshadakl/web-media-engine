import { describe, it, expect } from "vitest";
import {
  generateExportPlan,
  estimateExportTime,
} from "../../core/export/hybrid-exporter";
import type { EditEntry } from "../../core/timeline/edl";
import type { KeyframeData } from "../../core/export/keyframe-probe";

function createTestEntries(): EditEntry[] {
  return [
    {
      action: "keep",
      startMs: 0,
      endMs: 2000,
      startSample: 0,
      endSample: 88200,
    },
    {
      action: "cut",
      startMs: 2000,
      endMs: 3000,
      startSample: 88200,
      endSample: 132300,
    },
    {
      action: "keep",
      startMs: 3000,
      endMs: 5000,
      startSample: 132300,
      endSample: 220500,
    },
    {
      action: "keep",
      startMs: 6000,
      endMs: 8000,
      startSample: 264600,
      endSample: 352800,
    },
  ];
}

function createKeyframesWithAlignment(): KeyframeData {
  return {
    timestamps: new Float64Array([0, 2000, 4000, 6000, 8000]),
    durationMs: 10000,
  };
}

function createKeyframesWithoutAlignment(): KeyframeData {
  return {
    timestamps: new Float64Array([0, 2500, 5000, 7500]),
    durationMs: 10000,
  };
}

describe("generateExportPlan", () => {
  it("should generate plan with aligned keyframes", () => {
    const plan = generateExportPlan(
      createTestEntries(),
      createKeyframesWithAlignment(),
    );
    expect(plan.tasks.length).toBe(3);
    expect(plan.totalSegments).toBe(3);
  });

  it("should assign copy for aligned segments", () => {
    const plan = generateExportPlan(
      createTestEntries(),
      createKeyframesWithAlignment(),
    );
    // First entry: 0-2000, keyframes at 0 and 2000 → should be copy
    const firstTask = plan.tasks.find((t) => t.entryIndex === 0);
    expect(firstTask?.type).toBe("copy");
  });

  it("should assign reencode for non-aligned segments", () => {
    const plan = generateExportPlan(
      createTestEntries(),
      createKeyframesWithoutAlignment(),
    );
    // First entry: 0-2000, keyframes at 0 and 2500 → end not aligned
    const firstTask = plan.tasks.find((t) => t.entryIndex === 0);
    expect(firstTask?.type).toBe("reencode");
  });

  it("should count copy and reencode segments", () => {
    const plan = generateExportPlan(
      createTestEntries(),
      createKeyframesWithAlignment(),
    );
    expect(plan.copySegments + plan.reencodeSegments).toBe(plan.totalSegments);
  });

  it("should handle empty entries", () => {
    const plan = generateExportPlan([], createKeyframesWithAlignment());
    expect(plan.tasks.length).toBe(0);
  });
});

describe("estimateExportTime", () => {
  it("should estimate time based on reencode segments", () => {
    const plan = generateExportPlan(
      createTestEntries(),
      createKeyframesWithAlignment(),
    );
    const estimate = estimateExportTime(plan);
    expect(estimate).toBeGreaterThanOrEqual(0);
  });
});
