import { VADFrame } from '../vad/vad-types';
import { Segment } from './timeline-types';

export function buildSegmentsFromFrames(frames: VADFrame[]): Segment[] {
  if (frames.length === 0) return [];

  const segments: Segment[] = [];
  let currentType: 'speech' | 'silence' = frames[0]!.isSpeech ? 'speech' : 'silence';
  let startMs = frames[0]!.startMs;
  let probSum = frames[0]!.speechProb;
  let frameCount = 1;

  for (let i = 1; i < frames.length; i++) {
    const frame = frames[i]!;
    const frameType: 'speech' | 'silence' = frame.isSpeech ? 'speech' : 'silence';

    if (frameType === currentType) {
      probSum += frame.speechProb;
      frameCount++;
    } else {
      const endMs = frame.startMs;
      segments.push({
        id: `seg_${segments.length}_${Math.round(startMs)}`,
        type: currentType,
        startMs,
        endMs,
        avgSpeechProb: probSum / frameCount,
      });

      currentType = frameType;
      startMs = frame.startMs;
      probSum = frame.speechProb;
      frameCount = 1;
    }
  }

  // Push last segment
  const lastFrame = frames[frames.length - 1]!;
  segments.push({
    id: `seg_${segments.length}_${Math.round(startMs)}`,
    type: currentType,
    startMs,
    endMs: lastFrame.endMs,
    avgSpeechProb: probSum / frameCount,
  });

  return segments;
}
