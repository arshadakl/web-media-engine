import type { EDL } from "../timeline/edl";

export interface PreviewStats {
  originalDurationMs: number;
  outputDurationMs: number;
  timeRemovedMs: number;
  percentageRemoved: number;
  numberOfCuts: number;
  avgSilenceRemovedMs: number;
}

export function computeStats(edl: EDL): PreviewStats {
  const originalDurationMs = edl.totalDurationMs;
  const outputDurationMs = edl.outputDurationMs;
  const timeRemovedMs = originalDurationMs - outputDurationMs;
  const percentageRemoved =
    originalDurationMs > 0 ? (timeRemovedMs / originalDurationMs) * 100 : 0;

  const cuts = edl.entries.filter((e) => e.action === "cut");
  const numberOfCuts = cuts.length;
  const avgSilenceRemovedMs =
    numberOfCuts > 0
      ? cuts.reduce((sum, e) => sum + (e.endMs - e.startMs), 0) / numberOfCuts
      : 0;

  return {
    originalDurationMs,
    outputDurationMs,
    timeRemovedMs,
    percentageRemoved,
    numberOfCuts,
    avgSilenceRemovedMs,
  };
}

export function formatDuration(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  const milliseconds = Math.floor((ms % 1000) / 10);
  return `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}.${milliseconds.toString().padStart(2, "0")}`;
}
