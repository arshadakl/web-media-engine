import type { EditEntry, EDL } from "../timeline/edl";

export interface SeekState {
  currentEntryIndex: number;
  currentTimeMs: number;
  isPlaying: boolean;
}

export function createSeekEngine(edl: EDL) {
  const keepEntries = edl.entries.filter((e) => e.action === "keep");
  let state: SeekState = {
    currentEntryIndex: 0,
    currentTimeMs: 0,
    isPlaying: false,
  };

  function getCurrentEntry(): EditEntry | null {
    return keepEntries[state.currentEntryIndex] ?? null;
  }

  function seekTo(outputTimeMs: number): SeekState {
    let accumulated = 0;
    for (let i = 0; i < keepEntries.length; i++) {
      const entry = keepEntries[i];
      const entryDuration = entry.endMs - entry.startMs;
      if (outputTimeMs <= accumulated + entryDuration) {
        state = {
          currentEntryIndex: i,
          currentTimeMs: outputTimeMs - accumulated + entry.startMs,
          isPlaying: state.isPlaying,
        };
        return state;
      }
      accumulated += entryDuration;
    }
    // Past end — go to last entry
    const last = keepEntries[keepEntries.length - 1];
    if (last) {
      state = {
        currentEntryIndex: keepEntries.length - 1,
        currentTimeMs: last.endMs,
        isPlaying: false,
      };
    }
    return state;
  }

  function nextSegment(): SeekState {
    if (state.currentEntryIndex < keepEntries.length - 1) {
      state = {
        currentEntryIndex: state.currentEntryIndex + 1,
        currentTimeMs: keepEntries[state.currentEntryIndex + 1].startMs,
        isPlaying: state.isPlaying,
      };
    } else {
      state = { ...state, isPlaying: false };
    }
    return state;
  }

  function previousSegment(): SeekState {
    if (state.currentEntryIndex > 0) {
      state = {
        currentEntryIndex: state.currentEntryIndex - 1,
        currentTimeMs: keepEntries[state.currentEntryIndex - 1].startMs,
        isPlaying: state.isPlaying,
      };
    } else {
      state = { ...state, currentTimeMs: keepEntries[0]?.startMs ?? 0 };
    }
    return state;
  }

  function getSourceTimeMs(): number {
    const entry = getCurrentEntry();
    if (!entry) return 0;
    return state.currentTimeMs;
  }

  function getOutputTimeMs(): number {
    let accumulated = 0;
    for (let i = 0; i < state.currentEntryIndex; i++) {
      accumulated += keepEntries[i].endMs - keepEntries[i].startMs;
    }
    const entry = getCurrentEntry();
    if (!entry) return accumulated;
    return accumulated + (state.currentTimeMs - entry.startMs);
  }

  function shouldSeek(currentVideoTimeMs: number): boolean {
    const entry = getCurrentEntry();
    if (!entry) return false;
    return (
      currentVideoTimeMs < entry.startMs || currentVideoTimeMs >= entry.endMs
    );
  }

  function getState(): SeekState {
    return { ...state };
  }

  function setPlaying(playing: boolean): void {
    state = { ...state, isPlaying: playing };
  }

  return {
    seekTo,
    nextSegment,
    previousSegment,
    getSourceTimeMs,
    getOutputTimeMs,
    shouldSeek,
    getState,
    setPlaying,
    getCurrentEntry,
    get keepEntries() {
      return keepEntries;
    },
  };
}

export type SeekEngine = ReturnType<typeof createSeekEngine>;
