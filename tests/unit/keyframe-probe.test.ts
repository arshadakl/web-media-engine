import { describe, it, expect } from "vitest";
import {
  parseKeyframeTimestamps,
  nearestKeyframeBefore,
  nearestKeyframeAfter,
  findKeyframesInRange,
} from "../../core/export/keyframe-probe";

describe("parseKeyframeTimestamps", () => {
  it("should parse ffprobe output", () => {
    const ffprobeOutput = `packet|...|pts_time:0
packet|...|pts_time:2.0
packet|...|pts_time:4.0
packet|...|pts_time:6.0`;
    const result = parseKeyframeTimestamps(ffprobeOutput, 10000);
    expect(result.timestamps.length).toBe(4);
    expect(result.timestamps[0]).toBe(0);
    expect(result.timestamps[1]).toBe(2000);
    expect(result.timestamps[2]).toBe(4000);
    expect(result.timestamps[3]).toBe(6000);
  });

  it("should sort timestamps", () => {
    const ffprobeOutput = `packet|...|pts_time:4.0
packet|...|pts_time:0
packet|...|pts_time:2.0`;
    const result = parseKeyframeTimestamps(ffprobeOutput, 10000);
    expect(result.timestamps[0]).toBe(0);
    expect(result.timestamps[1]).toBe(2000);
    expect(result.timestamps[2]).toBe(4000);
  });

  it("should handle empty output", () => {
    const result = parseKeyframeTimestamps("", 10000);
    expect(result.timestamps.length).toBe(0);
  });
});

describe("nearestKeyframeBefore", () => {
  const keyframes = {
    timestamps: new Float64Array([0, 2000, 4000, 6000]),
    durationMs: 10000,
  };

  it("should find keyframe before time", () => {
    expect(nearestKeyframeBefore(keyframes, 3000)).toBe(2000);
  });

  it("should return 0 if no keyframe before", () => {
    expect(nearestKeyframeBefore(keyframes, 100)).toBe(0);
  });

  it("should return exact keyframe", () => {
    expect(nearestKeyframeBefore(keyframes, 2000)).toBe(2000);
  });
});

describe("nearestKeyframeAfter", () => {
  const keyframes = {
    timestamps: new Float64Array([0, 2000, 4000, 6000]),
    durationMs: 10000,
  };

  it("should find keyframe after time", () => {
    expect(nearestKeyframeAfter(keyframes, 1000)).toBe(2000);
  });

  it("should return duration if no keyframe after", () => {
    expect(nearestKeyframeAfter(keyframes, 7000)).toBe(10000);
  });

  it("should return exact keyframe", () => {
    expect(nearestKeyframeAfter(keyframes, 2000)).toBe(2000);
  });
});

describe("findKeyframesInRange", () => {
  const keyframes = {
    timestamps: new Float64Array([0, 2000, 4000, 6000, 8000]),
    durationMs: 10000,
  };

  it("should find keyframes in range", () => {
    const result = findKeyframesInRange(keyframes, 1000, 5000);
    expect(result).toEqual([2000, 4000]);
  });

  it("should handle empty range", () => {
    const result = findKeyframesInRange(keyframes, 3000, 3500);
    expect(result).toEqual([]);
  });
});
