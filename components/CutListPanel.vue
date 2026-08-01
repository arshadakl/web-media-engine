<script setup lang="ts">
import { computed } from "vue";
import { useTimelineStore } from "~/stores/timeline";
import { usePreviewStore } from "~/stores/preview";

const timelineStore = useTimelineStore();
const previewStore = usePreviewStore();

const entries = computed(() => {
  if (!timelineStore.edl) return [];
  return timelineStore.edl.entries.map((entry, index) => ({
    ...entry,
    index,
    durationMs: entry.endMs - entry.startMs,
  }));
});

function formatMs(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  const milliseconds = Math.floor((ms % 1000) / 10);
  return `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}.${milliseconds.toString().padStart(2, "0")}`;
}

function toggleEntry(index: number) {
  timelineStore.toggleEntry(index);
}

function seekTo(timeMs: number) {
  previewStore.setCurrentTime(timeMs);
}
</script>

<template>
  <div class="border rounded-lg overflow-hidden">
    <div class="p-3 border-b bg-muted/50">
      <h3 class="font-medium text-sm">
        Cut List ({{ entries.length }} segments)
      </h3>
    </div>

    <div class="max-h-[400px] overflow-y-auto">
      <div
        v-if="entries.length === 0"
        class="p-8 text-center text-muted-foreground text-sm"
      >
        No segments to display
      </div>

      <table v-else class="w-full text-sm">
        <thead class="sticky top-0 bg-muted/80 backdrop-blur-sm">
          <tr class="text-left text-muted-foreground">
            <th class="p-2 font-medium">#</th>
            <th class="p-2 font-medium">Start</th>
            <th class="p-2 font-medium">End</th>
            <th class="p-2 font-medium">Duration</th>
            <th class="p-2 font-medium">Action</th>
            <th class="p-2 font-medium" />
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="entry in entries"
            :key="entry.index"
            class="border-t hover:bg-muted/30 cursor-pointer"
            :class="{
              'bg-green-500/10': entry.action === 'keep',
              'bg-red-500/10': entry.action === 'cut',
            }"
            @click="seekTo(entry.startMs)"
          >
            <td class="p-2 text-muted-foreground">{{ entry.index + 1 }}</td>
            <td class="p-2 font-mono text-xs">{{ formatMs(entry.startMs) }}</td>
            <td class="p-2 font-mono text-xs">{{ formatMs(entry.endMs) }}</td>
            <td class="p-2 font-mono text-xs">
              {{ formatMs(entry.durationMs) }}
            </td>
            <td class="p-2">
              <span
                class="px-2 py-0.5 rounded text-xs font-medium"
                :class="{
                  'bg-green-500/20 text-green-700': entry.action === 'keep',
                  'bg-red-500/20 text-red-700': entry.action === 'cut',
                }"
              >
                {{ entry.action === "keep" ? "Keep" : "Cut" }}
              </span>
            </td>
            <td class="p-2">
              <button
                class="px-2 py-1 text-xs rounded hover:bg-muted"
                @click.stop="toggleEntry(entry.index)"
              >
                {{ entry.action === "keep" ? "✂" : "↩" }}
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>
