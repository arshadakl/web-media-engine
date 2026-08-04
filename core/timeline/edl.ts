import { EditEntry, TimelineStats } from './timeline-types';

export function calculateTimelineStats(entries: EditEntry[], totalMediaDurationMs: number): TimelineStats {
  let outputDurationMs = 0;
  let totalCuts = 0;
  let totalKeeps = 0;
  let compressedPausesCount = 0;
  let cutTimeSum = 0;

  entries.forEach((entry) => {
    if (entry.action === 'keep') {
      outputDurationMs += entry.durationMs;
      totalKeeps++;
      if (entry.isCompressedPause) {
        compressedPausesCount++;
      }
    } else {
      totalCuts++;
      cutTimeSum += entry.durationMs;
    }
  });

  const timeSavedMs = Math.max(0, totalMediaDurationMs - outputDurationMs);
  const timeSavedPercent = totalMediaDurationMs > 0 ? (timeSavedMs / totalMediaDurationMs) * 100 : 0;
  const averageCutDurationMs = totalCuts > 0 ? cutTimeSum / totalCuts : 0;

  return {
    originalDurationMs: totalMediaDurationMs,
    outputDurationMs,
    timeSavedMs,
    timeSavedPercent,
    totalCuts,
    totalKeeps,
    compressedPausesCount,
    averageCutDurationMs,
  };
}

export function exportEDLToJson(entries: EditEntry[], originalFilename: string, durationMs: number): string {
  const edlData = {
    version: '1.0',
    app: 'SilenceCutter',
    exportedAt: new Date().toISOString(),
    sourceFile: originalFilename,
    durationMs,
    edl: entries.map((e) => ({
      id: e.id,
      action: e.action,
      startMs: Math.round(e.startMs),
      endMs: Math.round(e.endMs),
      durationMs: Math.round(e.durationMs),
      isCompressedPause: !!e.isCompressedPause,
    })),
  };
  return JSON.stringify(edlData, null, 2);
}

export function generateFFmpegCliScript(entries: EditEntry[], inputFilename = 'input.mp4', outputFilename = 'silence_removed.mp4'): string {
  const keeps = entries.filter((e) => e.action === 'keep');
  if (keeps.length === 0) {
    return '# No keep segments found in EDL';
  }

  let script = `#!/bin/bash\n# SilenceCutter FFmpeg Stream-Copy Script for ${inputFilename}\n# Run this in your terminal where ${inputFilename} is located\n\n`;

  // Filter complex command
  const selectParts: string[] = [];
  const aselectParts: string[] = [];

  keeps.forEach((k) => {
    const startSec = (k.startMs / 1000).toFixed(3);
    const endSec = (k.endMs / 1000).toFixed(3);
    selectParts.push(`between(t,${startSec},${endSec})`);
    aselectParts.push(`between(t,${startSec},${endSec})`);
  });

  const videoFilter = `select='${selectParts.join('+')}',setpts=N/FRAME_RATE/TB`;
  const audioFilter = `aselect='${aselectParts.join('+')}',asetpts=N/SR/TB`;

  script += `ffmpeg -i "${inputFilename}" -vf "${videoFilter}" -af "${audioFilter}" "${outputFilename}"\n`;

  return script;
}
