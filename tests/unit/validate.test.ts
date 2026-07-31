import { describe, it, expect } from "vitest";
import {
  parseFFProbeOutput,
  validateOutput,
  validateTimestamps,
} from "../../core/export/validate";
import type { VideoInfo } from "../../core/export/validate";

describe("parseFFProbeOutput", () => {
  it("should parse ffprobe output", () => {
    const output = `codec_name=h264
width=1920
height=1080
r_frame_rate=30/1
duration=60.000000
codec_type=audio
codec_name=aac`;
    const info = parseFFProbeOutput(output);
    expect(info.width).toBe(1920);
    expect(info.height).toBe(1080);
    expect(info.fps).toBe(30);
    expect(info.durationMs).toBe(60000);
    expect(info.hasAudio).toBe(true);
    expect(info.audioCodec).toBe("aac");
  });

  it("should handle video without audio", () => {
    const output = `codec_name=h264
width=1280
height=720
r_frame_rate=24/1
duration=30.000000`;
    const info = parseFFProbeOutput(output);
    expect(info.hasAudio).toBe(false);
  });
});

describe("validateOutput", () => {
  const original: VideoInfo = {
    durationMs: 60000,
    width: 1920,
    height: 1080,
    fps: 30,
    codec: "h264",
    audioCodec: "aac",
    hasAudio: true,
  };

  it("should pass for valid output", () => {
    const output = { ...original };
    const result = validateOutput(original, output, 60000);
    expect(result.valid).toBe(true);
    expect(result.errors.length).toBe(0);
  });

  it("should fail for duration mismatch", () => {
    const output = { ...original, durationMs: 50000 };
    const result = validateOutput(original, output, 60000);
    expect(result.valid).toBe(false);
    expect(result.errors[0]).toContain("Duration mismatch");
  });

  it("should fail for resolution change", () => {
    const output = { ...original, width: 1280, height: 720 };
    const result = validateOutput(original, output, 60000);
    expect(result.valid).toBe(false);
    expect(result.errors[0]).toContain("Resolution changed");
  });

  it("should warn for framerate change", () => {
    const output = { ...original, fps: 24 };
    const result = validateOutput(original, output, 60000);
    expect(result.warnings.length).toBe(1);
    expect(result.warnings[0]).toContain("Framerate changed");
  });

  it("should fail if audio missing", () => {
    const output = { ...original, hasAudio: false };
    const result = validateOutput(original, output, 60000);
    expect(result.valid).toBe(false);
    expect(result.errors[0]).toContain("Audio track missing");
  });
});

describe("validateTimestamps", () => {
  it("should pass for matching durations", () => {
    const result = validateTimestamps(60000, 60000);
    expect(result.valid).toBe(true);
  });

  it("should fail for mismatched durations", () => {
    const result = validateTimestamps(60000, 50000);
    expect(result.valid).toBe(false);
    expect(result.errors[0]).toContain("EDL duration");
  });
});
