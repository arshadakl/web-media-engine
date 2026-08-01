<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch } from "vue";
import { useTimelineStore } from "~/stores/timeline";
import { usePreviewStore } from "~/stores/preview";

const timelineStore = useTimelineStore();
const previewStore = usePreviewStore();

const canvasRef = ref<HTMLCanvasElement | null>(null);
const containerRef = ref<HTMLDivElement | null>(null);
const isHovering = ref(false);
const hoverX = ref(0);

const props = defineProps<{
  waveformData?: Float32Array;
}>();

const emit = defineEmits<{
  seek: [timeMs: number];
  toggle: [entryIndex: number];
}>();

const COLORS = {
  keep: "rgba(34, 197, 94, 0.6)",
  keepStroke: "rgba(34, 197, 94, 1)",
  cut: "rgba(239, 68, 68, 0.4)",
  cutStroke: "rgba(239, 68, 68, 1)",
  waveform: "rgba(59, 130, 246, 0.8)",
  background: "rgb(24, 24, 27)",
  grid: "rgba(255, 255, 255, 0.1)",
  playhead: "rgba(255, 255, 255, 0.9)",
  hover: "rgba(255, 255, 255, 0.15)",
};

function draw() {
  const canvas = canvasRef.value;
  const container = containerRef.value;
  if (!canvas || !container) return;

  const rect = container.getBoundingClientRect();
  const dpr = window.devicePixelRatio || 1;
  canvas.width = rect.width * dpr;
  canvas.height = rect.height * dpr;
  canvas.style.width = `${rect.width}px`;
  canvas.style.height = `${rect.height}px`;

  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  ctx.scale(dpr, dpr);
  const width = rect.width;
  const height = rect.height;

  // Background
  ctx.fillStyle = COLORS.background;
  ctx.fillRect(0, 0, width, height);

  const edl = timelineStore.edl;
  if (!edl || edl.entries.length === 0) {
    ctx.fillStyle = "rgba(255, 255, 255, 0.3)";
    ctx.font = "14px system-ui";
    ctx.textAlign = "center";
    ctx.fillText("No timeline data", width / 2, height / 2);
    return;
  }

  const totalDurationMs = edl.totalDurationMs;

  // Draw grid lines (every second)
  ctx.strokeStyle = COLORS.grid;
  ctx.lineWidth = 1;
  for (let ms = 0; ms < totalDurationMs; ms += 1000) {
    const x = (ms / totalDurationMs) * width;
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, height);
    ctx.stroke();
  }

  // Draw keep/cut regions
  for (const entry of edl.entries) {
    const x1 = (entry.startMs / totalDurationMs) * width;
    const x2 = (entry.endMs / totalDurationMs) * width;

    ctx.fillStyle = entry.action === "keep" ? COLORS.keep : COLORS.cut;
    ctx.fillRect(x1, 0, x2 - x1, height);

    ctx.strokeStyle =
      entry.action === "keep" ? COLORS.keepStroke : COLORS.cutStroke;
    ctx.lineWidth = 1;
    ctx.strokeRect(x1, 0, x2 - x1, height);
  }

  // Draw waveform
  if (props.waveformData && props.waveformData.length > 0) {
    ctx.strokeStyle = COLORS.waveform;
    ctx.lineWidth = 1;
    ctx.beginPath();

    const samplesPerPixel = Math.ceil(props.waveformData.length / width);
    const midY = height / 2;

    for (let x = 0; x < width; x++) {
      const sampleIndex = Math.floor((x / width) * props.waveformData.length);
      let maxVal = 0;
      for (
        let j = 0;
        j < samplesPerPixel && sampleIndex + j < props.waveformData.length;
        j++
      ) {
        const val = Math.abs(props.waveformData[sampleIndex + j]);
        if (val > maxVal) maxVal = val;
      }
      const barHeight = maxVal * midY * 0.8;
      ctx.moveTo(x, midY - barHeight);
      ctx.lineTo(x, midY + barHeight);
    }
    ctx.stroke();
  }

  // Draw hover indicator
  if (isHovering.value) {
    ctx.fillStyle = COLORS.hover;
    ctx.fillRect(hoverX.value - 1, 0, 2, height);
  }

  // Draw playhead
  const currentTimeMs = previewStore.currentTimeMs;
  const playheadX = (currentTimeMs / totalDurationMs) * width;
  ctx.strokeStyle = COLORS.playhead;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(playheadX, 0);
  ctx.lineTo(playheadX, height);
  ctx.stroke();
}

function getTimeFromX(clientX: number): number {
  const canvas = canvasRef.value;
  if (!canvas || !timelineStore.edl) return 0;

  const rect = canvas.getBoundingClientRect();
  const x = clientX - rect.left;
  const ratio = x / rect.width;
  return ratio * timelineStore.edl.totalDurationMs;
}

function getEntryIndexAtX(clientX: number): number {
  const canvas = canvasRef.value;
  if (!canvas || !timelineStore.edl) return -1;

  const rect = canvas.getBoundingClientRect();
  const x = clientX - rect.left;
  const ratio = x / rect.width;
  const timeMs = ratio * timelineStore.edl.totalDurationMs;

  for (let i = 0; i < timelineStore.edl.entries.length; i++) {
    const entry = timelineStore.edl.entries[i];
    if (timeMs >= entry.startMs && timeMs < entry.endMs) {
      return i;
    }
  }
  return -1;
}

function onMouseMove(e: MouseEvent) {
  isHovering.value = true;
  hoverX.value =
    e.clientX - (canvasRef.value?.getBoundingClientRect().left ?? 0);
}

function onMouseLeave() {
  isHovering.value = false;
}

function onClick(e: MouseEvent) {
  const timeMs = getTimeFromX(e.clientX);
  const entryIndex = getEntryIndexAtX(e.clientX);

  if (entryIndex >= 0 && e.shiftKey) {
    // Shift+click to toggle segment
    emit("toggle", entryIndex);
    timelineStore.toggleEntry(entryIndex);
  } else {
    // Regular click to seek
    emit("seek", timeMs);
    previewStore.setCurrentTime(timeMs);
  }
}

function onKeyDown(e: KeyboardEvent) {
  if (e.key === "ArrowLeft") {
    previewStore.setCurrentTime(Math.max(0, previewStore.currentTimeMs - 5000));
  } else if (e.key === "ArrowRight") {
    previewStore.setCurrentTime(previewStore.currentTimeMs + 5000);
  } else if (e.key === " ") {
    e.preventDefault();
    previewStore.setPlaying(!previewStore.isPlaying);
  }
}

onMounted(() => {
  draw();
  window.addEventListener("resize", draw);
});

onUnmounted(() => {
  window.removeEventListener("resize", draw);
});

watch(
  () => [timelineStore.edl, previewStore.currentTimeMs, props.waveformData],
  () => draw(),
  { deep: true },
);
</script>

<template>
  <div
    ref="containerRef"
    class="relative w-full h-full min-h-[128px] rounded-lg overflow-hidden outline-none"
    tabindex="0"
    @keydown="onKeyDown"
  >
    <canvas
      ref="canvasRef"
      class="absolute inset-0 cursor-crosshair"
      @mousemove="onMouseMove"
      @mouseleave="onMouseLeave"
      @click="onClick"
    />
    <div
      class="absolute bottom-2 right-2 text-xs text-white/50 bg-black/50 px-2 py-1 rounded"
    >
      Shift+Click to toggle segment
    </div>
  </div>
</template>
