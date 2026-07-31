import { defineStore } from "pinia";
import type { ExportPlan } from "~/core/export/hybrid-exporter";

export interface ExportState {
  isExporting: boolean;
  progress: number;
  currentStep: string;
  plan: ExportPlan | null;
  outputPath: string | null;
  error: string | null;
}

export const useExportStore = defineStore("export", {
  state: (): ExportState => ({
    isExporting: false,
    progress: 0,
    currentStep: "",
    plan: null,
    outputPath: null,
    error: null,
  }),

  actions: {
    startExport() {
      this.isExporting = true;
      this.progress = 0;
      this.currentStep = "Preparing export...";
      this.error = null;
    },

    setProgress(progress: number, step: string) {
      this.progress = progress;
      this.currentStep = step;
    },

    setPlan(plan: ExportPlan) {
      this.plan = plan;
    },

    completeExport(outputPath: string) {
      this.isExporting = false;
      this.progress = 100;
      this.currentStep = "Export complete";
      this.outputPath = outputPath;
    },

    setError(error: string) {
      this.isExporting = false;
      this.error = error;
    },

    cancelExport() {
      this.isExporting = false;
      this.progress = 0;
      this.currentStep = "";
      this.error = null;
    },

    reset() {
      this.isExporting = false;
      this.progress = 0;
      this.currentStep = "";
      this.plan = null;
      this.outputPath = null;
      this.error = null;
    },
  },

  getters: {
    canExport: (state) => !state.isExporting && state.error === null,
    formattedProgress: (state) => `${Math.round(state.progress)}%`,
  },
});
