<script setup lang="ts">
import { ref, computed } from "vue";
import { useTimelineStore } from "~/stores/timeline";

const timelineStore = useTimelineStore();
const isAdvanced = ref(false);

const minSilenceMs = computed({
  get: () => timelineStore.settings.minSilenceMs,
  set: (val: number) => timelineStore.updateSettings({ minSilenceMs: val }),
});

const minSpeechMs = computed({
  get: () => timelineStore.settings.minSpeechMs,
  set: (val: number) => timelineStore.updateSettings({ minSpeechMs: val }),
});

const targetPauseDurationMs = computed({
  get: () => timelineStore.settings.targetPauseDurationMs,
  set: (val: number) =>
    timelineStore.updateSettings({ targetPauseDurationMs: val }),
});

const paddingMs = computed({
  get: () => timelineStore.settings.paddingMs,
  set: (val: number) => timelineStore.updateSettings({ paddingMs: val }),
});

const mergeGapMs = computed({
  get: () => timelineStore.settings.mergeGapMs,
  set: (val: number) => timelineStore.updateSettings({ mergeGapMs: val }),
});

const pauseCompressionThresholdMs = computed({
  get: () => timelineStore.settings.pauseCompressionThresholdMs,
  set: (val: number) =>
    timelineStore.updateSettings({ pauseCompressionThresholdMs: val }),
});

function formatMs(ms: number): string {
  if (ms >= 1000) {
    return `${(ms / 1000).toFixed(1)}s`;
  }
  return `${ms}ms`;
}
</script>

<template>
  <div class="space-y-4 p-4 border rounded-lg">
    <div class="flex items-center justify-between">
      <h3 class="font-medium">Silence Removal Settings</h3>
      <button
        class="text-sm text-muted-foreground hover:text-foreground"
        @click="isAdvanced = !isAdvanced"
      >
        {{ isAdvanced ? "Simple" : "Advanced" }}
      </button>
    </div>

    <div class="space-y-4">
      <div>
        <label class="text-sm font-medium">
          Minimum Silence: {{ formatMs(minSilenceMs) }}
        </label>
        <input
          v-model.number="minSilenceMs"
          type="range"
          min="100"
          max="2000"
          step="100"
          class="w-full"
        />
      </div>

      <div>
        <label class="text-sm font-medium">
          Minimum Speech: {{ formatMs(minSpeechMs) }}
        </label>
        <input
          v-model.number="minSpeechMs"
          type="range"
          min="100"
          max="1000"
          step="100"
          class="w-full"
        />
      </div>

      <div>
        <label class="text-sm font-medium">
          Target Pause Duration: {{ formatMs(targetPauseDurationMs) }}
        </label>
        <input
          v-model.number="targetPauseDurationMs"
          type="range"
          min="50"
          max="500"
          step="50"
          class="w-full"
        />
      </div>

      <template v-if="isAdvanced">
        <div>
          <label class="text-sm font-medium">
            Padding: {{ formatMs(paddingMs) }}
          </label>
          <input
            v-model.number="paddingMs"
            type="range"
            min="0"
            max="200"
            step="10"
            class="w-full"
          />
        </div>

        <div>
          <label class="text-sm font-medium">
            Merge Gap: {{ formatMs(mergeGapMs) }}
          </label>
          <input
            v-model.number="mergeGapMs"
            type="range"
            min="100"
            max="1000"
            step="100"
            class="w-full"
          />
        </div>

        <div>
          <label class="text-sm font-medium">
            Pause Compression Threshold:
            {{ formatMs(pauseCompressionThresholdMs) }}
          </label>
          <input
            v-model.number="pauseCompressionThresholdMs"
            type="range"
            min="500"
            max="5000"
            step="500"
            class="w-full"
          />
        </div>
      </template>
    </div>
  </div>
</template>
