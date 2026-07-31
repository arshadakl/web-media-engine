import { describe, it, expect } from "vitest";
import {
  generateStreamCopyCommand,
  generateConcatList,
  generateConcatCommand,
} from "../../core/export/stream-copy";
import type { ExportTask } from "../../core/export/hybrid-exporter";

function createTestTask(): ExportTask {
  return {
    type: "copy",
    entryIndex: 0,
    startMs: 1000,
    endMs: 5000,
    gopStartMs: 1000,
    gopEndMs: 5000,
  };
}

describe("generateStreamCopyCommand", () => {
  it("should generate correct ffmpeg command", () => {
    const cmd = generateStreamCopyCommand(
      createTestTask(),
      "input.mp4",
      "output.mp4",
    );
    expect(cmd).toContain("-ss");
    expect(cmd).toContain("1.000");
    expect(cmd).toContain("-to");
    expect(cmd).toContain("5.000");
    expect(cmd).toContain("-c");
    expect(cmd).toContain("copy");
    expect(cmd).toContain("-avoid_negative_ts");
    expect(cmd).toContain("make_zero");
  });
});

describe("generateConcatList", () => {
  it("should generate concat list", () => {
    const segments = [
      { path: "seg1.mp4" },
      { path: "seg2.mp4" },
      { path: "seg3.mp4" },
    ];
    const list = generateConcatList(segments);
    expect(list).toContain("file 'seg1.mp4'");
    expect(list).toContain("file 'seg2.mp4'");
    expect(list).toContain("file 'seg3.mp4'");
  });
});

describe("generateConcatCommand", () => {
  it("should generate concat command", () => {
    const cmd = generateConcatCommand("list.txt", "output.mp4");
    expect(cmd).toContain("-f");
    expect(cmd).toContain("concat");
    expect(cmd).toContain("-safe");
    expect(cmd).toContain("0");
    expect(cmd).toContain("-c");
    expect(cmd).toContain("copy");
  });
});
