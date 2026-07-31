/**
 * VAD (Voice Activity Detection) type definitions.
 * Shared types for Silero VAD and related modules.
 */

export interface VADFrame {
  startMs: number;
  endMs: number;
  speechProb: number;
  isSpeech: boolean;
}

export interface VADOptions {
  /** Speech probability threshold for non-speech → speech transition (default: 0.75) */
  speechThreshold?: number;
  /** Speech probability threshold for speech → non-speech transition (default: 0.35) */
  nonSpeechThreshold?: number;
  /** Number of consecutive frames below threshold to confirm non-speech (default: 3) */
  minNonSpeechFrames?: number;
  /** Sample rate expected by the model (default: 16000) */
  sampleRate?: number;
  /** Window size in samples (default: 512) */
  windowSize?: number;
}

export interface LSTMState {
  h: Float32Array;
  c: Float32Array;
}

export interface VADInferenceResult {
  speechProb: number;
  h: Float32Array;
  c: Float32Array;
}

export interface SileroVADConfig {
  modelUrl: string;
  sampleRate: number;
  windowSize: number;
}

export const DEFAULT_VAD_OPTIONS: Required<VADOptions> = {
  speechThreshold: 0.75,
  nonSpeechThreshold: 0.35,
  minNonSpeechFrames: 3,
  sampleRate: 16000,
  windowSize: 512,
};

export const SILERO_DEFAULT_CONFIG: SileroVADConfig = {
  modelUrl: "/models/silero_vad.onnx",
  sampleRate: 16000,
  windowSize: 512,
};
