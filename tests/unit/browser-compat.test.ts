import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  detectRuntime,
  checkFileSystemAccess,
  checkOPFS,
  checkSharedArrayBuffer,
  checkWebCodecs,
  checkOffscreenCanvas,
  checkWebWorkers,
  getCapabilities,
  isSupported,
  getCapabilitySummary,
} from "../../core/utils/browser-compat";

describe("BrowserCompat", () => {
  const originalNavigator = globalThis.navigator;
  const _originalWorker = globalThis.Worker;
  const _originalOffscreenCanvas = globalThis.OffscreenCanvas;
  const _originalSharedArrayBuffer = globalThis.SharedArrayBuffer;

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    if (originalNavigator !== undefined) {
      Object.defineProperty(globalThis, "navigator", {
        value: originalNavigator,
        writable: true,
      });
    }
    if (_originalWorker !== undefined) {
      Object.defineProperty(globalThis, "Worker", {
        value: _originalWorker,
        writable: true,
      });
    }
    if (_originalOffscreenCanvas !== undefined) {
      Object.defineProperty(globalThis, "OffscreenCanvas", {
        value: _originalOffscreenCanvas,
        writable: true,
      });
    }
    if (_originalSharedArrayBuffer !== undefined) {
      Object.defineProperty(globalThis, "SharedArrayBuffer", {
        value: _originalSharedArrayBuffer,
        writable: true,
      });
    }
  });

  describe("detectRuntime", () => {
    it("should detect chromium from user agent", () => {
      Object.defineProperty(globalThis, "navigator", {
        value: { userAgent: "Mozilla/5.0 Chrome/120.0.0.0 Safari/537.36" },
        writable: true,
        configurable: true,
      });
      expect(detectRuntime()).toBe("chromium");
    });

    it("should detect firefox from user agent", () => {
      Object.defineProperty(globalThis, "navigator", {
        value: { userAgent: "Mozilla/5.0 Firefox/121.0" },
        writable: true,
        configurable: true,
      });
      expect(detectRuntime()).toBe("firefox");
    });

    it("should detect safari from user agent", () => {
      Object.defineProperty(globalThis, "navigator", {
        value: { userAgent: "Mozilla/5.0 Safari/605.1.15" },
        writable: true,
        configurable: true,
      });
      expect(detectRuntime()).toBe("safari");
    });

    it("should return unknown for unsupported browsers", () => {
      Object.defineProperty(globalThis, "navigator", {
        value: { userAgent: "Unknown Browser/1.0" },
        writable: true,
        configurable: true,
      });
      expect(detectRuntime()).toBe("unknown");
    });
  });

  describe("checkFileSystemAccess", () => {
    it("should return true when showOpenFilePicker exists", () => {
      Object.defineProperty(globalThis, "window", {
        value: { showOpenFilePicker: vi.fn() },
        writable: true,
        configurable: true,
      });
      expect(checkFileSystemAccess()).toBe(true);
    });

    it("should return false when showOpenFilePicker does not exist", () => {
      Object.defineProperty(globalThis, "window", {
        value: {},
        writable: true,
        configurable: true,
      });
      expect(checkFileSystemAccess()).toBe(false);
    });
  });

  describe("checkOPFS", () => {
    it("should return true when storage.getDirectory exists", () => {
      Object.defineProperty(globalThis, "navigator", {
        value: { storage: { getDirectory: vi.fn() } },
        writable: true,
        configurable: true,
      });
      expect(checkOPFS()).toBe(true);
    });

    it("should return false when storage is not available", () => {
      Object.defineProperty(globalThis, "navigator", {
        value: {},
        writable: true,
        configurable: true,
      });
      expect(checkOPFS()).toBe(false);
    });
  });

  describe("checkSharedArrayBuffer", () => {
    it("should return true when SharedArrayBuffer exists and crossOriginIsolated is true", () => {
      Object.defineProperty(globalThis, "SharedArrayBuffer", {
        value: function SharedArrayBuffer() {},
        writable: true,
        configurable: true,
      });
      Object.defineProperty(globalThis, "crossOriginIsolated", {
        value: true,
        writable: true,
        configurable: true,
      });
      expect(checkSharedArrayBuffer()).toBe(true);
    });

    it("should return false when crossOriginIsolated is false", () => {
      Object.defineProperty(globalThis, "SharedArrayBuffer", {
        value: function SharedArrayBuffer() {},
        writable: true,
        configurable: true,
      });
      Object.defineProperty(globalThis, "crossOriginIsolated", {
        value: false,
        writable: true,
        configurable: true,
      });
      expect(checkSharedArrayBuffer()).toBe(false);
    });
  });

  describe("checkWebCodecs", () => {
    it("should return true when VideoDecoder and VideoEncoder exist", () => {
      Object.defineProperty(globalThis, "window", {
        value: {
          VideoDecoder: function VideoDecoder() {},
          VideoEncoder: function VideoEncoder() {},
        },
        writable: true,
        configurable: true,
      });
      expect(checkWebCodecs()).toBe(true);
    });

    it("should return false when VideoDecoder does not exist", () => {
      Object.defineProperty(globalThis, "window", {
        value: {},
        writable: true,
        configurable: true,
      });
      expect(checkWebCodecs()).toBe(false);
    });
  });

  describe("checkOffscreenCanvas", () => {
    it("should return true when OffscreenCanvas exists", () => {
      Object.defineProperty(globalThis, "OffscreenCanvas", {
        value: function OffscreenCanvas() {},
        writable: true,
        configurable: true,
      });
      expect(checkOffscreenCanvas()).toBe(true);
    });

    it("should return false when OffscreenCanvas does not exist", () => {
      Object.defineProperty(globalThis, "OffscreenCanvas", {
        value: undefined,
        writable: true,
        configurable: true,
      });
      expect(checkOffscreenCanvas()).toBe(false);
    });
  });

  describe("checkWebWorkers", () => {
    it("should return true when Worker exists", () => {
      Object.defineProperty(globalThis, "Worker", {
        value: function Worker() {},
        writable: true,
        configurable: true,
      });
      expect(checkWebWorkers()).toBe(true);
    });

    it("should return false when Worker does not exist", () => {
      Object.defineProperty(globalThis, "Worker", {
        value: undefined,
        writable: true,
        configurable: true,
      });
      expect(checkWebWorkers()).toBe(false);
    });
  });

  describe("getCapabilities", () => {
    it("should return an object with all capabilities", () => {
      const caps = getCapabilities();
      expect(caps).toHaveProperty("runtime");
      expect(caps).toHaveProperty("fileSystemAccess");
      expect(caps).toHaveProperty("opfs");
      expect(caps).toHaveProperty("sharedArrayBuffer");
      expect(caps).toHaveProperty("webCodecs");
      expect(caps).toHaveProperty("wasmSimd");
      expect(caps).toHaveProperty("offscreenCanvas");
      expect(caps).toHaveProperty("webWorkers");
    });
  });

  describe("isSupported", () => {
    it("should return boolean for capability check", () => {
      Object.defineProperty(globalThis, "Worker", {
        value: function Worker() {},
        writable: true,
        configurable: true,
      });
      expect(isSupported("webWorkers")).toBe(true);
    });
  });

  describe("getCapabilitySummary", () => {
    it("should return a formatted string", () => {
      const summary = getCapabilitySummary();
      expect(typeof summary).toBe("string");
      expect(summary).toContain("Runtime:");
      expect(summary).toContain("File System Access:");
    });
  });
});
