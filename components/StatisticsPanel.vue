<script setup lang="ts">
import { computed } from "vue";
import { useTimelineStore } from "~/stores/timeline";

const timelineStore = useTimelineStore();

function formatMs(ms: number): string {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
}

const stats = computed(() => ({
  original: formatMs(timelineStore.totalDurationMs),
  output: formatMs(timelineStore.outputDurationMs),
  saved: formatMs(timelineStore.timeSavedMs),
  percentage: Math.round(timelineStore.percentageRemoved),
  cuts: timelineStore.cutEntries.length,
}));
</script>

<template>
  <div class="p-4 border rounded-lg space-y-2">
    <h3 class="font-medium">Statistics</h3>

    <div class="grid grid-cols-2 gap-2 text-sm">
      <div>
        <span class="text-muted-foreground">Original:</span>
        <span class="ml-2 font-mono">{{ stats.original }}</span>
      </div>
      <div>
        <span class="text-muted-foreground">Output:</span>
        <span class="ml-2 font-mono">{{ stats.output }}</span>
      </div>
      <div>
        <span class="text-muted-foreground">Saved:</span>
        <span class="ml-2 font-mono text-green-600">{{ stats.saved }}</span>
      </div>
      <div>
        <span class="text-muted-foreground">Removed:</span>
        <span class="ml-2 font-mono text-green-600"
          >{{ stats.percentage }}%</span
        >
      </div>
      <div class="col-span-2">
        <span class="text-muted-foreground">Cuts:</span>
        <span class="ml-2 font-mono">{{ stats.cuts }}</span>
      </div>
    </div>
  </div>
</template>
