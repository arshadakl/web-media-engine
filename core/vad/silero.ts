/**
 * Silero VAD wrapper for voice activity detection.
 * Processes audio chunks and emits VAD frames with hysteresis.
 */

import type { VADFrame, VADOptions, LSTMState } from "./vad-types";
import { DEFAULT_VAD_OPTIONS } from "./vad-types";
import { createLogger } from "../utils/logger";

const _logger = createLogger("silero-vad");

/**
 * Hysteresis state tracker for VAD.
 */
class HysteresisTracker {
  private isCurrentlySpeech = false;
  private consecutiveNonSpeechFrames = 0;
  private readonly speechThreshold: number;
  private readonly nonSpeechThreshold: number;
  private readonly minNonSpeechFrames: number;

  constructor(options: Required<VADOptions>) {
    this.speechThreshold = options.speechThreshold;
    this.nonSpeechThreshold = options.nonSpeechThreshold;
    this.minNonSpeechFrames = options.minNonSpeechFrames;
  }

  /**
   * Process a speech probability and return the speech state.
   * @param speechProb - Speech probability (0-1)
   * @returns True if speech is detected
   */
  process(speechProb: number): boolean {
    if (!this.isCurrentlySpeech) {
      // Non-speech → Speech: require probability > speechThreshold
      if (speechProb > this.speechThreshold) {
        this.isCurrentlySpeech = true;
        this.consecutiveNonSpeechFrames = 0;
      }
    } else {
      // Speech → Non-speech: require probability < nonSpeechThreshold for N frames
      if (speechProb < this.nonSpeechThreshold) {
        this.consecutiveNonSpeechFrames++;
        if (this.consecutiveNonSpeechFrames >= this.minNonSpeechFrames) {
          this.isCurrentlySpeech = false;
          this.consecutiveNonSpeechFrames = 0;
        }
      } else {
        this.consecutiveNonSpeechFrames = 0;
      }
    }

    return this.isCurrentlySpeech;
  }

  /**
   * Get the current speech state.
   */
  getCurrentState(): boolean {
    return this.isCurrentlySpeech;
  }

  /**
   * Reset the tracker state.
   */
  reset(): void {
    this.isCurrentlySpeech = false;
    this.consecutiveNonSpeechFrames = 0;
  }
}

/**
 * Silero VAD processor with hysteresis.
 * Processes PCM audio chunks and emits VAD frames.
 */
export class SileroVAD {
  private readonly options: Required<VADOptions>;
  private hysteresis: HysteresisTracker;
  private lstmState: LSTMState;
  private readonly framesPerChunk: number;

  constructor(options: VADOptions = {}) {
    this.options = { ...DEFAULT_VAD_OPTIONS, ...options };
    this.hysteresis = new HysteresisTracker(this.options);
    this.lstmState = {
      h: new Float32Array(128),
      c: new Float32Array(128),
    };
    this.framesPerChunk = Math.floor(this.options.windowSize / 320); // 320 samples = 20ms at 16kHz
  }

  /**
   * Process a chunk of PCM audio and return VAD frames.
   * @param pcmData - Float32Array of PCM samples
   * @param inferFn - Function to run ONNX inference
   * @returns Array of VAD frames
   */
  async processChunk(
    pcmData: Float32Array,
    inferFn: (
      input: Float32Array,
      state: LSTMState,
    ) => Promise<{ speechProb: number; h: Float32Array; c: Float32Array }>,
  ): Promise<VADFrame[]> {
    const frames: VADFrame[] = [];
    const samplesPerFrame = 512; // 32ms at 16kHz
    const frameDurationMs = (samplesPerFrame / this.options.sampleRate) * 1000;

    // Process in 512-sample windows
    for (
      let offset = 0;
      offset + samplesPerFrame <= pcmData.length;
      offset += samplesPerFrame
    ) {
      const window = pcmData.slice(offset, offset + samplesPerFrame);
      const startMs = (offset / this.options.sampleRate) * 1000;
      const endMs = startMs + frameDurationMs;

      // Run inference
      const result = await inferFn(window, this.lstmState);

      // Update LSTM state (deep copy to avoid mutation)
      this.lstmState = {
        h: new Float32Array(result.h),
        c: new Float32Array(result.c),
      };

      // Apply hysteresis
      const isSpeech = this.hysteresis.process(result.speechProb);

      frames.push({
        startMs,
        endMs,
        speechProb: result.speechProb,
        isSpeech,
      });
    }

    return frames;
  }

  /**
   * Get the current LSTM state.
   */
  getLSTMState(): LSTMState {
    return {
      h: new Float32Array(this.lstmState.h),
      c: new Float32Array(this.lstmState.c),
    };
  }

  /**
   * Set the LSTM state.
   */
  setLSTMState(state: LSTMState): void {
    this.lstmState = {
      h: new Float32Array(state.h),
      c: new Float32Array(state.c),
    };
  }

  /**
   * Reset the VAD state.
   */
  reset(): void {
    this.hysteresis.reset();
    this.lstmState = {
      h: new Float32Array(128),
      c: new Float32Array(128),
    };
  }

  /**
   * Get VAD options.
   */
  getOptions(): Required<VADOptions> {
    return { ...this.options };
  }
}

/**
 * Create a Silero VAD instance.
 * @param options - VAD configuration
 * @returns SileroVAD instance
 */
export function createSileroVAD(options?: VADOptions): SileroVAD {
  return new SileroVAD(options);
}
