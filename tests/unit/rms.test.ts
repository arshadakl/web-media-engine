import { describe, it, expect } from "vitest";
import {
  computeRms,
  computePeak,
  computeRmsAndPeak,
  computeWaveformRms,
  computeWaveformFull,
  computeChunkRms,
  normalizeRms,
} from "../../core/audio/rms";

describe("RMS", () => {
  describe("computeRms", () => {
    it("should compute RMS for a sine wave", () => {
      // Create a simple sine wave
      const samples = 1024;
      const pcm = new Float32Array(samples);
      for (let i = 0; i < samples; i++) {
        pcm[i] = Math.sin((2 * Math.PI * i) / samples);
      }

      const rms = computeRms(pcm);
      // RMS of a sine wave is 1/sqrt(2) ≈ 0.707
      expect(rms).toBeCloseTo(0.707, 2);
    });

    it("should return 0 for empty array", () => {
      expect(computeRms(new Float32Array(0))).toBe(0);
    });

    it("should return 0 for silent audio", () => {
      const pcm = new Float32Array(1024).fill(0);
      expect(computeRms(pcm)).toBe(0);
    });

    it("should return 1 for constant signal at 1", () => {
      const pcm = new Float32Array(1024).fill(1);
      expect(computeRms(pcm)).toBe(1);
    });

    it("should handle negative values", () => {
      const pcm = new Float32Array([-1, -1, -1, -1]);
      expect(computeRms(pcm)).toBe(1);
    });
  });

  describe("computePeak", () => {
    it("should find peak amplitude", () => {
      const pcm = new Float32Array([0.1, 0.5, 0.3, 0.8, 0.2]);
      expect(computePeak(pcm)).toBeCloseTo(0.8, 5);
    });

    it("should handle negative peaks", () => {
      const pcm = new Float32Array([0.1, -0.9, 0.3, -0.5]);
      expect(computePeak(pcm)).toBeCloseTo(0.9, 5);
    });

    it("should return 0 for empty array", () => {
      expect(computePeak(new Float32Array(0))).toBe(0);
    });

    it("should return 0 for silent audio", () => {
      const pcm = new Float32Array(1024).fill(0);
      expect(computePeak(pcm)).toBe(0);
    });
  });

  describe("computeRmsAndPeak", () => {
    it("should return both rms and peak", () => {
      const pcm = new Float32Array([0.5, -0.5, 0.5, -0.5]);
      const result = computeRmsAndPeak(pcm);

      expect(result.rms).toBeCloseTo(0.5, 2);
      expect(result.peak).toBe(0.5);
    });
  });

  describe("computeWaveformRms", () => {
    it("should compute per-pixel RMS", () => {
      // Create 2048 samples with varying amplitude
      const pcm = new Float32Array(2048);
      for (let i = 0; i < 1024; i++) {
        pcm[i] = 0.5 * Math.sin((2 * Math.PI * i) / 1024);
      }
      for (let i = 1024; i < 2048; i++) {
        pcm[i] = 0.25 * Math.sin((2 * Math.PI * i) / 1024);
      }

      const waveform = computeWaveformRms(pcm, { samplesPerPixel: 1024 });

      expect(waveform.length).toBe(2);
      expect(waveform[0]).toBeGreaterThan(waveform[1]);
    });

    it("should handle empty input", () => {
      const waveform = computeWaveformRms(new Float32Array(0));
      expect(waveform.length).toBe(0);
    });

    it("should use default samples per pixel", () => {
      const pcm = new Float32Array(4096);
      const waveform = computeWaveformRms(pcm);
      expect(waveform.length).toBe(4); // 4096 / 1024 = 4
    });
  });

  describe("computeWaveformFull", () => {
    it("should return rms and peak for each pixel", () => {
      const pcm = new Float32Array(1024).fill(0.5);
      const waveform = computeWaveformFull(pcm, { samplesPerPixel: 1024 });

      expect(waveform.length).toBe(1);
      expect(waveform[0].rms).toBeCloseTo(0.5, 2);
      expect(waveform[0].peak).toBe(0.5);
    });
  });

  describe("computeChunkRms", () => {
    it("should compute RMS for multiple chunks", () => {
      const chunk1 = new Float32Array(1024).fill(0.5);
      const chunk2 = new Float32Array(1024).fill(0.25);

      const rms = computeChunkRms([chunk1, chunk2]);

      expect(rms.length).toBe(2);
      expect(rms[0]).toBeCloseTo(0.5, 2);
      expect(rms[1]).toBeCloseTo(0.25, 2);
    });
  });

  describe("normalizeRms", () => {
    it("should normalize to target range", () => {
      const rms = new Float32Array([0.2, 0.4, 0.6, 0.8]);
      const normalized = normalizeRms(rms, 1);

      expect(normalized[3]).toBeCloseTo(1, 2); // Max should be 1
      expect(normalized[0]).toBeCloseTo(0.25, 2); // 0.2/0.8 = 0.25
    });

    it("should handle empty input", () => {
      const normalized = normalizeRms(new Float32Array(0));
      expect(normalized.length).toBe(0);
    });

    it("should handle all zeros", () => {
      const rms = new Float32Array([0, 0, 0]);
      const normalized = normalizeRms(rms);
      expect(normalized).toEqual(new Float32Array([0, 0, 0]));
    });
  });
});
