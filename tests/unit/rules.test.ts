import { describe, it, expect } from "vitest";
import {
  createMinSilenceFilter,
  createMinSpeechFilter,
  createPauseCompressor,
  createPaddingExpander,
  createMerger,
  composeRules,
  buildRulesPipeline,
} from "../../core/timeline/rules";
import type { Segment } from "../../core/timeline/timeline-types";
import { createDefaultRuleConfig } from "../../core/timeline/timeline-types";

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

describe("createMinSilenceFilter", () => {
  it("should keep speech segments", () => {
    const filter = createMinSilenceFilter(500);
    const segments = [seg("speech", 0, 100), seg("silence", 100, 700)];
    const result = filter(segments);
    expect(result.length).toBe(2);
  });

  it("should remove short silence segments", () => {
    const filter = createMinSilenceFilter(500);
    const segments = [seg("speech", 0, 100), seg("silence", 100, 300)];
    const result = filter(segments);
    expect(result.length).toBe(1);
  });

  it("should keep long silence segments", () => {
    const filter = createMinSilenceFilter(500);
    const segments = [seg("speech", 0, 100), seg("silence", 100, 800)];
    const result = filter(segments);
    expect(result.length).toBe(2);
  });
});

describe("createMinSpeechFilter", () => {
  it("should keep silence segments", () => {
    const filter = createMinSpeechFilter(300);
    const segments = [seg("silence", 0, 100), seg("speech", 100, 500)];
    const result = filter(segments);
    expect(result.length).toBe(2);
  });

  it("should remove short speech segments", () => {
    const filter = createMinSpeechFilter(300);
    const segments = [seg("silence", 0, 100), seg("speech", 100, 200)];
    const result = filter(segments);
    expect(result.length).toBe(1);
  });

  it("should keep long speech segments", () => {
    const filter = createMinSpeechFilter(300);
    const segments = [seg("silence", 0, 100), seg("speech", 100, 500)];
    const result = filter(segments);
    expect(result.length).toBe(2);
  });
});

describe("createPauseCompressor", () => {
  it("should not modify speech segments", () => {
    const compressor = createPauseCompressor(2000, 200);
    const segments = [seg("speech", 0, 500)];
    const result = compressor(segments);
    expect(result[0].startMs).toBe(0);
    expect(result[0].endMs).toBe(500);
  });

  it("should not compress short silence", () => {
    const compressor = createPauseCompressor(2000, 200);
    const segments = [seg("silence", 100, 300)];
    const result = compressor(segments);
    expect(result[0].startMs).toBe(100);
    expect(result[0].endMs).toBe(300);
  });

  it("should compress long silence to target duration", () => {
    const compressor = createPauseCompressor(2000, 200);
    const segments = [seg("silence", 1000, 5000)];
    const result = compressor(segments);
    expect(result[0].endMs - result[0].startMs).toBe(200);
  });
});

describe("createPaddingExpander", () => {
  it("should expand speech segments by paddingMs", () => {
    const expander = createPaddingExpander(50);
    const segments = [seg("speech", 100, 200)];
    const result = expander(segments);
    expect(result[0].startMs).toBe(50);
    expect(result[0].endMs).toBe(250);
  });

  it("should not go below 0ms", () => {
    const expander = createPaddingExpander(100);
    const segments = [seg("speech", 50, 200)];
    const result = expander(segments);
    expect(result[0].startMs).toBe(0);
  });
});

describe("createMerger", () => {
  it("should merge adjacent same-type segments within gap", () => {
    const merger = createMerger(300);
    const segments = [
      seg("speech", 0, 100),
      seg("speech", 200, 300),
      seg("speech", 400, 500),
    ];
    const result = merger(segments);
    expect(result.length).toBe(1);
    expect(result[0].startMs).toBe(0);
    expect(result[0].endMs).toBe(500);
  });

  it("should not merge segments with large gap", () => {
    const merger = createMerger(300);
    const segments = [seg("speech", 0, 100), seg("speech", 500, 600)];
    const result = merger(segments);
    expect(result.length).toBe(2);
  });

  it("should not merge different types", () => {
    const merger = createMerger(300);
    const segments = [seg("speech", 0, 100), seg("silence", 100, 200)];
    const result = merger(segments);
    expect(result.length).toBe(2);
  });
});

describe("composeRules", () => {
  it("should apply rules in sequence", () => {
    const pipeline = composeRules(
      createMinSilenceFilter(500),
      createMinSpeechFilter(300),
    );
    const segments = [
      seg("speech", 0, 100), // short speech
      seg("silence", 100, 200), // short silence
      seg("speech", 200, 500), // long speech
      seg("silence", 500, 1200), // long silence
    ];
    const result = pipeline(segments);
    expect(result.length).toBe(2);
  });
});

describe("buildRulesPipeline", () => {
  it("should build complete pipeline from config", () => {
    const config = createDefaultRuleConfig();
    const pipeline = buildRulesPipeline(config);
    expect(pipeline).toBeInstanceOf(Function);
  });

  it("should produce valid output for realistic input", () => {
    const config = createDefaultRuleConfig();
    const pipeline = buildRulesPipeline(config);
    const segments = [
      seg("speech", 0, 1000),
      seg("silence", 1000, 1500),
      seg("speech", 1500, 3000),
      seg("silence", 3000, 3100),
      seg("speech", 3100, 5000),
    ];
    const result = pipeline(segments);
    expect(result.length).toBeGreaterThan(0);
    expect(result.every((s) => s.endMs > s.startMs)).toBe(true);
  });
});
