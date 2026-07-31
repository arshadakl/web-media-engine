<script setup lang="ts">
import { ref } from "vue";
import { useFileStore } from "~/stores/file";

const fileStore = useFileStore();
const isDragging = ref(false);
const fileInput = ref<HTMLInputElement | null>(null);

const acceptedTypes = "video/*,audio/*,.mp4,.mov,.avi,.mkv,.webm";

function onDragOver(e: DragEvent) {
  e.preventDefault();
  isDragging.value = true;
}

function onDragLeave() {
  isDragging.value = false;
}

function onDrop(e: DragEvent) {
  e.preventDefault();
  isDragging.value = false;
  const files = e.dataTransfer?.files;
  if (files && files.length > 0) {
    handleFile(files[0]);
  }
}

function onFileSelect(e: Event) {
  const input = e.target as HTMLInputElement;
  if (input.files && input.files.length > 0) {
    handleFile(input.files[0]);
  }
}

function handleFile(file: File) {
  if (!file.type.startsWith("video/") && !file.type.startsWith("audio/")) {
    fileStore.setError("Please select a video or audio file");
    return;
  }
  fileStore.setFile(file);
}

function openFilePicker() {
  fileInput.value?.click();
}
</script>

<template>
  <div
    class="border-2 border-dashed rounded-lg p-8 text-center transition-colors"
    :class="[
      isDragging
        ? 'border-primary bg-primary/5'
        : 'border-muted-foreground/25 hover:border-primary/50',
    ]"
    @dragover="onDragOver"
    @dragleave="onDragLeave"
    @drop="onDrop"
  >
    <input
      ref="fileInput"
      type="file"
      :accept="acceptedTypes"
      class="hidden"
      @change="onFileSelect"
    />

    <div v-if="!fileStore.hasFile" class="space-y-4">
      <div class="text-4xl">📁</div>
      <div>
        <p class="text-lg font-medium">Drop your video here</p>
        <p class="text-sm text-muted-foreground">or click to browse</p>
      </div>
      <button
        class="inline-flex items-center justify-center px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
        @click="openFilePicker"
      >
        Select File
      </button>
      <p class="text-xs text-muted-foreground">
        Supports MP4, MOV, AVI, MKV, WebM
      </p>
    </div>

    <div v-else class="space-y-2">
      <p class="font-medium">{{ fileStore.fileName }}</p>
      <p class="text-sm text-muted-foreground">{{ fileStore.formattedSize }}</p>
      <button
        class="text-sm text-destructive hover:underline"
        @click="fileStore.clearFile()"
      >
        Remove file
      </button>
    </div>
  </div>
</template>
