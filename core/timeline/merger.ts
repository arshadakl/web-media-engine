import { EditEntry, Segment, TimelineSettings, UserOverride } from './timeline-types';

export function applyMinSilenceFilter(segments: Segment[], minSilenceMs: number): Segment[] {
  if (segments.length === 0) return [];
  const result: Segment[] = [];

  for (const seg of segments) {
    if (seg.type === 'silence' && seg.endMs - seg.startMs < minSilenceMs) {
      // Convert tiny silence to speech segment
      result.push({
        ...seg,
        type: 'speech',
      });
    } else {
      result.push({ ...seg });
    }
  }

  return consolidateAdjacentSegments(result);
}

export function applyMinSpeechFilter(segments: Segment[], minSpeechMs: number): Segment[] {
  if (segments.length === 0) return [];
  const result: Segment[] = [];

  for (const seg of segments) {
    if (seg.type === 'speech' && seg.endMs - seg.startMs < minSpeechMs) {
      result.push({
        ...seg,
        type: 'silence',
      });
    } else {
      result.push({ ...seg });
    }
  }

  return consolidateAdjacentSegments(result);
}

export function applyPaddingAndMerge(
  segments: Segment[],
  paddingMs: number,
  mergeGapMs: number,
  totalMediaDurationMs: number
): Segment[] {
  if (segments.length === 0) return [];

  // Expand speech segments by padding
  const expanded: { type: 'speech' | 'silence'; startMs: number; endMs: number; avgSpeechProb: number }[] = [];

  for (const seg of segments) {
    if (seg.type === 'speech') {
      const paddedStart = Math.max(0, seg.startMs - paddingMs);
      const paddedEnd = Math.min(totalMediaDurationMs, seg.endMs + paddingMs);
      expanded.push({
        type: 'speech',
        startMs: paddedStart,
        endMs: paddedEnd,
        avgSpeechProb: seg.avgSpeechProb,
      });
    }
  }

  if (expanded.length === 0) {
    return [{ id: 'full_silence', type: 'silence', startMs: 0, endMs: totalMediaDurationMs, avgSpeechProb: 0 }];
  }

  // Sort and merge overlapping/close speech segments
  expanded.sort((a, b) => a.startMs - b.startMs);
  const mergedSpeech: { startMs: number; endMs: number; avgSpeechProb: number }[] = [];

  let current = { ...expanded[0]! };
  for (let i = 1; i < expanded.length; i++) {
    const next = expanded[i]!;
    if (next.startMs - current.endMs <= mergeGapMs) {
      // Merge
      current.endMs = Math.max(current.endMs, next.endMs);
      current.avgSpeechProb = (current.avgSpeechProb + next.avgSpeechProb) / 2;
    } else {
      mergedSpeech.push(current);
      current = { ...next };
    }
  }
  mergedSpeech.push(current);

  // Fill gaps with silence
  const result: Segment[] = [];
  let cursorMs = 0;

  mergedSpeech.forEach((speech, idx) => {
    if (speech.startMs > cursorMs) {
      result.push({
        id: `silence_${idx}_${Math.round(cursorMs)}`,
        type: 'silence',
        startMs: cursorMs,
        endMs: speech.startMs,
        avgSpeechProb: 0,
      });
    }
    result.push({
      id: `speech_${idx}_${Math.round(speech.startMs)}`,
      type: 'speech',
      startMs: speech.startMs,
      endMs: speech.endMs,
      avgSpeechProb: speech.avgSpeechProb,
    });
    cursorMs = speech.endMs;
  });

  if (cursorMs < totalMediaDurationMs) {
    result.push({
      id: `silence_end_${Math.round(cursorMs)}`,
      type: 'silence',
      startMs: cursorMs,
      endMs: totalMediaDurationMs,
      avgSpeechProb: 0,
    });
  }

  return result;
}

