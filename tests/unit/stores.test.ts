import { describe, it, expect, beforeEach } from "vitest";
import { setActivePinia, createPinia } from "pinia";
import { useFileStore } from "../../stores/file";
import { useTimelineStore } from "../../stores/timeline";
import { usePreviewStore } from "../../stores/preview";
import { useExportStore } from "../../stores/export";
import { useErrorStore } from "../../stores/error";
import { AppError } from "~/core/errors";

describe("File Store", () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  it("should initialize with empty state", () => {
    const store = useFileStore();
    expect(store.hasFile).toBe(false);
    expect(store.fileName).toBe("");
  });

  it("should set file", () => {
    const store = useFileStore();
    const file = new File(["test"], "test.mp4", { type: "video/mp4" });
    store.setFile(file);
    expect(store.hasFile).toBe(true);
    expect(store.fileName).toBe("test.mp4");
  });

  it("should clear file", () => {
    const store = useFileStore();
    const file = new File(["test"], "test.mp4", { type: "video/mp4" });
    store.setFile(file);
    store.clearFile();
    expect(store.hasFile).toBe(false);
  });
});

describe("Timeline Store", () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  it("should initialize with empty state", () => {
    const store = useTimelineStore();
    expect(store.hasTimeline).toBe(false);
    expect(store.rawSegments.length).toBe(0);
  });

  it("should update settings", () => {
    const store = useTimelineStore();
    store.updateSettings({ minSilenceMs: 1000 });
    expect(store.settings.minSilenceMs).toBe(1000);
  });
});

describe("Preview Store", () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  it("should initialize with default state", () => {
    const store = usePreviewStore();
    expect(store.isPlaying).toBe(false);
    expect(store.playbackRate).toBe(1);
  });

  it("should set playback rate", () => {
    const store = usePreviewStore();
    store.setPlaybackRate(1.5);
    expect(store.playbackRate).toBe(1.5);
  });
});

describe("Export Store", () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  it("should initialize with default state", () => {
    const store = useExportStore();
    expect(store.isExporting).toBe(false);
    expect(store.progress).toBe(0);
  });

  it("should start export", () => {
    const store = useExportStore();
    store.startExport();
    expect(store.isExporting).toBe(true);
  });

  it("should complete export", () => {
    const store = useExportStore();
    store.startExport();
    store.completeExport("/output.mp4");
    expect(store.isExporting).toBe(false);
    expect(store.outputPath).toBe("/output.mp4");
  });
});

describe("Error Store", () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  it("should initialize with no errors", () => {
    const store = useErrorStore();
    expect(store.hasErrors).toBe(false);
  });

  it("should add error", () => {
    const store = useErrorStore();
    const error = new AppError("test", "TEST", true);
    store.addError(error);
    expect(store.hasErrors).toBe(true);
    expect(store.currentError).toBe(error);
  });

  it("should clear current error", () => {
    const store = useErrorStore();
    const error = new AppError("test", "TEST", true);
    store.addError(error);
    store.clearCurrentError();
    expect(store.hasCurrentError).toBe(false);
  });
});
