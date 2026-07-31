/**
 * RMS (Root Mean Square) computation for audio waveform visualization.
 * Computes per-pixel RMS from PCM data for waveform rendering.
 */

export interface RmsOptions {
  /** Sample rate in Hz (default: 16000) */
  sampleRate?: number;
  /** Number of samples per pixel (default: 1024) */
  samplesPerPixel?: number;
}

export interface RmsResult {
  /** RMS value normalized to 0-1 range */
  rms: number;
  /** Peak amplitude normalized to 0-1 range */
  peak: number;
}

/**
 * Compute RMS value for a PCM chunk.
 * @param pcmData - Float32Array of PCM samples (-1 to 1)
 * @returns RMS value normalized to 0-1
 */
export function computeRms(pcmData: Float32Array): number {
  if (pcmData.length === 0) {
    return 0;
  }

  let sumSquares = 0;
  for (let i = 0; i < pcmData.length; i++) {
    sumSquares += pcmData[i] * pcmData[i];
  }

  return Math.sqrt(sumSquares / pcmData.length);
}

/**
 * Compute peak amplitude for a PCM chunk.
 * @param pcmData - Float32Array of PCM samples (-1 to 1)
 * @returns Peak amplitude normalized to 0-1
 */
export function computePeak(pcmData: Float32Array): number {
  if (pcmData.length === 0) {
    return 0;
  }

  let max = 0;
  for (let i = 0; i < pcmData.length; i++) {
    const abs = Math.abs(pcmData[i]);
    if (abs > max) {
      max = abs;
    }
  }

  return max;
}

/**
 * Compute RMS and peak for a PCM chunk.
 * @param pcmData - Float32Array of PCM samples (-1 to 1)
 * @returns Object containing rms and peak values
 */
export function computeRmsAndPeak(pcmData: Float32Array): RmsResult {
  return {
    rms: computeRms(pcmData),
    peak: computePeak(pcmData),
  };
}

/**
 * Compute per-pixel RMS values for waveform rendering.
 * @param pcmData - Float32Array of PCM samples
 * @param options - Configuration options
 * @returns Array of RMS values (0-1) for each pixel
 */
export function computeWaveformRms(
  pcmData: Float32Array,
  options: RmsOptions = {},
): Float32Array {
  const { samplesPerPixel = 1024 } = options;
  const numPixels = Math.ceil(pcmData.length / samplesPerPixel);
  const waveform = new Float32Array(numPixels);

  for (let i = 0; i < numPixels; i++) {
    const start = i * samplesPerPixel;
    const end = Math.min(start + samplesPerPixel, pcmData.length);
    const chunk = pcmData.slice(start, end);
    waveform[i] = computeRms(chunk);
  }

  return waveform;
}

/**
 * Compute waveform data with both RMS and peak for each pixel.
 * @param pcmData - Float32Array of PCM samples
 * @param options - Configuration options
 * @returns Array of RmsResult for each pixel
 */
export function computeWaveformFull(
  pcmData: Float32Array,
  options: RmsOptions = {},
): RmsResult[] {
  const { samplesPerPixel = 1024 } = options;
  const numPixels = Math.ceil(pcmData.length / samplesPerPixel);
  const waveform: RmsResult[] = new Array(numPixels);

  for (let i = 0; i < numPixels; i++) {
    const start = i * samplesPerPixel;
    const end = Math.min(start + samplesPerPixel, pcmData.length);
    const chunk = pcmData.slice(start, end);
    waveform[i] = computeRmsAndPeak(chunk);
  }

  return waveform;
}

/**
 * Compute RMS values for multiple PCM chunks.
 * @param chunks - Array of Float32Array PCM chunks
 * @param options - Configuration options
 * @returns Array of RMS values for each chunk
 */
export function computeChunkRms(chunks: Float32Array[]): Float32Array {
  const rmsValues = new Float32Array(chunks.length);

  for (let i = 0; i < chunks.length; i++) {
    rmsValues[i] = computeRms(chunks[i]);
  }

  return rmsValues;
}

/**
 * Normalize RMS values to a target range.
 * @param rmsValues - Array of RMS values
 * @param targetMax - Maximum value in output range (default: 1)
 * @returns Normalized RMS values
 */
export function normalizeRms(
  rmsValues: Float32Array,
  targetMax: number = 1,
): Float32Array {
  if (rmsValues.length === 0) {
    return rmsValues;
  }

  let maxRms = 0;
  for (let i = 0; i < rmsValues.length; i++) {
    if (rmsValues[i] > maxRms) {
      maxRms = rmsValues[i];
    }
  }

  if (maxRms === 0) {
    return new Float32Array(rmsValues.length);
  }

  const normalized = new Float32Array(rmsValues.length);
  const scale = targetMax / maxRms;

  for (let i = 0; i < rmsValues.length; i++) {
    normalized[i] = rmsValues[i] * scale;
  }

  return normalized;
}
