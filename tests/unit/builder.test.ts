import { describe, it, expect } from "vitest";
import { buildSegments } from "../../core/timeline/timeline-types";
import type { VADFrame } from "../../core/vad/vad-types";

function createFrame(
  isSpeech: boolean,
  startMs: number,
  endMs: number,
  speechProb: number = 0.9,
): VADFrame {
  return { isSpeech, startMs, endMs, speechProb };
}

describe("buildSegments", () => {
  it("should return empty array for empty input", () => {
    const result = buildSegments([]);
    expect(result).toEqual([]);
  });

  it("should create single segment for uniform frames", () => {
    const frames = [
      createFrame(true, 0, 32),
      createFrame(true, 32, 64),
      createFrame(true, 64, 96),
    ];
    const result = buildSegments(frames);

    expect(result).toHaveLength(1);
    expect(result[0].type).toBe("speech");
    expect(result[0].startMs).toBe(0);
    expect(result[0].endMs).toBe(96);
  });

  it("should split on speech/silence boundaries", () => {
    const frames = [
      createFrame(true, 0, 32),
      createFrame(true, 32, 64),
      createFrame(false, 64, 96),
      createFrame(false, 96, 128),
      createFrame(true, 128, 160),
    ];
    const result = buildSegments(frames);

    expect(result).toHaveLength(3);
    expect(result[0].type).toBe("speech");
    expect(result[1].type).toBe("silence");
    expect(result[2].type).toBe("speech");
  });

  it("should calculate average speech probability", () => {
    const frames = [
      createFrame(true, 0, 32, 0.8),
      createFrame(true, 32, 64, 0.9),
      createFrame(true, 64, 96, 0.7),
    ];
    const result = buildSegments(frames);

    expect(result[0].avgSpeechProb).toBeCloseTo(0.8, 2);
  });

  it("should generate unique IDs", () => {
    const frames = [
      createFrame(true, 0, 32),
      createFrame(false, 32, 64),
      createFrame(true, 64, 96),
    ];
    const result = buildSegments(frames);

    const ids = result.map((s) => s.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});
