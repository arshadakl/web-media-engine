import { describe, it, expect } from "vitest";
import { createInitialLSTMState, ONNXRunner } from "../../core/vad/onnx-runner";

describe("ONNXRunner", () => {
  describe("createInitialLSTMState", () => {
    it("should create zeroed LSTM state", () => {
      const state = createInitialLSTMState();
      expect(state.h.length).toBe(128);
      expect(state.c.length).toBe(128);
      expect(Array.from(state.h)).toEqual(new Array(128).fill(0));
      expect(Array.from(state.c)).toEqual(new Array(128).fill(0));
    });
  });

  describe("ONNXRunner", () => {
    it("should create an instance", () => {
      const runner = new ONNXRunner({ modelUrl: "test.onnx" });
      expect(runner).toBeInstanceOf(ONNXRunner);
    });

    it("should report not ready before initialization", () => {
      const runner = new ONNXRunner({ modelUrl: "test.onnx" });
      expect(runner.isReady()).toBe(false);
    });

    it("should throw when running inference before initialization", async () => {
      const runner = new ONNXRunner({ modelUrl: "test.onnx" });
      const state = createInitialLSTMState();
      const input = new Float32Array(512);

      await expect(runner.infer(input, state)).rejects.toThrow(
        "not initialized",
      );
    });
  });
});
