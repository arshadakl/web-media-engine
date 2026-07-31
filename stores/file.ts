import { defineStore } from "pinia";

export interface FileState {
  file: File | null;
  fileName: string;
  fileSize: number;
  durationMs: number;
  isLoading: boolean;
  error: string | null;
}

export const useFileStore = defineStore("file", {
  state: (): FileState => ({
    file: null,
    fileName: "",
    fileSize: 0,
    durationMs: 0,
    isLoading: false,
    error: null,
  }),

  actions: {
    setFile(file: File) {
      this.file = file;
      this.fileName = file.name;
      this.fileSize = file.size;
      this.error = null;
    },

    setDuration(durationMs: number) {
      this.durationMs = durationMs;
    },

    setLoading(loading: boolean) {
      this.isLoading = loading;
    },

    setError(error: string) {
      this.error = error;
    },

    clearFile() {
      this.file = null;
      this.fileName = "";
      this.fileSize = 0;
      this.durationMs = 0;
      this.error = null;
    },
  },

  getters: {
    hasFile: (state) => state.file !== null,
    formattedSize: (state) => {
      const bytes = state.fileSize;
      if (bytes === 0) return "0 B";
      const k = 1024;
      const sizes = ["B", "KB", "MB", "GB"];
      const i = Math.floor(Math.log(bytes) / Math.log(k));
      return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
    },
  },
});
