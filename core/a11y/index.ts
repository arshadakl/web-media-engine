export interface A11yConfig {
  ariaLabel: string;
  role: string;
  tabIndex: number;
}

export function getWaveformA11yConfig(
  totalDurationMs: number,
  keepSegments: number,
  cutSegments: number,
): A11yConfig {
  return {
    ariaLabel: `Audio waveform showing ${keepSegments} speech segments and ${cutSegments} silence segments over ${formatMs(totalDurationMs)}`,
    role: "img",
    tabIndex: 0,
  };
}

export function getInteractiveWaveformA11yConfig(): A11yConfig {
  return {
    ariaLabel:
      "Interactive waveform editor. Click to toggle segments. Use arrow keys to navigate.",
    role: "application",
    tabIndex: 0,
  };
}

export function getSegmentA11yLabel(
  type: "speech" | "silence",
  startMs: number,
  endMs: number,
): string {
  const duration = endMs - startMs;
  const typeName = type === "speech" ? "Speech" : "Silence";
  return `${typeName} segment from ${formatMs(startMs)} to ${formatMs(endMs)}, duration ${formatMs(duration)}`;
}

export function getKeyboardShortcuts(): Record<string, string> {
  return {
    Space: "Play/Pause",
    ArrowLeft: "Skip back 5 seconds",
    ArrowRight: "Skip forward 5 seconds",
    ArrowUp: "Previous segment",
    ArrowDown: "Next segment",
    Enter: "Toggle current segment",
    Escape: "Close dialog",
  };
}

function formatMs(ms: number): string {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
}

export function announceToScreenReader(message: string): void {
  const announcer = document.getElementById("sr-announcer");
  if (announcer) {
    announcer.textContent = message;
  }
}
