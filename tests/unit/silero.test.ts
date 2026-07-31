import { describe, it, expect } from "vitest";
import { SileroVAD, createSileroVAD } from "../../core/vad/silero";
import type { LSTMState } from "../../core/vad/vad-types";

// Mock inference function that returns predictable results
const createMockInferFn = (speechProbSequence: number[]) => {
  let callIndex = 0;
  return async (_input: Float32Array, _state: LSTMState) => ({
    speechProb: speechProbSequence[callIndex++] ?? 0,
    h: new Float32Array(128),
    c: new Float32Array(128),
  });
};

describe("SileroVAD", () => {
  describe("createSileroVAD", () => {
    it("should create a VAD instance", () => {
      const vad = createSileroVAD();
      expect(vad).toBeInstanceOf(SileroVAD);
    });

    it("should use default options", () => {
      const vad = createSileroVAD();
      const options = vad.getOptions();
      expect(options.speechThreshold).toBe(0.75);
      expect(options.nonSpeechThreshold).toBe(0.35);
      expect(options.minNonSpeechFrames).toBe(3);
    });
  });

  describe("hysteresis", () => {
    it("should transition from non-speech to speech when threshold exceeded", async () => {
      const vad = createSileroVAD({ speechThreshold: 0.75 });
      const inferFn = createMockInferFn([0.8]); // Above threshold

      // Create a chunk with 512 samples
      const pcm = new Float32Array(512).fill(0.5);
      const frames = await vad.processChunk(pcm, inferFn);

      expect(frames.length).toBe(1);
      expect(frames[0].isSpeech).toBe(true);
    });

    it("should stay non-speech when below threshold", async () => {
      const vad = createSileroVAD({ speechThreshold: 0.75 });
      const inferFn = createMockInferFn([0.5]); // Below threshold

      const pcm = new Float32Array(512).fill(0.5);
      const frames = await vad.processChunk(pcm, inferFn);

      expect(frames.length).toBe(1);
      expect(frames[0].isSpeech).toBe(false);
    });

    it("should require multiple frames to transition from speech to non-speech", async () => {
      const vad = createSileroVAD({
        speechThreshold: 0.75,
        nonSpeechThreshold: 0.35,
        minNonSpeechFrames: 3,
      });

      // Start with speech, then drop below threshold
      const inferFn = createMockInferFn([0.8, 0.2, 0.2, 0.2, 0.2, 0.2]);
      const pcm1 = new Float32Array(512 * 5).fill(0.5); // 5 frames
      const frames1 = await vad.processChunk(pcm1, inferFn);

      // First frame: speech
      expect(frames1[0].isSpeech).toBe(true);

      // Frames 1-2: below threshold but not enough for transition (need 3)
      expect(frames1[1].isSpeech).toBe(true);
      expect(frames1[2].isSpeech).toBe(true);

      // Frame 3: third consecutive below threshold -> transition to non-speech
      expect(frames1[3].isSpeech).toBe(false);
    });
  });

  describe("LSTM state", () => {
    it("should get and set LSTM state", () => {
      const vad = createSileroVAD();
      const state: LSTMState = {
        h: new Float32Array(128).fill(0.5),
        c: new Float32Array(128).fill(0.3),
      };

      vad.setLSTMState(state);
      const retrieved = vad.getLSTMState();

      expect(retrieved.h[0]).toBeCloseTo(0.5, 5);
      expect(retrieved.c[0]).toBeCloseTo(0.3, 5);
    });

    it("should deep copy LSTM state to prevent mutation", () => {
      const vad = createSileroVAD();
      const state: LSTMState = {
        h: new Float32Array(128).fill(0.5),
        c: new Float32Array(128).fill(0.3),
      };

      vad.setLSTMState(state);
      const retrieved = vad.getLSTMState();

      // Modify the retrieved state
      retrieved.h[0] = 0.9;

      // Original should be unchanged
      expect(vad.getLSTMState().h[0]).toBe(0.5);
    });
  });

  describe("reset", () => {
    it("should reset VAD state", async () => {
      const vad = createSileroVAD();
      const inferFn = createMockInferFn([0.8, 0.8]);

      const pcm = new Float32Array(1024).fill(0.5);
      await vad.processChunk(pcm, inferFn);

      vad.reset();
      const state = vad.getLSTMState();

      expect(Array.from(state.h)).toEqual(new Array(128).fill(0));
      expect(Array.from(state.c)).toEqual(new Array(128).fill(0));
    });
  });

  describe("multiple frames", () => {
    it("should process multiple frames in a chunk", async () => {
      const vad = createSileroVAD();
      const inferFn = createMockInferFn([0.8, 0.2, 0.9, 0.1]);

      // Create chunk with enough samples for 4 frames (4 * 512 = 2048)
      const pcm = new Float32Array(2048).fill(0.5);
      const frames = await vad.processChunk(pcm, inferFn);

      expect(frames.length).toBe(4);
      expect(frames[0].speechProb).toBe(0.8);
      expect(frames[1].speechProb).toBe(0.2);
      expect(frames[2].speechProb).toBe(0.9);
      expect(frames[3].speechProb).toBe(0.1);
    });

    it("should set correct timestamps", async () => {
      const vad = createSileroVAD({ sampleRate: 16000 });
      const inferFn = createMockInferFn([0.5, 0.5]);

      const pcm = new Float32Array(1024).fill(0.5);
      const frames = await vad.processChunk(pcm, inferFn);

      // 512 samples at 16kHz = 32ms per frame
      expect(frames[0].startMs).toBe(0);
      expect(frames[0].endMs).toBeCloseTo(32, 0);
      expect(frames[1].startMs).toBeCloseTo(32, 0);
      expect(frames[1].endMs).toBeCloseTo(64, 0);
    });
  });
});
