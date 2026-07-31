import { describe, it, expect } from "vitest";
import {
  generateEDL,
  validateEDL,
  getTimeSaved,
} from "../../core/timeline/edl";
import type { Segment } from "../../core/timeline/timeline-types";

function seg(
  type: "speech" | "silence",
  startMs: number,
  endMs: number,
): Segment {
  return {
    id: `seg-${Math.random()}`,
    type,
    startMs,
    endMs,
    avgSpeechProb: 0.8,
  };
}

describe("generateEDL", () => {
  it("should generate EDL from segments", () => {
    const segments = [
      seg("speech", 0, 1000),
      seg("silence", 1000, 2000),
      seg("speech", 2000, 3000),
    ];
    const edl = generateEDL(segments);

    expect(edl.entries.length).toBe(3);
    expect(edl.entries[0].action).toBe("keep");
    expect(edl.entries[1].action).toBe("cut");
    expect(edl.entries[2].action).toBe("keep");
  });

  it("should calculate correct output duration", () => {
    const segments = [
      seg("speech", 0, 1000),
      seg("silence", 1000, 2000),
      seg("speech", 2000, 3000),
    ];
    const edl = generateEDL(segments);

    expect(edl.outputDurationMs).toBe(2000);
  });

  it("should convert ms to samples correctly", () => {
    const segments = [seg("speech", 0, 100)];
    const edl = generateEDL(segments, 44100);

    expect(edl.entries[0].startSample).toBe(0);
    expect(edl.entries[0].endSample).toBe(4410);
  });

  it("should handle empty input", () => {
    const edl = generateEDL([]);
    expect(edl.entries.length).toBe(0);
    expect(edl.totalDurationMs).toBe(0);
    expect(edl.outputDurationMs).toBe(0);
  });
});

describe("validateEDL", () => {
  it("should validate correct EDL", () => {
    const edl = generateEDL([
      seg("speech", 0, 1000),
      seg("silence", 1000, 2000),
      seg("speech", 2000, 3000),
    ]);
    const result = validateEDL(edl);
    expect(result.valid).toBe(true);
    expect(result.errors.length).toBe(0);
  });

  it("should detect gaps", () => {
    const edl = {
      entries: [
        {
          action: "keep" as const,
          startMs: 0,
          endMs: 1000,
          startSample: 0,
          endSample: 44100,
        },
        {
          action: "cut" as const,
          startMs: 1200,
          endMs: 2000,
          startSample: 52920,
          endSample: 88200,
        },
      ],
      totalDurationMs: 2000,
      outputDurationMs: 1000,
    };
    const result = validateEDL(edl);
    expect(result.valid).toBe(false);
    expect(result.errors.length).toBe(1);
    expect(result.errors[0]).toContain("Gap");
  });

  it("should detect overlaps", () => {
    const edl = {
      entries: [
        {
          action: "keep" as const,
          startMs: 0,
          endMs: 1500,
          startSample: 0,
          endSample: 66150,
        },
        {
          action: "cut" as const,
          startMs: 1000,
          endMs: 2000,
          startSample: 44100,
          endSample: 88200,
        },
      ],
      totalDurationMs: 2000,
      outputDurationMs: 1500,
    };
    const result = validateEDL(edl);
    expect(result.valid).toBe(false);
    expect(result.errors.length).toBe(2);
  });

  it("should handle empty EDL", () => {
    const edl = { entries: [], totalDurationMs: 0, outputDurationMs: 0 };
    const result = validateEDL(edl);
    expect(result.valid).toBe(true);
  });
});

describe("getTimeSaved", () => {
  it("should calculate time saved correctly", () => {
    const edl = generateEDL([
      seg("speech", 0, 1000),
      seg("silence", 1000, 2000),
      seg("speech", 2000, 3000),
    ]);
    const result = getTimeSaved(edl);

    expect(result.timeSavedMs).toBe(1000);
    expect(result.percentageRemoved).toBeCloseTo(33.33, 1);
  });

  it("should handle zero total duration", () => {
    const edl = { entries: [], totalDurationMs: 0, outputDurationMs: 0 };
    const result = getTimeSaved(edl);
    expect(result.timeSavedMs).toBe(0);
    expect(result.percentageRemoved).toBe(0);
  });
});
