<script setup lang="ts">
import { computed, ref } from "vue";
import { useFileStore } from "~/stores/file";
import { useTimelineStore } from "~/stores/timeline";
import { usePreviewStore } from "~/stores/preview";

const fileStore = useFileStore();
const timelineStore = useTimelineStore();
const previewStore = usePreviewStore();

const isLoading = ref(false);
const showCutList = ref(false);

const showEditor = computed(
  () => fileStore.hasFile && timelineStore.hasTimeline,
);

function onSeek(timeMs: number) {
  previewStore.setCurrentTime(timeMs);
}

function onToggle(entryIndex: number) {
  timelineStore.toggleEntry(entryIndex);
}
</script>

<template>
  <div class="space-y-6">
    <LoadingScreen v-if="isLoading" />

    <ErrorDisplay />

    <section v-if="!showEditor && !isLoading" class="max-w-2xl mx-auto">
      <FileUpload />
    </section>

    <section v-if="showEditor" class="space-y-6">
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div class="lg:col-span-2 space-y-4">
          <VideoPreview />
          <WaveformCanvas @seek="onSeek" @toggle="onToggle" />
          <TransportControls />
        </div>

        <div class="space-y-4">
          <SettingsPanel />
          <StatisticsPanel />

          <div class="flex gap-2">
            <button
              class="flex-1 px-4 py-2 border rounded-md hover:bg-muted text-sm"
              @click="showCutList = !showCutList"
            >
              {{ showCutList ? "Hide" : "Show" }} Cut List
            </button>
          </div>

          <CutListPanel v-if="showCutList" />
          <ExportButton />
        </div>
      </div>
    </section>

    <section
      v-if="fileStore.hasFile && !timelineStore.hasTimeline && !isLoading"
      class="text-center py-12"
    >
      <div class="animate-pulse space-y-2">
        <p class="text-lg font-medium">Analyzing video...</p>
        <p class="text-sm text-muted-foreground">
          Running VAD to detect speech segments
        </p>
      </div>
    </section>
  </div>
</template>
