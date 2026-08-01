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

// VAD Worker Messages
export interface VADWorkerRequest extends WorkerMessage {
  type: "init" | "process-chunk" | "reset";
  payload?: {
    pcmData?: Float32Array;
    sampleRate?: number;
  };
}

export interface VADWorkerResponse extends WorkerResponse {
  type: "init-complete" | "chunk-result" | "reset-complete" | "error";
  payload?: {
    frames?: VADFrame[];
  };
}

// Export Worker Messages
export interface ExportWorkerRequest extends WorkerMessage {
  type: "init" | "start-export" | "cancel-export";
  payload?: {
    edl?: unknown;
    file?: File;
    sampleRate?: number;
  };
}

export interface ExportWorkerResponse extends WorkerResponse {
  type:
    | "init-complete"
    | "export-progress"
    | "export-complete"
    | "export-error"
    | "export-cancelled";
  payload?: {
    progress?: number;
    step?: string;
    outputPath?: string;
    filename?: string;
  };
}

let messageId = 0;

export function createMessageId(): number {
  return ++messageId;
}

// VAD Messages
export function createVADInitMessage(): VADWorkerRequest {
  return { type: "init", id: createMessageId() };
}

export function createVADProcessMessage(
  pcmData: Float32Array,
  sampleRate: number,
): VADWorkerRequest {
  return {
    type: "process-chunk",
    id: createMessageId(),
    payload: { pcmData, sampleRate },
  };
}

export function createVADResetMessage(): VADWorkerRequest {
  return { type: "reset", id: createMessageId() };
}

// Export Messages
export function createExportInitMessage(): ExportWorkerRequest {
  return { type: "init", id: createMessageId() };
}

export function createExportStartMessage(
  edl: unknown,
  file: File,
  sampleRate: number = 44100,
): ExportWorkerRequest {
  return {
    type: "start-export",
    id: createMessageId(),
    payload: { edl, file, sampleRate },
  };
}

export function createExportCancelMessage(): ExportWorkerRequest {
  return { type: "cancel-export", id: createMessageId() };
}
