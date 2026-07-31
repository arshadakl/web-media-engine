import { describe, it, expect } from "vitest";
import { createSeekEngine } from "../../core/preview/seek-engine";
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
        endMs: 4000,
        startSample: 154350,
        endSample: 176400,
      },
      {
        action: "keep",
        startMs: 4000,
        endMs: 5000,
        startSample: 176400,
        endSample: 220500,
      },
    ],
    totalDurationMs: 5000,
    outputDurationMs: 3500,
  };
}

describe("createSeekEngine", () => {
  it("should initialize with first keep entry", () => {
    const engine = createSeekEngine(createTestEDL());
    const state = engine.getState();
    expect(state.currentEntryIndex).toBe(0);
    expect(state.currentTimeMs).toBe(0);
  });

  it("should have 3 keep entries", () => {
    const engine = createSeekEngine(createTestEDL());
    expect(engine.keepEntries.length).toBe(3);
  });

  it("should return correct source time", () => {
    const engine = createSeekEngine(createTestEDL());
    expect(engine.getSourceTimeMs()).toBe(0);
  });

  it("should return correct output time", () => {
    const engine = createSeekEngine(createTestEDL());
    expect(engine.getOutputTimeMs()).toBe(0);
  });
});

describe("seekTo", () => {
  it("should seek to correct source position", () => {
    const engine = createSeekEngine(createTestEDL());
    engine.seekTo(500); // 500ms output = 500ms in first keep entry
    expect(engine.getSourceTimeMs()).toBe(500);
  });

  it("should seek into second keep entry", () => {
    const engine = createSeekEngine(createTestEDL());
    engine.seekTo(1200); // 1000ms (first entry) + 200ms into second
    expect(engine.getSourceTimeMs()).toBe(2200);
  });

  it("should handle seek past end", () => {
    const engine = createSeekEngine(createTestEDL());
    engine.seekTo(10000);
    const state = engine.getState();
    expect(state.isPlaying).toBe(false);
  });
});

describe("nextSegment", () => {
  it("should advance to next keep entry", () => {
    const engine = createSeekEngine(createTestEDL());
    engine.nextSegment();
    expect(engine.getState().currentEntryIndex).toBe(1);
    expect(engine.getSourceTimeMs()).toBe(2000);
  });

  it("should stop at last entry", () => {
    const engine = createSeekEngine(createTestEDL());
    engine.nextSegment();
    engine.nextSegment();
    engine.nextSegment();
    const state = engine.getState();
    expect(state.isPlaying).toBe(false);
  });
});

describe("previousSegment", () => {
  it("should go to previous keep entry", () => {
    const engine = createSeekEngine(createTestEDL());
    engine.seekTo(1500); // Go to second keep entry
    engine.previousSegment();
    expect(engine.getState().currentEntryIndex).toBe(0);
  });

  it("should stay at first entry", () => {
    const engine = createSeekEngine(createTestEDL());
    engine.previousSegment();
    expect(engine.getState().currentEntryIndex).toBe(0);
  });
});

describe("shouldSeek", () => {
  it("should return false when within current entry", () => {
    const engine = createSeekEngine(createTestEDL());
    expect(engine.shouldSeek(500)).toBe(false);
  });

  it("should return true when outside current entry", () => {
    const engine = createSeekEngine(createTestEDL());
    expect(engine.shouldSeek(1500)).toBe(true); // In cut region
  });

  it("should return true before current entry", () => {
    const engine = createSeekEngine(createTestEDL());
    engine.seekTo(2500); // Second keep entry
    expect(engine.shouldSeek(500)).toBe(true); // Before this entry
  });
});

describe("10-segment EDL", () => {
  it("should handle 10 keep segments correctly", () => {
    const entries = [];
    for (let i = 0; i < 10; i++) {
      entries.push({
        action: "keep" as const,
        startMs: i * 2000,
        endMs: i * 2000 + 1500,
        startSample: 0,
        endSample: 0,
      });
      entries.push({
        action: "cut" as const,
        startMs: i * 2000 + 1500,
        endMs: (i + 1) * 2000,
        startSample: 0,
        endSample: 0,
      });
    }
    const edl: EDL = {
      entries,
      totalDurationMs: 20000,
      outputDurationMs: 15000,
    };
    const engine = createSeekEngine(edl);

    expect(engine.keepEntries.length).toBe(10);

    // Navigate through all segments
    for (let i = 0; i < 9; i++) {
      engine.nextSegment();
      expect(engine.getState().currentEntryIndex).toBe(i + 1);
      expect(engine.getSourceTimeMs()).toBe((i + 1) * 2000);
    }
  });
});
