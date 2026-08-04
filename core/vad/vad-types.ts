export interface VADFrame {
  frameIndex: number;
  startMs: number;
  endMs: number;
  speechProb: number;
  isSpeech: boolean;
}

export interface AudioChunk {
  index: number;
  pcmData: Float32Array;
  startMs: number;
  endMs: number;
  sampleRate: number;
}

export interface VADConfig {
  sampleRate: number; // 16000 Hz expected for Silero VAD
  windowSizeSamples: number; // 512 samples = 32ms at 16kHz
  speechThreshold: number; // Default 0.75
  silenceThreshold: number; // Default 0.35
  minSpeechDurationFrames: number; // Default 3 frames
  minSilenceDurationFrames: number; // Default 5 frames
  adaptiveNoiseFloor: boolean;
}

export const DEFAULT_VAD_CONFIG: VADConfig = {
  sampleRate: 16000,
  windowSizeSamples: 512,
  speechThreshold: 0.75,
  silenceThreshold: 0.35,
  minSpeechDurationFrames: 3,
  minSilenceDurationFrames: 5,
  adaptiveNoiseFloor: true,
};
