import { DEFAULT_VAD_CONFIG, VADConfig, VADFrame } from './vad-types';
import { SileroOnnxRunner } from './onnx-runner';
import { logger } from '../utils/logger';

export class SileroVADEngine {
  private config: VADConfig;
  private runner: SileroOnnxRunner;
  private estimatedNoiseFloorDb = -50;

  constructor(config: Partial<VADConfig> = {}) {
    this.config = { ...DEFAULT_VAD_CONFIG, ...config };
    this.runner = new SileroOnnxRunner();
  }

  public async init(modelUrl?: string): Promise<boolean> {
    return await this.runner.loadModel(modelUrl);
  }

  public setConfig(newConfig: Partial<VADConfig>) {
    this.config = { ...this.config, ...newConfig };
  }

  public getConfig(): VADConfig {
    return { ...this.config };
  }

  public getEstimatedNoiseFloorDb(): number {
    return this.estimatedNoiseFloorDb;
  }

  /**
   * Process full PCM audio buffer at 16kHz and emit array of VAD frames (32ms windows).
   */
  public async processAudio(
    pcmData: Float32Array,
    sampleRate = 16000,
    onProgress?: (percent: number, currentFrames: VADFrame[]) => void
  ): Promise<VADFrame[]> {
    logger.info('SileroVADEngine', `Starting VAD processing on ${pcmData.length} samples (${(pcmData.length / sampleRate).toFixed(1)}s)`);

    // First pass: adaptive noise floor estimation on first 60 seconds (or full audio if shorter)
    this.estimateNoiseFloor(pcmData, sampleRate);

    const windowSize = this.config.windowSizeSamples; // 512
    const totalWindows = Math.floor(pcmData.length / windowSize);
    const frames: VADFrame[] = [];

    this.runner.resetState();

    let consecutiveSpeechCount = 0;
    let consecutiveSilenceCount = 0;
    let isCurrentlySpeech = false;

    for (let i = 0; i < totalWindows; i++) {
      const offset = i * windowSize;
      const windowPcm = pcmData.subarray(offset, offset + windowSize);

      let speechProb = await this.runner.runInference(windowPcm, sampleRate);

      // Apply adaptive noise floor adjustment
      if (this.config.adaptiveNoiseFloor) {
        speechProb = this.adjustProbWithNoiseFloor(windowPcm, speechProb);
      }

      // Hysteresis logic
      if (isCurrentlySpeech) {
        if (speechProb < this.config.silenceThreshold) {
          consecutiveSilenceCount++;
          if (consecutiveSilenceCount >= this.config.minSilenceDurationFrames) {
            isCurrentlySpeech = false;
            consecutiveSpeechCount = 0;
          }
        } else {
          consecutiveSilenceCount = 0;
        }
      } else {
        if (speechProb > this.config.speechThreshold) {
          consecutiveSpeechCount++;
          if (consecutiveSpeechCount >= this.config.minSpeechDurationFrames) {
            isCurrentlySpeech = true;
            consecutiveSilenceCount = 0;
          }
        } else {
          consecutiveSpeechCount = 0;
        }
      }

      const startMs = (offset / sampleRate) * 1000;
      const endMs = ((offset + windowSize) / sampleRate) * 1000;

      frames.push({
        frameIndex: i,
        startMs,
        endMs,
        speechProb,
        isSpeech: isCurrentlySpeech,
      });

      if (onProgress && i % 250 === 0) {
        onProgress(Math.round((i / totalWindows) * 100), frames);
      }
    }

    if (onProgress) {
      onProgress(100, frames);
    }

    logger.info('SileroVADEngine', `Finished VAD processing: generated ${frames.length} frames`);
    return frames;
  }

  private estimateNoiseFloor(pcmData: Float32Array, sampleRate: number) {
    const checkSamples = Math.min(pcmData.length, sampleRate * 60);
    const frameSize = 512;
    const rmsValues: number[] = [];

    for (let i = 0; i < checkSamples; i += frameSize) {
      let sumSq = 0;
      const end = Math.min(i + frameSize, checkSamples);
      for (let j = i; j < end; j++) {
        const val = pcmData[j] || 0;
        sumSq += val * val;
      }
      const rms = Math.sqrt(sumSq / (end - i));
      if (rms > 0) {
        rmsValues.push(20 * Math.log10(rms));
      }
    }

    if (rmsValues.length > 0) {
      rmsValues.sort((a, b) => a - b);
      // Take the 15th percentile as noise floor estimation
      const idx = Math.floor(rmsValues.length * 0.15);
      this.estimatedNoiseFloorDb = rmsValues[idx] ?? -50;
      logger.info('SileroVADEngine', `Estimated noise floor: ${this.estimatedNoiseFloorDb.toFixed(1)} dB`);
    }
  }

  private adjustProbWithNoiseFloor(windowPcm: Float32Array, rawProb: number): number {
    let sumSq = 0;
    for (let i = 0; i < windowPcm.length; i++) {
      const val = windowPcm[i] || 0;
      sumSq += val * val;
    }
    const rms = Math.sqrt(sumSq / windowPcm.length);
    const db = 20 * Math.log10(Math.max(rms, 1e-5));

    // If signal is below noise floor + 4dB, suppress speech prob
    if (db < this.estimatedNoiseFloorDb + 4) {
      return rawProb * 0.2;
    }
    return rawProb;
  }
}
