<script setup lang="ts">
import { computed } from "vue";
import { useFileStore } from "~/stores/file";
import { useTimelineStore } from "~/stores/timeline";

const fileStore = useFileStore();
const timelineStore = useTimelineStore();

const showEditor = computed(
  () => fileStore.hasFile && timelineStore.hasTimeline,
);
</script>

<template>
  <div class="space-y-8">
    <ErrorDisplay />

    <section v-if="!showEditor" class="max-w-2xl mx-auto">
      <FileUpload />
    </section>

    <section v-if="showEditor" class="space-y-6">
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div class="lg:col-span-2 space-y-4">
          <TransportControls />
          <!-- Waveform visualization will go here -->
          <div
            class="h-32 border rounded-lg flex items-center justify-center text-muted-foreground"
          >
            Waveform visualization
          </div>
        </div>

        <div class="space-y-4">
          <SettingsPanel />
          <StatisticsPanel />
          <ExportButton />
        </div>
      </div>
    </section>

    <section
      v-if="fileStore.hasFile && !timelineStore.hasTimeline"
      class="text-center py-8"
    >
      <p class="text-muted-foreground">Processing video...</p>
    </section>
  </div>
</template>
