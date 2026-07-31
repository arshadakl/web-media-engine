import type { Segment, RuleFn, RuleConfig } from "./timeline-types";

// Rule 1: Discard silence segments shorter than minSilenceMs
export function createMinSilenceFilter(minSilenceMs: number): RuleFn {
  return (segments: Segment[]) => {
    return segments.filter(
      (seg) => seg.type === "speech" || seg.endMs - seg.startMs >= minSilenceMs,
    );
  };
}

// Rule 2: Discard speech segments shorter than minSpeechMs
export function createMinSpeechFilter(minSpeechMs: number): RuleFn {
  return (segments: Segment[]) => {
    return segments.filter(
      (seg) => seg.type === "silence" || seg.endMs - seg.startMs >= minSpeechMs,
    );
  };
}

// Rule 3: Compress silence to targetPauseDurationMs
export function createPauseCompressor(
  thresholdMs: number,
  targetDurationMs: number,
): RuleFn {
  return (segments: Segment[]) => {
    return segments.map((seg) => {
      if (seg.type !== "silence") return seg;
      const duration = seg.endMs - seg.startMs;
      if (duration > thresholdMs) {
        const mid = (seg.startMs + seg.endMs) / 2;
        return {
          ...seg,
          startMs: mid - targetDurationMs / 2,
          endMs: mid + targetDurationMs / 2,
        };
      }
      return seg;
    });
  };
}

// Rule 4: Pad speech segments by paddingMs
export function createPaddingExpander(paddingMs: number): RuleFn {
  return (segments: Segment[]) => {
    return segments.map((seg) => ({
      ...seg,
      startMs: Math.max(0, seg.startMs - paddingMs),
      endMs: seg.endMs + paddingMs,
    }));
  };
}

// Rule 5: Merge adjacent segments with gap < mergeGapMs
export function createMerger(mergeGapMs: number): RuleFn {
  return (segments: Segment[]) => {
    if (segments.length <= 1) return segments;

    const merged: Segment[] = [segments[0]];

    for (let i = 1; i < segments.length; i++) {
      const prev = merged[merged.length - 1];
      const curr = segments[i];
      const gap = curr.startMs - prev.endMs;

      if (gap < mergeGapMs && prev.type === curr.type) {
        merged[merged.length - 1] = {
          ...prev,
          endMs: curr.endMs,
          avgSpeechProb: (prev.avgSpeechProb + curr.avgSpeechProb) / 2,
        };
      } else {
        merged.push(curr);
      }
    }

    return merged;
  };
}

// Compose rules in sequence
export function composeRules(...rules: RuleFn[]): RuleFn {
  return (segments: Segment[]) => {
    return rules.reduce((result, rule) => rule(result), segments);
  };
}

// Build complete pipeline from config
export function buildRulesPipeline(config: RuleConfig): RuleFn {
  return composeRules(
    createMinSilenceFilter(config.minSilenceMs),
    createMinSpeechFilter(config.minSpeechMs),
    createPauseCompressor(
      config.pauseCompressionThresholdMs,
      config.targetPauseDurationMs,
    ),
    createPaddingExpander(config.paddingMs),
    createMerger(config.mergeGapMs),
  );
}
