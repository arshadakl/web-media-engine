import { describe, it, expect } from "vitest";
import {
  isModuleLoaded,
  markModuleLoaded,
  resetModuleState,
  getLoadProgress,
} from "../../core/engine/loader";

describe("Engine Loader", () => {
  it("should start with all modules unloaded", () => {
    resetModuleState();
    expect(isModuleLoaded("ffmpeg")).toBe(false);
    expect(isModuleLoaded("onnx")).toBe(false);
    expect(isModuleLoaded("silero")).toBe(false);
  });

  it("should mark module as loaded", () => {
    resetModuleState();
    markModuleLoaded("ffmpeg");
    expect(isModuleLoaded("ffmpeg")).toBe(true);
    expect(isModuleLoaded("onnx")).toBe(false);
  });

  it("should report load progress", () => {
    resetModuleState();
    markModuleLoaded("ffmpeg");
    const progress = getLoadProgress();
    expect(progress).toHaveLength(3);
    expect(progress.find((p) => p.module === "ffmpeg")?.loaded).toBe(true);
    expect(progress.find((p) => p.module === "onnx")?.loaded).toBe(false);
  });

  it("should reset state", () => {
    markModuleLoaded("ffmpeg");
    markModuleLoaded("onnx");
    resetModuleState();
    expect(isModuleLoaded("ffmpeg")).toBe(false);
    expect(isModuleLoaded("onnx")).toBe(false);
  });
});
