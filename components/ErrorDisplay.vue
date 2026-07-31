<script setup lang="ts">
import { useErrorStore } from "~/stores/error";
import { getErrorUIConfig } from "~/core/errors";

const errorStore = useErrorStore();

function dismiss(index: number) {
  errorStore.dismissError(index);
}

function retry() {
  errorStore.clearCurrentError();
}
</script>

<template>
  <div v-if="errorStore.hasErrors" class="space-y-2">
    <div
      v-for="(error, index) in errorStore.errors"
      :key="index"
      class="p-4 border border-destructive/50 bg-destructive/10 rounded-lg"
    >
      <div class="flex items-start justify-between">
        <div>
          <h4 class="font-medium text-destructive">
            {{ getErrorUIConfig(error).title }}
          </h4>
          <p class="text-sm mt-1">{{ error.message }}</p>
        </div>
        <button
          class="text-muted-foreground hover:text-foreground"
          @click="dismiss(index)"
        >
          ✕
        </button>
      </div>
      <div v-if="getErrorUIConfig(error).canRetry" class="mt-2">
        <button class="text-sm text-primary hover:underline" @click="retry">
          Retry
        </button>
      </div>
    </div>
  </div>
</template>
