import type { Segment } from "./timeline-types";

export interface EditEntry {
  action: "keep" | "cut";
  startMs: number;
  endMs: number;
  startSample: number;
  endSample: number;
}

export interface EDL {
  entries: EditEntry[];
  totalDurationMs: number;
  outputDurationMs: number;
}

export function generateEDL(
  segments: Segment[],
  sampleRate: number = 44100,
): EDL {
  const entries: EditEntry[] = segments.map((seg) => ({
    action: seg.type === "speech" ? "keep" : "cut",
    startMs: seg.startMs,
    endMs: seg.endMs,
    startSample: Math.floor((seg.startMs / 1000) * sampleRate),
    endSample: Math.floor((seg.endMs / 1000) * sampleRate),
  }));

  const totalDurationMs =
    entries.length > 0 ? entries[entries.length - 1].endMs : 0;
  const outputDurationMs = entries
    .filter((e) => e.action === "keep")
    .reduce((sum, e) => sum + (e.endMs - e.startMs), 0);

  return { entries, totalDurationMs, outputDurationMs };
}

export function validateEDL(edl: EDL): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  const { entries } = edl;

  if (entries.length === 0) {
    return { valid: true, errors: [] };
  }

  // Check for gaps
  for (let i = 1; i < entries.length; i++) {
    const prev = entries[i - 1];
    const curr = entries[i];
    if (curr.startMs !== prev.endMs) {
      errors.push(
        `Gap or overlap between entries ${i - 1} and ${i}: ${prev.endMs}ms → ${curr.startMs}ms`,
      );
    }
  }

  // Check for overlaps
  for (let i = 1; i < entries.length; i++) {
    const prev = entries[i - 1];
    const curr = entries[i];
    if (curr.startMs < prev.endMs) {
      errors.push(`Overlap between entries ${i - 1} and ${i}`);
    }
  }

  return { valid: errors.length === 0, errors };
}

export function getTimeSaved(edl: EDL): {
  timeSavedMs: number;
  percentageRemoved: number;
} {
  const timeSavedMs = edl.totalDurationMs - edl.outputDurationMs;
  const percentageRemoved =
    edl.totalDurationMs > 0 ? (timeSavedMs / edl.totalDurationMs) * 100 : 0;
  return { timeSavedMs, percentageRemoved };
}
