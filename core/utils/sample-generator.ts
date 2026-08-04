import { logger } from './logger';

export interface SampleClipInfo {
  id: string;
  title: string;
  description: string;
  durationSec: number;
  expectedSilenceSec: number;
}

export const SAMPLE_CLIPS: SampleClipInfo[] = [
  {
    id: 'podcast_clip',
    title: '🎙️ Tech Podcast Episode (30s)',
    description: 'Conversation with natural 1-2s pauses, filler words, and clear speech bursts.',
    durationSec: 30,
    expectedSilenceSec: 11.5,
  },
  {
    id: 'tutorial_clip',
    title: '💻 Coding Tutorial Video (45s)',
    description: 'Instructor explaining code with long thinking silences between steps.',
    durationSec: 45,
    expectedSilenceSec: 22.0,
  },
  {
    id: 'presentation_clip',
    title: '📊 Keynote Presentation (20s)',
    description: 'Fast-paced speech with small breath pauses.',
    durationSec: 20,
    expectedSilenceSec: 6.2,
  },
];

export async function generateSyntheticSampleFile(clipId: string): Promise<File> {
  const clip = SAMPLE_CLIPS.find((c) => c.id === clipId) || SAMPLE_CLIPS[0]!;
  logger.info('SampleGenerator', `Generating synthetic demo file for: ${clip.title}`);

  const durationSec = clip.durationSec;
  const sampleRate = 44100;
  const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
  const ctx = new AudioCtx({ sampleRate });

  // Generate synthetic voice speech schedule
  // Pattern: speech bursts (frequencies 150-600Hz with formants) and complete silence
  const buffer = ctx.createBuffer(1, sampleRate * durationSec, sampleRate);
  const data = buffer.getChannelData(0);

  // Generate speech regions based on clip type
  const speechIntervals: [number, number][] = [];
  if (clip.id === 'podcast_clip') {
    speechIntervals.push([0.5, 4.2], [5.8, 9.5], [12.0, 16.8], [18.5, 23.0], [25.0, 29.2]);
  } else if (clip.id === 'tutorial_clip') {
    speechIntervals.push([1.0, 5.0], [10.0, 14.5], [20.0, 24.2], [32.0, 37.0], [40.0, 44.0]);
  } else {
    speechIntervals.push([0.2, 3.5], [4.5, 8.0], [9.2, 13.0], [14.0, 19.5]);
  }

  for (let i = 0; i < data.length; i++) {
    const t = i / sampleRate;
    let isSpeechTime = false;

    for (const [start, end] of speechIntervals) {
      if (t >= start && t <= end) {
        isSpeechTime = true;
        break;
      }
    }

    if (isSpeechTime) {
      // Synthesize rich voice formant harmonics + modulation (speech simulator)
      const f0 = 160 + Math.sin(2 * Math.PI * 3 * t) * 20; // Pitch intonation
      const voiceHarmonic1 = Math.sin(2 * Math.PI * f0 * t) * 0.4;
      const voiceHarmonic2 = Math.sin(2 * Math.PI * f0 * 2 * t) * 0.2;
      const voiceHarmonic3 = Math.sin(2 * Math.PI * f0 * 3.5 * t) * 0.1;
      const syllableEnv = 0.5 + 0.5 * Math.sin(2 * Math.PI * 5 * t); // Syllable envelope
      const noiseBreath = (Math.random() - 0.5) * 0.03;

      data[i] = (voiceHarmonic1 + voiceHarmonic2 + voiceHarmonic3 + noiseBreath) * syllableEnv * 0.7;
    } else {
      // Noise floor during silence
      data[i] = (Math.random() - 0.5) * 0.001;
    }
  }

  // Convert AudioBuffer to WAV blob file
  const wavBlob = audioBufferToWavBlob(buffer);
  const file = new File([wavBlob], `${clip.id}.wav`, { type: 'audio/wav' });

  await ctx.close();
  return file;
}

function audioBufferToWavBlob(buffer: AudioBuffer): Blob {
  const numChannels = 1;
  const sampleRate = buffer.sampleRate;
  const format = 1; // PCM
  const bitDepth = 16;
  const data = buffer.getChannelData(0);

  const bytesPerSample = bitDepth / 8;
  const blockAlign = numChannels * bytesPerSample;
  const dataSize = data.length * blockAlign;
  const headerSize = 44;
  const totalSize = headerSize + dataSize;

  const arrayBuffer = new ArrayBuffer(totalSize);
  const view = new DataView(arrayBuffer);

  /* RIFF identifier */
  writeString(view, 0, 'RIFF');
  /* RIFF chunk length */
  view.setUint32(4, 36 + dataSize, true);
  /* RIFF type */
  writeString(view, 8, 'WAVE');
  /* format chunk identifier */
  writeString(view, 12, 'fmt ');
  /* format chunk length */
  view.setUint32(16, 16, true);
  /* sample format (raw) */
  view.setUint16(20, format, true);
  /* channel count */
  view.setUint16(22, numChannels, true);
  /* sample rate */
  view.setUint32(24, sampleRate, true);
  /* byte rate (sample rate * block align) */
  view.setUint32(28, sampleRate * blockAlign, true);
  /* block align */
  view.setUint16(32, blockAlign, true);
  /* bits per sample */
  view.setUint16(34, bitDepth, true);
  /* data chunk identifier */
  writeString(view, 36, 'data');
  /* data chunk length */
  view.setUint32(40, dataSize, true);

  // Write PCM samples
  let offset = 44;
  for (let i = 0; i < data.length; i++) {
    const s = Math.max(-1, Math.min(1, data[i]!));
    const val = s < 0 ? s * 0x8000 : s * 0x7fff;
    view.setInt16(offset, val, true);
    offset += 2;
  }

  return new Blob([arrayBuffer], { type: 'audio/wav' });
}

function writeString(view: DataView, offset: number, string: string) {
  for (let i = 0; i < string.length; i++) {
    view.setUint8(offset + i, string.charCodeAt(i));
  }
}