export function consolidateAdjacentSegments(segments: Segment[]): Segment[] {
  if (segments.length === 0) return [];
  const consolidated: Segment[] = [];

  let current = { ...segments[0]! };
  for (let i = 1; i < segments.length; i++) {
    const next = segments[i]!;
    if (next.type === current.type) {
      current.endMs = next.endMs;
      current.avgSpeechProb = (current.avgSpeechProb + next.avgSpeechProb) / 2;
    } else {
      consolidated.push(current);
      current = { ...next };
    }
  }
  consolidated.push(current);

  return consolidated;
}

export function processTimelineRules(
  initialSegments: Segment[],
  settings: TimelineSettings,
  totalDurationMs: number,
  userOverrides: UserOverride[] = []
): EditEntry[] {
  if (initialSegments.length === 0) return [];

  // Step 1: Min Silence filter
  let step1 = applyMinSilenceFilter(initialSegments, settings.minSilenceMs);

  // Step 2: Min Speech filter
  let step2 = applyMinSpeechFilter(step1, settings.minSpeechMs);

  // Step 3: Padding & Merge gaps
  let step3 = applyPaddingAndMerge(step2, settings.paddingMs, settings.mergeGapMs, totalDurationMs);

  // Step 4: Convert to EditEntry array (Keep / Cut & Pause Compression)
  const entries: EditEntry[] = [];

  step3.forEach((seg, idx) => {
    const originalDuration = seg.endMs - seg.startMs;
    if (seg.type === 'speech') {
      entries.push({
        id: `edl_${idx}_keep`,
        action: 'keep',
        startMs: seg.startMs,
        endMs: seg.endMs,
        durationMs: originalDuration,
        avgSpeechProb: seg.avgSpeechProb,
        originalStartMs: seg.startMs,
        originalEndMs: seg.endMs,
      });
    } else {
      // Silence segment
      if (
        settings.enablePauseCompression &&
        originalDuration >= settings.minSilenceMs &&
        originalDuration <= settings.pauseCompressionThresholdMs
      ) {
        // Pause compression: keep a small target duration, cut the rest
        const keepMs = Math.min(settings.targetPauseDurationMs, originalDuration);
        const cutMs = originalDuration - keepMs;

        // Keep compressed pause
        entries.push({
          id: `edl_${idx}_compressed_keep`,
          action: 'keep',
          startMs: seg.startMs,
          endMs: seg.startMs + keepMs,
          durationMs: keepMs,
          avgSpeechProb: seg.avgSpeechProb,
          isCompressedPause: true,
          originalStartMs: seg.startMs,
          originalEndMs: seg.startMs + keepMs,
        });

        if (cutMs > 0) {
          entries.push({
            id: `edl_${idx}_compressed_cut`,
            action: 'cut',
            startMs: seg.startMs + keepMs,
            endMs: seg.endMs,
            durationMs: cutMs,
            avgSpeechProb: seg.avgSpeechProb,
            originalStartMs: seg.startMs + keepMs,
            originalEndMs: seg.endMs,
          });
        }
      } else {
        // Standard silence cut
        entries.push({
          id: `edl_${idx}_cut`,
          action: 'cut',
          startMs: seg.startMs,
          endMs: seg.endMs,
          durationMs: originalDuration,
          avgSpeechProb: seg.avgSpeechProb,
          originalStartMs: seg.startMs,
          originalEndMs: seg.endMs,
        });
      }
    }
  });

  // Step 5: Apply User Overrides
  if (userOverrides.length > 0) {
    return applyUserOverrides(entries, userOverrides);
  }

  return entries;
}

function applyUserOverrides(entries: EditEntry[], overrides: UserOverride[]): EditEntry[] {
  const result: EditEntry[] = [...entries];

  overrides.forEach((override) => {
    result.forEach((entry) => {
      // If override falls inside or touches entry, override forcedAction
      if (override.startMs <= entry.startMs && override.endMs >= entry.endMs) {
        entry.action = override.forcedAction;
      } else if (
        (override.startMs >= entry.startMs && override.startMs < entry.endMs) ||
        (override.endMs > entry.startMs && override.endMs <= entry.endMs)
      ) {
        entry.action = override.forcedAction;
      }
    });
  });

  return result;
}
