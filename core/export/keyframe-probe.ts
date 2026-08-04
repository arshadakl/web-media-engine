export interface KeyframeMap {
  timestamps: Float64Array;
  fps: number;
}

export function estimateKeyframeMap(durationSeconds: number, fps = 30, gopSizeFrames = 30): KeyframeMap {
  const totalFrames = Math.ceil(durationSeconds * fps);
  const keyframeIndices: number[] = [];

  for (let f = 0; f < totalFrames; f += gopSizeFrames) {
    keyframeIndices.push(f / fps);
  }

  return {
    timestamps: Float64Array.from(keyframeIndices),
    fps,
  };
}

export function isNearKeyframe(timeSeconds: number, keyframeMap: KeyframeMap, toleranceSec = 0.08): boolean {
  for (let i = 0; i < keyframeMap.timestamps.length; i++) {
    if (Math.abs(keyframeMap.timestamps[i]! - timeSeconds) <= toleranceSec) {
      return true;
    }
  }
  return false;
}
