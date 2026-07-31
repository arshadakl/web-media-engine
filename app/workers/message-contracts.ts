/**
 * Shared message contracts for worker communication.
 * All worker message types must be defined here to ensure type safety.
 */

export interface WorkerMessage<T = unknown> {
  id: string;
  type: string;
  payload: T;
}

export interface WorkerResponse<T = unknown> {
  id: string;
  type: string;
  payload: T;
  workerId: number;
}

// --- Audio Worker Messages ---

export interface ExtractAudioPayload {
  fileHandle: FileSystemFileHandle | File;
  sampleRate?: number;
}

export interface ExtractAudioResponse {
  pcmData: Float32Array;
  sampleRate: number;
  duration: number;
}

// --- VAD Worker Messages ---

export interface AnalyzeAudioPayload {
  pcmData: Float32Array;
  sampleRate: number;
  chunkIndex: number;
}

export interface VADFrame {
  startMs: number;
  endMs: number;
  speechProb: number;
  isSpeech: boolean;
}

export interface AnalyzeAudioResponse {
  frames: VADFrame[];
  chunkIndex: number;
}

// --- Timeline Worker Messages ---

export interface BuildTimelinePayload {
  frames: VADFrame[];
  minSilenceMs: number;
  minSpeechMs: number;
  paddingMs: number;
  mergeGapMs: number;
}

export interface TimelineSegment {
  type: "speech" | "silence";
  startMs: number;
  endMs: number;
  avgSpeechProb: number;
}

export interface BuildTimelineResponse {
  segments: TimelineSegment[];
}

// --- Export Worker Messages ---

export interface ExportVideoPayload {
  edl: EditEntry[];
  fileHandle: FileSystemFileHandle | File;
}

export interface EditEntry {
  action: "keep" | "cut";
  startMs: number;
  endMs: number;
}

export interface ExportProgress {
  stage: "analyzing" | "copying" | "reencoding" | "muxing" | "saving";
  percent: number;
}

export interface ExportVideoResponse {
  success: boolean;
  outputUrl?: string;
  error?: string;
}

// --- Message Type Constants ---

export const MESSAGE_TYPES = {
  // Audio
  EXTRACT_AUDIO: "extract-audio",
  EXTRACT_AUDIO_RESULT: "extract-audio-result",

  // VAD
  ANALYZE_AUDIO: "analyze-audio",
  ANALYZE_AUDIO_RESULT: "analyze-audio-result",

  // Timeline
  BUILD_TIMELINE: "build-timeline",
  BUILD_TIMELINE_RESULT: "build-timeline-result",

  // Export
  EXPORT_VIDEO: "export-video",
  EXPORT_VIDEO_RESULT: "export-video-result",
  EXPORT_PROGRESS: "export-progress",

  // Common
  ERROR: "error",
} as const;

export type MessageType = (typeof MESSAGE_TYPES)[keyof typeof MESSAGE_TYPES];
