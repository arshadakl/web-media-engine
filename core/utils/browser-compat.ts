export interface BrowserCapabilities {
  sharedArrayBuffer: boolean;
  webCodecs: boolean;
  fileSystemAccess: boolean;
  opfs: boolean;
  wasmSimd: boolean;
  webAudio: boolean;
  crossOriginIsolated: boolean;
  offscreenCanvas: boolean;
  estimatedMemoryMB: number;
  browserName: 'Chromium' | 'Firefox' | 'Safari' | 'Unknown';
}

export function detectBrowserCapabilities(): BrowserCapabilities {
  const userAgent = typeof navigator !== 'undefined' ? navigator.userAgent : '';
  let browserName: BrowserCapabilities['browserName'] = 'Unknown';
  if (userAgent.includes('Firefox')) {
    browserName = 'Firefox';
  } else if (userAgent.includes('Safari') && !userAgent.includes('Chrome')) {
    browserName = 'Safari';
  } else if (userAgent.includes('Chrome') || userAgent.includes('Chromium')) {
    browserName = 'Chromium';
  }

  const sharedArrayBuffer = typeof SharedArrayBuffer !== 'undefined';
  const webCodecs = typeof window !== 'undefined' && 'VideoEncoder' in window && 'VideoDecoder' in window;
  const fileSystemAccess = typeof window !== 'undefined' && 'showOpenFilePicker' in window;
  const opfs = typeof navigator !== 'undefined' && !!navigator.storage && 'getDirectory' in navigator.storage;
  const webAudio = typeof window !== 'undefined' && ('AudioContext' in window || 'webkitAudioContext' in window);
  const crossOriginIsolated = typeof window !== 'undefined' ? (window.crossOriginIsolated ?? false) : false;
  const offscreenCanvas = typeof OffscreenCanvas !== 'undefined';

  // WASM SIMD detection check
  let wasmSimd = false;
  try {
    wasmSimd = WebAssembly.validate(
      new Uint8Array([0, 97, 115, 109, 1, 0, 0, 0, 1, 5, 1, 96, 0, 1, 123, 3, 2, 1, 0, 10, 10, 1, 8, 0, 65, 0, 253, 15, 26, 11])
    );
  } catch {
    wasmSimd = false;
  }

  // Device memory estimation
  let estimatedMemoryMB = 4096;
  if (typeof navigator !== 'undefined' && 'deviceMemory' in navigator) {
    estimatedMemoryMB = (navigator as unknown as { deviceMemory: number }).deviceMemory * 1024;
  }

  return {
    sharedArrayBuffer,
    webCodecs,
    fileSystemAccess,
    opfs,
    wasmSimd,
    webAudio,
    crossOriginIsolated,
    offscreenCanvas,
    estimatedMemoryMB,
    browserName,
  };
}
