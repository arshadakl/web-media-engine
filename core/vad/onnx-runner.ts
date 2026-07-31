/**
 * ONNX Runtime wrapper for Silero VAD inference.
 * Handles model loading, inference, and error recovery.
 */

import * as ort from "onnxruntime-web";
import type { LSTMState, VADInferenceResult } from "./vad-types";
import { createLogger } from "../utils/logger";

const logger = createLogger("onnx-runner");

export interface ONNXRunnerOptions {
  /** Path to the ONNX model file */
  modelUrl: string;
  /** Execution provider (default: 'wasm') */
  executionProvider?: "wasm" | "webgl" | "cpu";
}

const LSTM_SIZE = 128;

/**
 * Create initial LSTM state (zeros).
 * @returns Initial LSTM state with zeroed h and c tensors
 */
export function createInitialLSTMState(): LSTMState {
  return {
    h: new Float32Array(LSTM_SIZE),
    c: new Float32Array(LSTM_SIZE),
  };
}

/**
 * ONNX Runtime runner for Silero VAD model.
 */
export class ONNXRunner {
  private session: ort.InferenceSession | null = null;
  private readonly modelUrl: string;
  private readonly executionProvider: string;

  constructor(options: ONNXRunnerOptions) {
    this.modelUrl = options.modelUrl;
    this.executionProvider = options.executionProvider ?? "wasm";
  }

  /**
   * Load the ONNX model.
   */
  async initialize(): Promise<void> {
    try {
      logger.info(`Loading ONNX model from ${this.modelUrl}`);

      ort.env.wasm.numThreads = navigator.hardwareConcurrency || 4;

      this.session = await ort.InferenceSession.create(this.modelUrl, {
        executionProviders: [this.executionProvider],
      });

      logger.info("ONNX model loaded successfully");
    } catch (error) {
      logger.error("Failed to load ONNX model", error);
      throw error;
    }
  }

  /**
   * Run inference on a single audio window.
   * @param audioData - Float32Array of 512 samples (32ms at 16kHz)
   * @param state - Previous LSTM state
   * @returns Inference result with speech probability and new LSTM state
   */
  async infer(
    audioData: Float32Array,
    state: LSTMState,
  ): Promise<VADInferenceResult> {
    if (!this.session) {
      throw new Error("ONNX session not initialized. Call initialize() first.");
    }

    // Ensure correct input size
    const input =
      audioData.length === 512 ? audioData : audioData.slice(0, 512);

    // Create input tensor [1, 512]
    const inputTensor = new ort.Tensor("float32", input, [1, 512]);

    // Create state tensors [1, 1, 128]
    const hTensor = new ort.Tensor("float32", state.h, [1, 1, LSTM_SIZE]);
    const cTensor = new ort.Tensor("float32", state.c, [1, 1, LSTM_SIZE]);

    // Create sr tensor (sample rate)
    const srTensor = new ort.Tensor("int64", BigInt(16000), [1]);

    try {
      const results = await this.session.run({
        input: inputTensor,
        h: hTensor,
        c: cTensor,
        sr: srTensor,
      });

      // Extract outputs
      const outputTensor = results.output;
      const hOutput = results.hn;
      const cOutput = results.cn;

      const speechProb = (outputTensor.data as Float32Array)[0];
      const newH = new Float32Array(hOutput.data as Float32Array);
      const newC = new Float32Array(cOutput.data as Float32Array);

      return {
        speechProb,
        h: newH,
        c: newC,
      };
    } catch (error) {
      logger.error("ONNX inference failed", error);
      throw error;
    }
  }

  /**
   * Reset the ONNX session (for crash recovery).
   */
  async reset(): Promise<void> {
    this.session = null;
    await this.initialize();
  }

  /**
   * Check if the model is loaded.
   */
  isReady(): boolean {
    return this.session !== null;
  }

  /**
   * Release resources.
   */
  dispose(): void {
    this.session = null;
  }
}

/**
 * Create an ONNX runner instance.
 * @param options - Configuration options
 * @returns ONNXRunner instance
 */
export function createONNXRunner(options: ONNXRunnerOptions): ONNXRunner {
  return new ONNXRunner(options);
}
