import type { EditEntry, EDL } from "../timeline/edl";

export interface Override {
  entryIndex: number;
  newAction: "keep" | "cut";
}

export function toggleEntry(edl: EDL, entryIndex: number): EDL {
  if (entryIndex < 0 || entryIndex >= edl.entries.length) return edl;

  const entries = edl.entries.map((e, i) => {
    if (i !== entryIndex) return e;
    return {
      ...e,
      action: e.action === "keep" ? "cut" : "keep",
    };
  });

  return recalculateEDL(edl, entries);
}

export function setEntryAction(
  edl: EDL,
  entryIndex: number,
  action: "keep" | "cut",
): EDL {
  if (entryIndex < 0 || entryIndex >= edl.entries.length) return edl;

  const entries = edl.entries.map((e, i) => {
    if (i !== entryIndex) return e;
    return { ...e, action };
  });

  return recalculateEDL(edl, entries);
}

export function applyOverrides(edl: EDL, overrides: Override[]): EDL {
  let entries = [...edl.entries];
  for (const override of overrides) {
    if (override.entryIndex >= 0 && override.entryIndex < entries.length) {
      entries = entries.map((e, i) =>
        i === override.entryIndex ? { ...e, action: override.newAction } : e,
      );
    }
  }
  return recalculateEDL(edl, entries);
}

export function findEntryAtTime(edl: EDL, sourceTimeMs: number): number {
  for (let i = 0; i < edl.entries.length; i++) {
    const entry = edl.entries[i];
    if (sourceTimeMs >= entry.startMs && sourceTimeMs < entry.endMs) {
      return i;
    }
  }
  return -1;
}

function recalculateEDL(original: EDL, entries: EditEntry[]): EDL {
  const totalDurationMs =
    entries.length > 0 ? entries[entries.length - 1].endMs : 0;
  const outputDurationMs = entries
    .filter((e) => e.action === "keep")
    .reduce((sum, e) => sum + (e.endMs - e.startMs), 0);

  return {
    entries,
    totalDurationMs,
    outputDurationMs,
  };
}
