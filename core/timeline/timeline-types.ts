export type SegmentType = 'speech' | 'silence';

export interface Segment {
  id: string;
  type: SegmentType;
  startMs: number;
  endMs: number;
  avgSpeechProb: number;
}

export type EditAction = 'keep' | 'cut';

export interface EditEntry {
  id: string;
  action: EditAction;
  startMs: number;
  endMs: number;
  durationMs: number;
  avgSpeechProb: number;
  isCompressedPause?: boolean;
  originalStartMs: number;
  originalEndMs: number;
}

export interface UserOverride {
  id: string;
  startMs: number;
  endMs: number;
  forcedAction: EditAction;
}

export interface TimelineSettings {
  minSilenceMs: number; // default 600
  minSpeechMs: number; // default 100
  pauseCompressionThresholdMs: number; // default 1200
  targetPauseDurationMs: number; // default 250
  paddingMs: number; // default 150
  mergeGapMs: number; // default 300
  speechThreshold: number; // 0.75
  silenceThreshold: number; // 0.35
  enablePauseCompression: boolean;
}

export const DEFAULT_TIMELINE_SETTINGS: TimelineSettings = {
  minSilenceMs: 600,
  minSpeechMs: 100,
  pauseCompressionThresholdMs: 1200,
  targetPauseDurationMs: 250,
  paddingMs: 150,
  mergeGapMs: 300,
  speechThreshold: 0.75,
  silenceThreshold: 0.35,
  enablePauseCompression: true,
};

export interface TimelineStats {
  originalDurationMs: number;
  outputDurationMs: number;
  timeSavedMs: number;
  timeSavedPercent: number;
  totalCuts: number;
  totalKeeps: number;
  compressedPausesCount: number;
  averageCutDurationMs: number;
}
