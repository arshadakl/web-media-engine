import { defineStore } from "pinia";
import type { Segment, RuleConfig } from "~core/timeline/timeline-types";
import type { EDL } from "~core/timeline/edl";
import { createDefaultRuleConfig } from "~core/timeline/timeline-types";
import { buildRulesPipeline } from "~core/timeline/rules";
import { generateEDL } from "~core/timeline/edl";

export interface TimelineState {
  rawSegments: Segment[];
  processedSegments: Segment[];
  edl: EDL | null;
  overrides: { entryIndex: number; newAction: "keep" | "cut" }[];
  settings: RuleConfig;
  sampleRate: number;
}

export const useTimelineStore = defineStore("timeline", {
  state: (): TimelineState => ({
    rawSegments: [],
    processedSegments: [],
    edl: null,
    overrides: [],
    settings: createDefaultRuleConfig(),
    sampleRate: 44100,
  }),

  actions: {
    setRawSegments(segments: Segment[]) {
      this.rawSegments = segments;
      this.reprocess();
    },

    updateSettings(partial: Partial<RuleConfig>) {
      this.settings = { ...this.settings, ...partial };
      this.reprocess();
    },

    toggleEntry(entryIndex: number) {
      const existing = this.overrides.find((o) => o.entryIndex === entryIndex);
      if (existing) {
        this.overrides = this.overrides.filter(
          (o) => o.entryIndex !== entryIndex,
        );
      } else {
        const entry = this.edl?.entries[entryIndex];
        if (entry) {
          this.overrides.push({
            entryIndex,
            newAction: entry.action === "keep" ? "cut" : "keep",
          });
        }
      }
      this.recomputeEDL();
    },

    reprocess() {
      const pipeline = buildRulesPipeline(this.settings);
      this.processedSegments = pipeline(this.rawSegments);
      this.recomputeEDL();
    },

    recomputeEDL() {
      let segments = [...this.processedSegments];

      // Apply overrides
      for (const override of this.overrides) {
        segments = segments.map((seg, i) => {
          if (i === override.entryIndex) {
            return {
              ...seg,
              type: override.newAction === "keep" ? "speech" : "silence",
            };
          }
          return seg;
        });
      }

      this.edl = generateEDL(segments, this.sampleRate);
    },

    clearTimeline() {
      this.rawSegments = [];
      this.processedSegments = [];
      this.edl = null;
      this.overrides = [];
    },
  },

  getters: {
    hasTimeline: (state) => state.rawSegments.length > 0,
    keepEntries: (state) =>
      state.edl?.entries.filter((e) => e.action === "keep") ?? [],
    cutEntries: (state) =>
      state.edl?.entries.filter((e) => e.action === "cut") ?? [],
    totalDurationMs: (state) => state.edl?.totalDurationMs ?? 0,
    outputDurationMs: (state) => state.edl?.outputDurationMs ?? 0,
    timeSavedMs: (state) =>
      (state.edl?.totalDurationMs ?? 0) - (state.edl?.outputDurationMs ?? 0),
    percentageRemoved: (state) => {
      const total = state.edl?.totalDurationMs ?? 0;
      const output = state.edl?.outputDurationMs ?? 0;
      return total > 0 ? ((total - output) / total) * 100 : 0;
    },
  },
});
