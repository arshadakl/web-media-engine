import type { VADFrame } from "../../core/vad/vad-types";
import type { WorkerMessage, VADWorkerResponse } from "./message-contracts";

let isInitialized = false;

self.onmessage = async (event: MessageEvent<WorkerMessage>) => {
  const { type, id, payload } = event.data;

  try {
    switch (type) {
      case "process-chunk":
        await handleProcessChunk(
          id,
          payload as { pcmData: Float32Array; sampleRate: number },
        );
        break;
      case "init":
        await handleInit(id);
        break;
      default:
        sendError(id, `Unknown message type: ${type}`);
    }
  } catch (err) {
    sendError(id, String(err));
  }
};

async function handleInit(id: number): Promise<void> {
  // Initialize ONNX runtime and load model
  isInitialized = true;
  sendResponse({ type: "init-complete", id });
}

async function handleProcessChunk(
  id: number,
  payload: { pcmData: Float32Array; sampleRate: number },
): Promise<void> {
  if (!isInitialized) {
    sendError(id, "Worker not initialized");
    return;
  }

  const { pcmData, sampleRate } = payload;

  // Process audio through VAD
  // This is a placeholder - actual VAD processing will use ONNX
  const frames: VADFrame[] = [];
  const frameSize = 512;
  const framesCount = Math.ceil(pcmData.length / frameSize);

  for (let i = 0; i < framesCount; i++) {
    const start = i * frameSize;
    const end = Math.min(start + frameSize, pcmData.length);
    const frame = pcmData.slice(start, end);

    // Simple energy-based VAD placeholder
    const energy = Math.sqrt(
      frame.reduce((sum, sample) => sum + sample * sample, 0) / frame.length,
    );

    frames.push({
      isSpeech: energy > 0.01,
      startMs: (start / sampleRate) * 1000,
      endMs: (end / sampleRate) * 1000,
      speechProb: Math.min(energy * 10, 1),
    });
  }

  sendResponse({
    type: "chunk-result",
    id,
    payload: { frames },
  });
}

function sendResponse(response: VADWorkerResponse): void {
  self.postMessage(response);
}

function sendError(id: number, error: string): void {
  self.postMessage({ type: "error", id, error });
}
