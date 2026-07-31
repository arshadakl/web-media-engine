import { describe, it, expect } from "vitest";
import {
  detectCapabilities,
  getSafariWorkaround,
  getSafariTimePrecision,
} from "../../core/browser/compat";

describe("Browser Compatibility", () => {
  describe("detectCapabilities", () => {
    it("should return capability object", () => {
      const caps = detectCapabilities();
      expect(typeof caps.sharedArrayBuffer).toBe("boolean");
      expect(typeof caps.webAssembly).toBe("boolean");
      expect(typeof caps.webWorkers).toBe("boolean");
      expect(typeof caps.offscreenCanvas).toBe("boolean");
      expect(typeof caps.fileSystemAccess).toBe("boolean");
      expect(typeof caps.IndexedDB).toBe("boolean");
    });
  });

  describe("getSafariWorkaround", () => {
    it("should return input config", () => {
      const config = getSafariWorkaround();
      expect(config.inputAccept).toContain("video/*");
      expect(config.maxFileSize).toBe(2 * 1024 * 1024 * 1024);
    });
  });

  describe("getSafariTimePrecision", () => {
    it("should return 33ms", () => {
      expect(getSafariTimePrecision()).toBe(33);
    });
  });
});
