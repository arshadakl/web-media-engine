import { describe, it, expect } from "vitest";
import {
  getWaveformA11yConfig,
  getInteractiveWaveformA11yConfig,
  getSegmentA11yLabel,
  getKeyboardShortcuts,
} from "../../core/a11y";

describe("Accessibility", () => {
  describe("getWaveformA11yConfig", () => {
    it("should return correct config", () => {
      const config = getWaveformA11yConfig(60000, 10, 5);
      expect(config.role).toBe("img");
      expect(config.tabIndex).toBe(0);
      expect(config.ariaLabel).toContain("10 speech segments");
      expect(config.ariaLabel).toContain("5 silence segments");
    });
  });

  describe("getInteractiveWaveformA11yConfig", () => {
    it("should return application role", () => {
      const config = getInteractiveWaveformA11yConfig();
      expect(config.role).toBe("application");
      expect(config.ariaLabel).toContain("Interactive waveform editor");
    });
  });

  describe("getSegmentA11yLabel", () => {
    it("should generate correct label for speech", () => {
      const label = getSegmentA11yLabel("speech", 1000, 2000);
      expect(label).toContain("Speech segment");
      expect(label).toContain("0:01");
      expect(label).toContain("0:02");
    });

    it("should generate correct label for silence", () => {
      const label = getSegmentA11yLabel("silence", 0, 3000);
      expect(label).toContain("Silence segment");
      expect(label).toContain("duration 0:03");
    });
  });

  describe("getKeyboardShortcuts", () => {
    it("should return all shortcuts", () => {
      const shortcuts = getKeyboardShortcuts();
      expect(shortcuts.Space).toBe("Play/Pause");
      expect(shortcuts.ArrowLeft).toContain("Skip back");
      expect(shortcuts.ArrowRight).toContain("Skip forward");
      expect(shortcuts.Enter).toBe("Toggle current segment");
    });
  });
});
