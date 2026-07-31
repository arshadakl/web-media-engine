import { describe, it, expect } from "vitest";
import {
  toggleEntry,
  setEntryAction,
  applyOverrides,
  findEntryAtTime,
} from "../../core/preview/cut-editor";
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
    ],
    totalDurationMs: 3500,
    outputDurationMs: 2500,
  };
}

describe("toggleEntry", () => {
  it("should toggle keep to cut", () => {
    const edl = createTestEDL();
    const result = toggleEntry(edl, 0);
    expect(result.entries[0].action).toBe("cut");
  });

  it("should toggle cut to keep", () => {
    const edl = createTestEDL();
    const result = toggleEntry(edl, 1);
    expect(result.entries[1].action).toBe("keep");
  });

  it("should not modify other entries", () => {
    const edl = createTestEDL();
    const result = toggleEntry(edl, 0);
    expect(result.entries[1].action).toBe("cut");
    expect(result.entries[2].action).toBe("keep");
  });

  it("should handle invalid index", () => {
    const edl = createTestEDL();
    const result = toggleEntry(edl, 10);
    expect(result).toBe(edl);
  });
});

describe("setEntryAction", () => {
  it("should set entry to cut", () => {
    const edl = createTestEDL();
    const result = setEntryAction(edl, 0, "cut");
    expect(result.entries[0].action).toBe("cut");
  });

  it("should set entry to keep", () => {
    const edl = createTestEDL();
    const result = setEntryAction(edl, 1, "keep");
    expect(result.entries[1].action).toBe("keep");
  });
});

describe("applyOverrides", () => {
  it("should apply multiple overrides", () => {
    const edl = createTestEDL();
    const result = applyOverrides(edl, [
      { entryIndex: 0, newAction: "cut" },
      { entryIndex: 1, newAction: "keep" },
    ]);
    expect(result.entries[0].action).toBe("cut");
    expect(result.entries[1].action).toBe("keep");
  });

  it("should handle empty overrides", () => {
    const edl = createTestEDL();
    const result = applyOverrides(edl, []);
    expect(result.entries).toEqual(edl.entries);
  });
});

describe("findEntryAtTime", () => {
  it("should find entry at time", () => {
    const edl = createTestEDL();
    expect(findEntryAtTime(edl, 500)).toBe(0);
    expect(findEntryAtTime(edl, 1500)).toBe(1);
    expect(findEntryAtTime(edl, 2500)).toBe(2);
  });

  it("should return -1 for time outside range", () => {
    const edl = createTestEDL();
    expect(findEntryAtTime(edl, 5000)).toBe(-1);
  });
});
