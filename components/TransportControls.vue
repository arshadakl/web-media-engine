<script setup lang="ts">
import { usePreviewStore } from "~/stores/preview";

const previewStore = usePreviewStore();

const playbackRates = [0.75, 1, 1.25, 1.5, 2];

function togglePlayPause() {
  previewStore.setPlaying(!previewStore.isPlaying);
}

function skipBack() {
  const newTime = Math.max(0, previewStore.currentTimeMs - 5000);
  previewStore.setCurrentTime(newTime);
}

function skipForward() {
  previewStore.setCurrentTime(previewStore.currentTimeMs + 5000);
}

function setRate(rate: number) {
  previewStore.setPlaybackRate(rate);
}
</script>

<template>
  <div class="flex items-center gap-4 p-4 border rounded-lg">
    <button class="p-2 rounded-md hover:bg-muted" @click="skipBack">⏪</button>

    <button
      class="p-3 rounded-full bg-primary text-primary-foreground hover:bg-primary/90"
      @click="togglePlayPause"
    >
      {{ previewStore.isPlaying ? "⏸" : "▶" }}
    </button>

    <button class="p-2 rounded-md hover:bg-muted" @click="skipForward">
      ⏩
    </button>

    <div class="ml-4 text-sm font-mono">
      {{ previewStore.formattedTime }}
    </div>

    <div class="ml-auto flex items-center gap-2">
      <span class="text-sm text-muted-foreground">Speed:</span>
      <button
        v-for="rate in playbackRates"
        :key="rate"
        class="px-2 py-1 text-sm rounded"
        :class="[
          previewStore.playbackRate === rate
            ? 'bg-primary text-primary-foreground'
            : 'hover:bg-muted',
        ]"
        @click="setRate(rate)"
      >
        {{ rate }}×
      </button>
    </div>
  </div>
</template>
