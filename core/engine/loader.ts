export type EngineModule = "ffmpeg" | "onnx" | "silero";

export interface LoadProgress {
  module: EngineModule;
  loaded: boolean;
  error?: string;
}

export interface EngineState {
  ffmpeg: boolean;
  onnx: boolean;
  silero: boolean;
}

const loadedModules: EngineState = {
  ffmpeg: false,
  onnx: false,
  silero: false,
};

export function isModuleLoaded(module: EngineModule): boolean {
  return loadedModules[module];
}

export function markModuleLoaded(module: EngineModule): void {
  loadedModules[module] = true;
}

export function resetModuleState(): void {
  loadedModules.ffmpeg = false;
  loadedModules.onnx = false;
  loadedModules.silero = false;
}

export function getLoadProgress(): LoadProgress[] {
  return [
    { module: "ffmpeg", loaded: loadedModules.ffmpeg },
    { module: "onnx", loaded: loadedModules.onnx },
    { module: "silero", loaded: loadedModules.silero },
  ];
}

export async function loadFFmpeg(
  onProgress?: (progress: number) => void,
): Promise<void> {
  if (loadedModules.ffmpeg) return;

  try {
    onProgress?.(0);
    onProgress?.(50);
    // FFmpeg will be loaded via CDN in the worker
    onProgress?.(100);
    markModuleLoaded("ffmpeg");
  } catch (err) {
    throw new Error(`Failed to load FFmpeg: ${err}`, { cause: err });
  }
}

export async function loadONNX(
  onProgress?: (progress: number) => void,
): Promise<void> {
  if (loadedModules.onnx) return;

  try {
    onProgress?.(0);
    onProgress?.(100);
    markModuleLoaded("onnx");
  } catch (err) {
    throw new Error(`Failed to load ONNX Runtime: ${err}`, { cause: err });
  }
}

export async function loadSileroModel(
  onProgress?: (progress: number) => void,
): Promise<void> {
  if (loadedModules.silero) return;

  try {
    onProgress?.(0);
    // Model loading will be implemented when VAD worker is ready
    onProgress?.(100);
    markModuleLoaded("silero");
  } catch (err) {
    throw new Error(`Failed to load Silero model: ${err}`, { cause: err });
  }
}

export async function loadAllModules(
  onProgress?: (module: EngineModule, progress: number) => void,
): Promise<void> {
  await Promise.all([
    loadFFmpeg((p) => onProgress?.("ffmpeg", p)),
    loadONNX((p) => onProgress?.("onnx", p)),
    loadSileroModel((p) => onProgress?.("silero", p)),
  ]);
}
