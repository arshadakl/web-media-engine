export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

export interface VideoInfo {
  durationMs: number;
  width: number;
  height: number;
  fps: number;
  codec: string;
  audioCodec: string;
  hasAudio: boolean;
}

export function parseFFProbeOutput(output: string): VideoInfo {
  const lines = output.trim().split("\n");
  const info: Partial<VideoInfo> = {
    hasAudio: false,
  };

  let inAudioStream = false;

  for (const line of lines) {
    if (line.includes("codec_type=audio")) {
      inAudioStream = true;
      info.hasAudio = true;
    }
    if (line.includes("codec_type=video")) {
      inAudioStream = false;
    }
    if (line.includes("duration=")) {
      const match = line.match(/duration=([\d.]+)/);
      if (match) {
        info.durationMs = parseFloat(match[1]) * 1000;
      }
    }
    if (line.includes("width=")) {
      const match = line.match(/width=(\d+)/);
      if (match) info.width = parseInt(match[1]);
    }
    if (line.includes("height=")) {
      const match = line.match(/height=(\d+)/);
      if (match) info.height = parseInt(match[1]);
    }
    if (line.includes("r_frame_rate=")) {
      const match = line.match(/r_frame_rate=(\d+)\/(\d+)/);
      if (match) {
        info.fps = parseInt(match[1]) / parseInt(match[2]);
      }
    }
    if (line.includes("codec_name=")) {
      const match = line.match(/codec_name=(\w+)/);
      if (match) {
        if (inAudioStream) {
          info.audioCodec = match[1];
        } else {
          info.codec = match[1];
        }
      }
    }
  }

  return info as VideoInfo;
}

export function validateOutput(
  original: VideoInfo,
  output: VideoInfo,
  expectedDurationMs: number,
  toleranceMs: number = 100,
): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Check duration matches expected
  if (Math.abs(output.durationMs - expectedDurationMs) > toleranceMs) {
    errors.push(
      `Duration mismatch: expected ${expectedDurationMs}ms, got ${output.durationMs}ms`,
    );
  }

  // Check resolution preserved
  if (output.width !== original.width || output.height !== original.height) {
    errors.push(
      `Resolution changed: ${original.width}x${original.height} → ${output.width}x${output.height}`,
    );
  }

  // Check framerate preserved
  if (Math.abs(output.fps - original.fps) > 0.1) {
    warnings.push(`Framerate changed: ${original.fps} → ${output.fps}`);
  }

  // Check audio preserved
  if (original.hasAudio && !output.hasAudio) {
    errors.push("Audio track missing in output");
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

export function validateTimestamps(
  edlDurationMs: number,
  outputDurationMs: number,
): ValidationResult {
  const errors: string[] = [];
  const toleranceMs = 100;

  if (Math.abs(edlDurationMs - outputDurationMs) > toleranceMs) {
    errors.push(
      `EDL duration ${edlDurationMs}ms does not match output ${outputDurationMs}ms`,
    );
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings: [],
  };
}
