export interface BrowserCapabilities {
  sharedArrayBuffer: boolean;
  webAssembly: boolean;
  webWorkers: boolean;
  offscreenCanvas: boolean;
  fileSystemAccess: boolean;
  IndexedDB: boolean;
}

export function detectCapabilities(): BrowserCapabilities {
  return {
    sharedArrayBuffer: typeof SharedArrayBuffer !== "undefined",
    webAssembly: typeof WebAssembly !== "undefined",
    webWorkers: typeof Worker !== "undefined",
    offscreenCanvas: typeof OffscreenCanvas !== "undefined",
    fileSystemAccess:
      typeof window !== "undefined" && "showSaveFilePicker" in window,
    IndexedDB: typeof indexedDB !== "undefined",
  };
}

export function getSafariWorkaround(): {
  inputAccept: string;
  maxFileSize: number;
} {
  return {
    inputAccept: "video/*,audio/*,.mp4,.mov,.avi,.mkv,.webm",
    maxFileSize: 2 * 1024 * 1024 * 1024, // 2GB
  };
}

export function getSafariTimePrecision(): number {
  return 33; // Safari currentTime precision in ms
}

export function isSafari(): boolean {
  if (typeof navigator === "undefined") return false;
  return /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
}

export function isFirefox(): boolean {
  if (typeof navigator === "undefined") return false;
  return navigator.userAgent.includes("Firefox");
}

export function needsOffscreenCanvasFallback(): boolean {
  const caps = detectCapabilities();
  return !caps.offscreenCanvas && isFirefox();
}

export function handleQuotaExceededError(error: Error): boolean {
  if (error.name === "QuotaExceededError") {
    // Try to clear old cache
    try {
      indexedDB.deleteDatabase("web-media-engine-cache");
    } catch {
      // Ignore cleanup errors
    }
    return true;
  }
  return false;
}
