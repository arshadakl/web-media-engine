import type { VADFrame } from "../vad/vad-types";

export interface Segment {
  id: string;
  type: "speech" | "silence";
  startMs: number;
  endMs: number;
  avgSpeechProb: number;
}

export interface RuleConfig {
  minSilenceMs: number;
  minSpeechMs: number;
  targetPauseDurationMs: number;
  paddingMs: number;
  mergeGapMs: number;
  pauseCompressionThresholdMs: number;
}

export type RuleFn = (segments: Segment[]) => Segment[];

export function createDefaultRuleConfig(): RuleConfig {
  return {
    minSilenceMs: 500,
    minSpeechMs: 300,
    targetPauseDurationMs: 200,
    paddingMs: 50,
    mergeGapMs: 300,
    pauseCompressionThresholdMs: 2000,
  };
}

export function buildSegments(frames: VADFrame[]): Segment[] {
  if (frames.length === 0) return [];

  const segments: Segment[] = [];
  let currentType: "speech" | "silence" = frames[0].isSpeech
    ? "speech"
    : "silence";
  let startMs = frames[0].startMs;
  let totalProb = frames[0].speechProb;
  let frameCount = 1;

  for (let i = 1; i < frames.length; i++) {
    const frame = frames[i];
    const frameType: "speech" | "silence" = frame.isSpeech
      ? "speech"
      : "silence";

    if (frameType !== currentType) {
      segments.push({
        id: `seg-${segments.length}`,
        type: currentType,
        startMs,
        endMs: frames[i - 1].endMs,
        avgSpeechProb: totalProb / frameCount,
      });
      currentType = frameType;
      startMs = frame.startMs;
      totalProb = frame.speechProb;
      frameCount = 1;
    } else {
      totalProb += frame.speechProb;
      frameCount++;
    }
  }

  segments.push({
    id: `seg-${segments.length}`,
    type: currentType,
    startMs,
    endMs: frames[frames.length - 1].endMs,
    avgSpeechProb: totalProb / frameCount,
  });

  return segments;
}
