import { defineStore } from "pinia";
import type { SeekState } from "~/core/preview/seek-engine";

export interface PreviewState {
  isPlaying: boolean;
  currentTimeMs: number;
  currentEntryIndex: number;
  playbackRate: number;
  videoElement: HTMLVideoElement | null;
}

export const usePreviewStore = defineStore("preview", {
  state: (): PreviewState => ({
    isPlaying: false,
    currentTimeMs: 0,
    currentEntryIndex: 0,
    playbackRate: 1,
    videoElement: null,
  }),

  actions: {
    setPlaying(playing: boolean) {
      this.isPlaying = playing;
    },

    setCurrentTime(timeMs: number) {
      this.currentTimeMs = timeMs;
    },

    setCurrentEntryIndex(index: number) {
      this.currentEntryIndex = index;
    },

    setPlaybackRate(rate: number) {
      this.playbackRate = rate;
      if (this.videoElement) {
        this.videoElement.playbackRate = rate;
      }
    },

    setVideoElement(element: HTMLVideoElement | null) {
      this.videoElement = element;
    },

    updateFromSeekState(state: SeekState) {
      this.isPlaying = state.isPlaying;
      this.currentTimeMs = state.currentTimeMs;
      this.currentEntryIndex = state.currentEntryIndex;
    },

    reset() {
      this.isPlaying = false;
      this.currentTimeMs = 0;
      this.currentEntryIndex = 0;
      this.playbackRate = 1;
    },
  },

  getters: {
    formattedTime: (state) => {
      const ms = state.currentTimeMs;
      const seconds = Math.floor(ms / 1000);
      const minutes = Math.floor(seconds / 60);
      const remainingSeconds = seconds % 60;
      const milliseconds = Math.floor((ms % 1000) / 10);
      return `${minutes.toString().padStart(2, "0")}:${remainingSeconds.toString().padStart(2, "0")}.${milliseconds.toString().padStart(2, "0")}`;
    },
  },
});
