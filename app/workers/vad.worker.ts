import type { VADFrame } from "../../core/vad/vad-types";
import type { WorkerMessage, VADWorkerResponse } from "./message-contracts";

let ort: typeof import("onnxruntime-web") | null = null;
let session: import("onnxruntime-web").InferenceSession | null = null;
let isInitialized = false;
let h: Float32Array = new Float32Array(128).fill(0);
let c: Float32Array = new Float32Array(128).fill(0);

const SAMPLE_RATE = 16000;
const WINDOW_SIZE = 512;
const THRESHOLD = 0.5;
const MIN_SILENCE_FRAMES = 3;
const MIN_SPEECH_FRAMES = 2;

let speechFrameCount = 0;
let silenceFrameCount = 0;

self.onmessage = async (event: MessageEvent<WorkerMessage>) => {
  const { type, id, payload } = event.data;

  try {
    switch (type) {
      case "init":
        await handleInit(id);
        break;
      case "process-chunk":
        await handleProcessChunk(
          id,
          payload as { pcmData: Float32Array; sampleRate: number },
        );
        break;
      case "reset":
        handleReset(id);
        break;
      default:
        sendError(id, `Unknown message type: ${type}`);
    }
  } catch (err) {
    sendError(id, String(err));
  }
};

async function handleInit(id: number): Promise<void> {
  try {
    ort = await import("onnxruntime-web");

    // Configure WASM backend
    ort.env.wasm.numThreads = navigator.hardwareConcurrency || 4;

    // Load model from CDN or cache
    const modelUrl =
      "https://cdn.jsdelivr.net/gh/snakers4/silero-vad@master/src/silero_vad/data/silero_vad.onnx";

    session = await ort.InferenceSession.create(modelUrl, {
      executionProviders: ["wasm"],
    });

    isInitialized = true;
    sendResponse({ type: "init-complete", id });
  } catch (err) {
    sendError(id, `Failed to initialize VAD: ${err}`);
  }
}

async function handleProcessChunk(
  id: number,
  payload: { pcmData: Float32Array; sampleRate: number },
): Promise<void> {
  if (!isInitialized || !session || !ort) {
    sendError(id, "VAD not initialized");
    return;
  }

  const { pcmData, sampleRate } = payload;

  // Resample to 16kHz if needed
  let audioData = pcmData;
  if (sampleRate !== SAMPLE_RATE) {
    audioData = resample(pcmData, sampleRate, SAMPLE_RATE);
  }

  const frames: VADFrame[] = [];

  // Process in window-sized chunks
  for (let i = 0; i < audioData.length; i += WINDOW_SIZE) {
    const window = audioData.slice(
      i,
      Math.min(i + WINDOW_SIZE, audioData.length),
    );

    // Pad if needed
    const paddedWindow = new Float32Array(WINDOW_SIZE);
    paddedWindow.set(window);

    const speechProb = await runInference(paddedWindow);

    // Apply hysteresis
    const startMs = (i / SAMPLE_RATE) * 1000;
    const endMs = ((i + WINDOW_SIZE) / SAMPLE_RATE) * 1000;

    let isSpeech: boolean;
    if (speechProb >= THRESHOLD) {
      isSpeech = true;
      speechFrameCount++;
      silenceFrameCount = 0;
    } else if (speechProb < THRESHOLD * 0.5) {
      // Lower threshold for silence
      silenceFrameCount++;
      if (silenceFrameCount >= MIN_SILENCE_FRAMES) {
        isSpeech = false;
        speechFrameCount = 0;
      } else {
        isSpeech = speechFrameCount >= MIN_SPEECH_FRAMES;
      }
    } else {
      // In between - maintain previous state
      isSpeech = speechFrameCount >= MIN_SPEECH_FRAMES;
    }

    frames.push({
      isSpeech,
      startMs,
      endMs,
      speechProb,
    });
  }

  sendResponse({
    type: "chunk-result",
    id,
    payload: { frames },
  });
}

function handleReset(id: number): void {
  h = new Float32Array(128).fill(0);
  c = new Float32Array(128).fill(0);
  speechFrameCount = 0;
  silenceFrameCount = 0;
  lastSpeechProb = 0;
  sendResponse({ type: "reset-complete", id });
}

async function runInference(window: Float32Array): Promise<number> {
  if (!session || !ort) return 0;

  const inputTensor = new ort.Tensor("float32", window, [1, WINDOW_SIZE]);
  const srTensor = new ort.Tensor("int32", new Int32Array([SAMPLE_RATE]), [1]);
  const hTensor = new ort.Tensor("float32", h, [1, 128]);
  const cTensor = new ort.Tensor("float32", c, [1, 128]);

  const output = await session.run({
    input: inputTensor,
    sr: srTensor,
    h: hTensor,
    c: cTensor,
  });

  // Update LSTM states
  if (output.hn) {
    h = new Float32Array(output.hn.data as Float32Array);
  }
  if (output.cn) {
    c = new Float32Array(output.cn.data as Float32Array);
  }

  // Get speech probability
  const outputTensor = output.output;
  if (outputTensor && outputTensor.data) {
    return (outputTensor.data as Float32Array)[0];
  }

  return 0;
}

function resample(
  input: Float32Array,
  fromRate: number,
  toRate: number,
): Float32Array {
  const ratio = fromRate / toRate;
  const newLength = Math.round(input.length / ratio);
  const result = new Float32Array(newLength);

  for (let i = 0; i < newLength; i++) {
    const srcIndex = i * ratio;
    const index = Math.floor(srcIndex);
    const fraction = srcIndex - index;

    if (index + 1 < input.length) {
      result[i] = input[index] * (1 - fraction) + input[index + 1] * fraction;
    } else {
      result[i] = input[index];
    }
  }

  return result;
}

function sendResponse(response: VADWorkerResponse): void {
  self.postMessage(response);
}

function sendError(id: number, error: string): void {
  self.postMessage({ type: "error", id, error });
}
