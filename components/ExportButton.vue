<script setup lang="ts">
import { computed } from "vue";
import { useExportStore } from "~/stores/export";
import { useTimelineStore } from "~/stores/timeline";

const exportStore = useExportStore();
const timelineStore = useTimelineStore();

const canExport = computed(
  () => timelineStore.hasTimeline && !exportStore.isExporting,
);

function startExport() {
  exportStore.startExport();
  // Export logic will be handled by worker
}
</script>

<template>
  <div class="space-y-2">
    <button
      class="w-full px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
      :disabled="!canExport"
      @click="startExport"
    >
      {{ exportStore.isExporting ? "Exporting..." : "Export Video" }}
    </button>

    <div v-if="exportStore.isExporting" class="space-y-1">
      <div class="h-2 bg-muted rounded-full overflow-hidden">
        <div
          class="h-full bg-primary transition-all"
          :style="{ width: `${exportStore.progress}%` }"
        />
      </div>
      <p class="text-xs text-muted-foreground text-center">
        {{ exportStore.currentStep }} {{ exportStore.formattedProgress }}
      </p>
    </div>

    <div
      v-if="exportStore.error"
      class="p-2 text-sm text-destructive bg-destructive/10 rounded"
    >
      {{ exportStore.error }}
    </div>
  </div>
</template>
