import { logger } from '../utils/logger';

export interface ExtractionResult {
  pcmData: Float32Array;
  sampleRate: number; // 16000 Hz target
  durationSeconds: number;
}

export async function extractAudioFromMediaFile(
  file: File | Blob,
  targetSampleRate = 16000,
  onProgress?: (percent: number) => void
): Promise<ExtractionResult> {
  const fileName = 'name' in file ? file.name : 'blob';
  logger.info('AudioExtractor', `Extracting audio track from file: ${fileName} (${(file.size / (1024 * 1024)).toFixed(1)}MB)`);
  if (onProgress) onProgress(10);

  const arrayBuffer = await file.arrayBuffer();
  if (onProgress) onProgress(40);

  const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
  const tempAudioCtx = new AudioCtx();

  let decodedAudioBuffer: AudioBuffer;
  try {
    decodedAudioBuffer = await tempAudioCtx.decodeAudioData(arrayBuffer);
    await tempAudioCtx.close();
  } catch (err) {
    await tempAudioCtx.close();
    logger.error('AudioExtractor', 'Failed to decode audio track via Web Audio API', err);
    throw new Error('Unable to extract audio from video/audio file. Please check file format.');
  }

  if (onProgress) onProgress(70);

  const originalSampleRate = decodedAudioBuffer.sampleRate;
  const originalLength = decodedAudioBuffer.length;
  const duration = decodedAudioBuffer.duration;
  const numberOfChannels = decodedAudioBuffer.numberOfChannels;

  // Mix down to mono
  const monoPcm = new Float32Array(originalLength);
  if (numberOfChannels === 1) {
    monoPcm.set(decodedAudioBuffer.getChannelData(0));
  } else {
    const channel0 = decodedAudioBuffer.getChannelData(0);
    const channel1 = decodedAudioBuffer.getChannelData(1);
    for (let i = 0; i < originalLength; i++) {
      monoPcm[i] = ((channel0[i] || 0) + (channel1[i] || 0)) / 2;
    }
  }

  // Resample to targetSampleRate (16,000 Hz) if needed using OfflineAudioContext or linear interpolation
  let finalPcm: Float32Array;
  if (originalSampleRate === targetSampleRate) {
    finalPcm = monoPcm;
  } else {
    finalPcm = await resamplePcmOfflineCtx(monoPcm, originalSampleRate, targetSampleRate, duration);
  }

  if (onProgress) onProgress(100);
  logger.info('AudioExtractor', `Audio extraction completed: duration=${duration.toFixed(1)}s, samples=${finalPcm.length}`);

  return {
    pcmData: finalPcm,
    sampleRate: targetSampleRate,
    durationSeconds: duration,
  };
}

async function resamplePcmOfflineCtx(
  sourcePcm: Float32Array,
  sourceSampleRate: number,
  targetSampleRate: number,
  durationSeconds: number
): Promise<Float32Array> {
  const targetLength = Math.round(durationSeconds * targetSampleRate);
  
  if (typeof OfflineAudioContext !== 'undefined') {
    try {
      const offlineCtx = new OfflineAudioContext(1, targetLength, targetSampleRate);
      const buffer = offlineCtx.createBuffer(1, sourcePcm.length, sourceSampleRate);
      buffer.copyToChannel(sourcePcm, 0);

      const sourceNode = offlineCtx.createBufferSource();
      sourceNode.buffer = buffer;
      sourceNode.connect(offlineCtx.destination);
      sourceNode.start(0);

      const renderedBuffer = await offlineCtx.startRendering();
      return renderedBuffer.getChannelData(0);
    } catch {
      // Linear interpolation fallback
      return resampleLinear(sourcePcm, sourceSampleRate, targetSampleRate);
    }
  }

  return resampleLinear(sourcePcm, sourceSampleRate, targetSampleRate);
}

function resampleLinear(sourcePcm: Float32Array, sourceSampleRate: number, targetSampleRate: number): Float32Array {
  const ratio = sourceSampleRate / targetSampleRate;
  const targetLength = Math.floor(sourcePcm.length / ratio);
  const result = new Float32Array(targetLength);

  for (let i = 0; i < targetLength; i++) {
    const origIndex = i * ratio;
    const indexLow = Math.floor(origIndex);
    const indexHigh = Math.min(sourcePcm.length - 1, indexLow + 1);
    const weight = origIndex - indexLow;

    const valLow = sourcePcm[indexLow] || 0;
    const valHigh = sourcePcm[indexHigh] || 0;
    result[i] = valLow * (1 - weight) + valHigh * weight;
  }

  return result;
}
