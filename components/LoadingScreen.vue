<script setup lang="ts">
import { ref, onMounted } from "vue";

const props = defineProps<{
  message?: string;
}>();

const progress = ref(0);
const currentStep = ref("Initializing...");

const steps = [
  "Initializing...",
  "Loading FFmpeg...",
  "Loading ONNX Runtime...",
  "Loading Silero VAD model...",
  "Ready!",
];

onMounted(() => {
  let step = 0;
  const interval = setInterval(() => {
    if (step < steps.length) {
      currentStep.value = steps[step];
      progress.value = Math.round(((step + 1) / steps.length) * 100);
      step++;
    } else {
      clearInterval(interval);
    }
  }, 500);
});
</script>

<template>
  <div
    class="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center"
  >
    <div class="bg-card p-8 rounded-xl shadow-xl max-w-sm w-full space-y-6">
      <div class="text-center">
        <div class="text-4xl mb-4">⚙️</div>
        <h2 class="text-lg font-semibold">Preparing Engine</h2>
        <p class="text-sm text-muted-foreground mt-1">
          {{ props.message || currentStep }}
        </p>
      </div>

      <div class="space-y-2">
        <div class="h-2 bg-muted rounded-full overflow-hidden">
          <div
            class="h-full bg-primary transition-all duration-500 rounded-full"
            :style="{ width: `${progress}%` }"
          />
        </div>
        <p class="text-xs text-muted-foreground text-center">{{ progress }}%</p>
      </div>

      <div class="space-y-1">
        <div
          v-for="(step, index) in steps"
          :key="step"
          class="flex items-center gap-2 text-sm"
        >
          <span
            class="w-4 h-4 rounded-full flex items-center justify-center text-xs"
            :class="{
              'bg-primary text-primary-foreground':
                index < steps.indexOf(currentStep),
              'bg-primary/20 text-primary':
                index === steps.indexOf(currentStep),
              'bg-muted text-muted-foreground':
                index > steps.indexOf(currentStep),
            }"
          >
            {{ index < steps.indexOf(currentStep) ? "✓" : index + 1 }}
          </span>
          <span
            :class="{
              'text-foreground': index <= steps.indexOf(currentStep),
              'text-muted-foreground': index > steps.indexOf(currentStep),
            }"
          >
            {{ step }}
          </span>
        </div>
      </div>
    </div>
  </div>
</template>
