<script setup lang="ts"></script>

<template>
  <div class="min-h-screen bg-background">
    <header class="border-b">
      <div class="container mx-auto px-4 py-4">
        <h1 class="text-2xl font-bold">Web Media Engine</h1>
        <p class="text-muted-foreground">
          Remove silence from videos in your browser
        </p>
      </div>
    </header>

    <main class="container mx-auto px-4 py-8">
      <slot />
    </main>

    <footer class="border-t mt-auto">
      <div
        class="container mx-auto px-4 py-4 text-center text-sm text-muted-foreground"
      >
        All processing runs locally in your browser. No files are uploaded.
      </div>
    </footer>
  </div>
</template>
