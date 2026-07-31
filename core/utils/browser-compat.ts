/**
 * Browser compatibility detection module.
 * Detects runtime and available capabilities for graceful degradation.
 */

export type BrowserRuntime = "chromium" | "firefox" | "safari" | "unknown";

export interface BrowserCapabilities {
  /** Browser runtime detection */
  runtime: BrowserRuntime;
  /** File System Access API support (Chromium only) */
  fileSystemAccess: boolean;
  /** Origin Private File System support */
  opfs: boolean;
  /** SharedArrayBuffer support (requires COOP/COEP headers) */
  sharedArrayBuffer: boolean;
  /** WebCodecs API support */
  webCodecs: boolean;
  /** WASM SIMD support */
  wasmSimd: boolean;
  /** OffscreenCanvas support */
  offscreenCanvas: boolean;
  /** Web Workers support */
  webWorkers: boolean;
}

/**
 * Detect the browser runtime based on user agent and feature detection.
 * @returns Detected browser runtime
 */
export function detectRuntime(): BrowserRuntime {
  if (typeof navigator === "undefined") {
    return "unknown";
  }

  const userAgent = navigator.userAgent.toLowerCase();

  // Check for Safari first (must be before Chrome check since Safari includes Chrome in UA)
  if (userAgent.includes("safari") && !userAgent.includes("chrome")) {
    return "safari";
  }

  // Check for Firefox
  if (userAgent.includes("firefox")) {
    return "firefox";
  }

  // Check for Chrome/Chromium (includes Edge, Opera, etc.)
  if (userAgent.includes("chrome")) {
    return "chromium";
  }

  return "unknown";
}

/**
 * Check if File System Access API is available.
 * @returns True if File System Access API is supported
 */
export function checkFileSystemAccess(): boolean {
  return typeof window !== "undefined" && "showOpenFilePicker" in window;
}

/**
 * Check if Origin Private File System is available.
 * @returns True if OPFS is supported
 */
export function checkOPFS(): boolean {
  return (
    typeof navigator !== "undefined" &&
    "storage" in navigator &&
    "getDirectory" in navigator.storage
  );
}

/**
 * Check if SharedArrayBuffer is available.
 * Requires COOP/COEP headers to be set.
 * @returns True if SharedArrayBuffer is available
 */
export function checkSharedArrayBuffer(): boolean {
  return (
    typeof SharedArrayBuffer !== "undefined" &&
    globalThis.crossOriginIsolated === true
  );
}

/**
 * Check if WebCodecs API is available.
 * @returns True if WebCodecs is supported
 */
export function checkWebCodecs(): boolean {
  return (
    typeof window !== "undefined" &&
    "VideoDecoder" in window &&
    "VideoEncoder" in window
  );
}

/**
 * Check if WASM SIMD is supported.
 * @returns True if WASM SIMD is supported
 */
export function checkWasmSimd(): boolean {
  try {
    if (typeof WebAssembly === "undefined") {
      return false;
    }
    // Test SIMD support by trying to compile a SIMD instruction
    const bytes = new Uint8Array([
      0, 97, 115, 109, 1, 0, 0, 1, 5, 1, 96, 0, 1, 123, 3, 2, 1, 0,
    ]);
    return (
      WebAssembly.compile(bytes).then(
        () => true,
        () => false,
      ) instanceof Promise
    );
  } catch {
    return false;
  }
}

/**
 * Check if OffscreenCanvas is available.
 * @returns True if OffscreenCanvas is supported
 */
export function checkOffscreenCanvas(): boolean {
  return typeof OffscreenCanvas !== "undefined";
}

/**
 * Check if Web Workers are available.
 * @returns True if Web Workers are supported
 */
export function checkWebWorkers(): boolean {
  return typeof Worker !== "undefined";
}

/**
 * Get all browser capabilities.
 * @returns Object containing all detected capabilities
 */
export function getCapabilities(): BrowserCapabilities {
  return {
    runtime: detectRuntime(),
    fileSystemAccess: checkFileSystemAccess(),
    opfs: checkOPFS(),
    sharedArrayBuffer: checkSharedArrayBuffer(),
    webCodecs: checkWebCodecs(),
    wasmSimd: checkWasmSimd(),
    offscreenCanvas: checkOffscreenCanvas(),
    webWorkers: checkWebWorkers(),
  };
}

/**
 * Check if a specific capability is supported.
 * @param capability - The capability to check
 * @returns True if the capability is supported
 */
export function isSupported(capability: keyof BrowserCapabilities): boolean {
  const capabilities = getCapabilities();
  return capabilities[capability] as boolean;
}

/**
 * Get a human-readable summary of browser capabilities.
 * @returns Formatted string with capability status
 */
export function getCapabilitySummary(): string {
  const caps = getCapabilities();
  const lines: string[] = [
    `Runtime: ${caps.runtime}`,
    `File System Access: ${caps.fileSystemAccess ? "✓" : "✗"}`,
    `OPFS: ${caps.opfs ? "✓" : "✗"}`,
    `SharedArrayBuffer: ${caps.sharedArrayBuffer ? "✓" : "✗"}`,
    `WebCodecs: ${caps.webCodecs ? "✓" : "✗"}`,
    `WASM SIMD: ${caps.wasmSimd ? "✓" : "✗"}`,
    `OffscreenCanvas: ${caps.offscreenCanvas ? "✓" : "✗"}`,
    `Web Workers: ${caps.webWorkers ? "✓" : "✗"}`,
  ];
  return lines.join("\n");
}
