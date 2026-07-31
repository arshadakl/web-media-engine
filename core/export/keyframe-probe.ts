export interface KeyframeData {
  timestamps: Float64Array;
  durationMs: number;
}

export function parseKeyframeTimestamps(
  ffprobeOutput: string,
  durationMs: number,
): KeyframeData {
  const lines = ffprobeOutput.trim().split("\n");
  const timestamps: number[] = [];

  for (const line of lines) {
    const match = line.match(/pts_time:(\d+\.?\d*)/);
    if (match) {
      timestamps.push(parseFloat(match[1]) * 1000);
    }
  }

  timestamps.sort((a, b) => a - b);
  return {
    timestamps: new Float64Array(timestamps),
    durationMs,
  };
}

export function nearestKeyframeBefore(
  keyframes: KeyframeData,
  ms: number,
): number {
  const { timestamps } = keyframes;
  if (timestamps.length === 0) return 0;

  let low = 0;
  let high = timestamps.length - 1;
  let result = 0;

  while (low <= high) {
    const mid = Math.floor((low + high) / 2);
    if (timestamps[mid] <= ms) {
      result = timestamps[mid];
      low = mid + 1;
    } else {
      high = mid - 1;
    }
  }

  return result;
}

export function nearestKeyframeAfter(
  keyframes: KeyframeData,
  ms: number,
): number {
  const { timestamps, durationMs } = keyframes;
  if (timestamps.length === 0) return durationMs;

  let low = 0;
  let high = timestamps.length - 1;
  let result = durationMs;

  while (low <= high) {
    const mid = Math.floor((low + high) / 2);
    if (timestamps[mid] >= ms) {
      result = timestamps[mid];
      high = mid - 1;
    } else {
      low = mid + 1;
    }
  }

  return result;
}

export function findKeyframesInRange(
  keyframes: KeyframeData,
  startMs: number,
  endMs: number,
): number[] {
  const result: number[] = [];
  const { timestamps } = keyframes;

  for (let i = 0; i < timestamps.length; i++) {
    if (timestamps[i] >= startMs && timestamps[i] <= endMs) {
      result.push(timestamps[i]);
    }
  }

  return result;
}
