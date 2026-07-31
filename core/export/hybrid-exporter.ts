import type { EditEntry } from "../timeline/edl";
import type { KeyframeData } from "./keyframe-probe";
import { nearestKeyframeBefore, nearestKeyframeAfter } from "./keyframe-probe";

export type ExportTaskType = "copy" | "reencode";

export interface ExportTask {
  type: ExportTaskType;
  entryIndex: number;
  startMs: number;
  endMs: number;
  gopStartMs: number;
  gopEndMs: number;
}

export interface ExportPlan {
  tasks: ExportTask[];
  totalSegments: number;
  copySegments: number;
  reencodeSegments: number;
}

export function generateExportPlan(
  entries: EditEntry[],
  keyframes: KeyframeData,
  gopDurationMs: number = 2000,
): ExportPlan {
  const keepEntries = entries.filter((e) => e.action === "keep");
  const tasks: ExportTask[] = [];

  for (let i = 0; i < keepEntries.length; i++) {
    const entry = keepEntries[i];
    const entryStart = entry.startMs;
    const entryEnd = entry.endMs;

    // Find keyframes at or near entry boundaries
    const kfAfterStart = nearestKeyframeAfter(keyframes, entryStart);
    const kfBeforeEnd = nearestKeyframeBefore(keyframes, entryEnd);

    // Check if entry aligns with keyframes
    const startsOnKeyframe = Math.abs(entryStart - kfAfterStart) < 1;
    const endsOnKeyframe = Math.abs(entryEnd - kfBeforeEnd) < 1;

    if (startsOnKeyframe && endsOnKeyframe) {
      // Clean copy — entire segment between keyframes
      tasks.push({
        type: "copy",
        entryIndex: i,
        startMs: entryStart,
        endMs: entryEnd,
        gopStartMs: entryStart,
        gopEndMs: entryEnd,
      });
    } else {
      // Need re-encode for non-aligned portions
      const gopStart = Math.floor(entryStart / gopDurationMs) * gopDurationMs;
      const gopEnd = Math.ceil(entryEnd / gopDurationMs) * gopDurationMs;
      tasks.push({
        type: "reencode",
        entryIndex: i,
        startMs: entryStart,
        endMs: entryEnd,
        gopStartMs: gopStart,
        gopEndMs: gopEnd,
      });
    }
  }

  const copySegments = tasks.filter((t) => t.type === "copy").length;
  const reencodeSegments = tasks.filter((t) => t.type === "reencode").length;

  return {
    tasks,
    totalSegments: tasks.length,
    copySegments,
    reencodeSegments,
  };
}

export function estimateExportTime(plan: ExportPlan): number {
  // Rough estimate: copy is instant, re-encode takes ~1x realtime
  return plan.reencodeSegments * 2000; // 2s per segment estimate
}
