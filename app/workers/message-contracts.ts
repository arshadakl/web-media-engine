import type { VADFrame } from "../../core/vad/vad-types";

export interface WorkerMessage {
  type: string;
  id: number;
  payload?: unknown;
}

export interface WorkerResponse {
  type: string;
  id: number;
  payload?: unknown;
  error?: string;
}

export interface VADWorkerRequest extends WorkerMessage {
  type: "process-chunk";
  payload: {
    pcmData: Float32Array;
    sampleRate: number;
  };
}

export interface VADWorkerResponse extends WorkerResponse {
  type: "chunk-result" | "init-complete";
  payload?: {
    frames: VADFrame[];
  };
}

export interface ExportWorkerRequest extends WorkerMessage {
  type: "start-export" | "cancel-export";
  payload?: {
    edl: unknown;
    file: File;
  };
}

export interface ExportWorkerResponse extends WorkerResponse {
  type:
    "export-progress" | "export-complete" | "export-error" | "export-cancelled";
  payload?: {
    progress: number;
    step: string;
    outputPath?: string;
  };
}

let messageId = 0;

export function createMessageId(): number {
  return ++messageId;
}

export function createVADMessage(
  pcmData: Float32Array,
  sampleRate: number,
): VADWorkerRequest {
  return {
    type: "process-chunk",
    id: createMessageId(),
    payload: { pcmData, sampleRate },
  };
}

export function createExportStartMessage(
  edl: unknown,
  file: File,
): ExportWorkerRequest {
  return {
    type: "start-export",
    id: createMessageId(),
    payload: { edl, file },
  };
}

export function createExportCancelMessage(): ExportWorkerRequest {
  return {
    type: "cancel-export",
    id: createMessageId(),
  };
}
