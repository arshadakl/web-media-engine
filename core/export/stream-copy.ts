import type { ExportTask } from "./hybrid-exporter";

export interface StreamCopyResult {
  taskIndex: number;
  outputPath: string;
  success: boolean;
  error?: string;
}

export function generateStreamCopyCommand(
  task: ExportTask,
  inputPath: string,
  outputPath: string,
): string[] {
  const startSec = (task.startMs / 1000).toFixed(3);
  const endSec = (task.endMs / 1000).toFixed(3);

  return [
    "-ss",
    startSec,
    "-to",
    endSec,
    "-i",
    inputPath,
    "-c",
    "copy",
    "-avoid_negative_ts",
    "make_zero",
    "-y",
    outputPath,
  ];
}

export function generateConcatList(segments: { path: string }[]): string {
  return segments.map((s) => `file '${s.path}'`).join("\n");
}

export function generateConcatCommand(
  concatListPath: string,
  outputPath: string,
): string[] {
  return [
    "-f",
    "concat",
    "-safe",
    "0",
    "-i",
    concatListPath,
    "-c",
    "copy",
    "-y",
    outputPath,
  ];
}
