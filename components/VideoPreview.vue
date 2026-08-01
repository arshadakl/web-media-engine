<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch } from "vue";
import { usePreviewStore } from "~/stores/preview";
import { useFileStore } from "~/stores/file";

const previewStore = usePreviewStore();
const fileStore = useFileStore();

const videoRef = ref<HTMLVideoElement | null>(null);
const isVideoLoaded = ref(false);
const videoDuration = ref(0);

onMounted(() => {
  if (videoRef.value) {
    previewStore.setVideoElement(videoRef.value);
  }
});

onUnmounted(() => {
  previewStore.setVideoElement(null);
});

function onLoadedMetadata() {
  if (videoRef.value) {
    isVideoLoaded.value = true;
    videoDuration.value = videoRef.value.duration * 1000;
    fileStore.setDuration(videoDuration.value);
  }
}

function onTimeUpdate() {
  if (!videoRef.value) return;
  const currentTimeMs = videoRef.value.currentTime * 1000;
  previewStore.setCurrentTime(currentTimeMs);
}

function onEnded() {
  previewStore.setPlaying(false);
}

watch(
  () => previewStore.isPlaying,
  (isPlaying) => {
    if (!videoRef.value) return;
    if (isPlaying) {
      videoRef.value.play().catch(() => {
        previewStore.setPlaying(false);
      });
    } else {
      videoRef.value.pause();
    }
  },
);

watch(
  () => previewStore.currentTimeMs,
  (timeMs) => {
    if (!videoRef.value) return;
    const timeSec = timeMs / 1000;
    if (Math.abs(videoRef.value.currentTime - timeSec) > 0.1) {
      videoRef.value.currentTime = timeSec;
    }
  },
);

watch(
  () => previewStore.playbackRate,
  (rate) => {
    if (videoRef.value) {
      videoRef.value.playbackRate = rate;
    }
  },
);

const videoUrl = ref<string | null>(null);

watch(
  () => fileStore.file,
  (file) => {
    if (videoUrl.value) {
      URL.revokeObjectURL(videoUrl.value);
    }
    if (file) {
      videoUrl.value = URL.createObjectURL(file);
    } else {
      videoUrl.value = null;
    }
  },
  { immediate: true },
);
</script>

<template>
  <div class="relative w-full bg-black rounded-lg overflow-hidden">
    <video
      v-if="videoUrl"
      ref="videoRef"
      :src="videoUrl"
      class="w-full max-h-[400px] object-contain"
      preload="auto"
      crossorigin="anonymous"
      @loadedmetadata="onLoadedMetadata"
      @timeupdate="onTimeUpdate"
      @ended="onEnded"
    />
    <div
      v-else
      class="w-full h-[200px] flex items-center justify-center text-white/50"
    >
      No video loaded
    </div>
  </div>
</template>
