import { EditEntry, Segment, TimelineSettings, TimelineStats, UserOverride } from '../core/timeline/timeline-types';
import { VADFrame } from '../core/vad/vad-types';
import { ExportProgress } from '../core/export/hybrid-exporter';

export interface FileMetadata {
  name: string;
  sizeBytes: number;
  type: string;
  durationSec: number;
  url: string;
}

export type ProcessingStatus = 'idle' | 'extracting' | 'analyzing_vad' | 'ready' | 'exporting' | 'error';

export interface ProcessingState {
  status: ProcessingStatus;
  progressPercent: number;
  stageMessage: string;
  errorMessage?: string;
  pcmData: Float32Array | null;
  sampleRate: number;
  vadFrames: VADFrame[];
  estimatedNoiseFloorDb: number;
}

export interface TimelineState {
  initialSegments: Segment[];
  settings: TimelineSettings;
  userOverrides: UserOverride[];
  edlEntries: EditEntry[];
  stats: TimelineStats;
}

export interface PreviewState {
  currentTimeMs: number;
  isPlaying: boolean;
  playbackRate: number;
  compareMode: 'cut' | 'original';
  zoomLevel: number;
  hoverTimestampMs: number | null;
}

export interface ExportState {
  isExporting: boolean;
  progress: ExportProgress | null;
  exportedBlob: Blob | null;
  exportedUrl: string | null;
}
