import { defineStore } from "pinia";
import type { AppError } from "~core/errors";

export interface ErrorState {
  errors: AppError[];
  currentError: AppError | null;
}

export const useErrorStore = defineStore("error", {
  state: (): ErrorState => ({
    errors: [],
    currentError: null,
  }),

  actions: {
    addError(error: AppError) {
      this.errors.push(error);
      this.currentError = error;
    },

    clearCurrentError() {
      this.currentError = null;
    },

    dismissError(index: number) {
      this.errors.splice(index, 1);
      if (this.currentError === this.errors[index]) {
        this.currentError = null;
      }
    },

    clearAllErrors() {
      this.errors = [];
      this.currentError = null;
    },
  },

  getters: {
    hasErrors: (state) => state.errors.length > 0,
    hasCurrentError: (state) => state.currentError !== null,
    recoverableErrors: (state) => state.errors.filter((e) => e.recoverable),
  },
});
