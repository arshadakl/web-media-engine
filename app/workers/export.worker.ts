import type { WorkerMessage } from "./message-contracts";

interface FFmpegInstance {
  load: (config: unknown) => Promise<void>;
  writeFile: (name: string, data: Uint8Array) => Promise<void>;
  readFile: (name: string) => Promise<Uint8Array>;
  exec: (args: string[]) => Promise<void>;
  deleteFile: (name: string) => Promise<void>;
  on: (event: string, callback: (data: unknown) => void) => void;
  fetchFile: (file: File) => Promise<Uint8Array>;
}

let ffmpeg: FFmpegInstance | null = null;
let isInitialized = false;
let abortController: AbortController | null = null;

self.onmessage = async (event: MessageEvent<WorkerMessage>) => {
  const { type, id, payload } = event.data;

  try {
    switch (type) {
      case "init":
        await handleInit(id);
        break;
      case "start-export":
        await handleStartExport(
          id,
          payload as { edl: unknown; file: File; sampleRate: number },
        );
        break;
      case "cancel-export":
        handleCancelExport(id);
        break;
      default:
        sendError(id, `Unknown message type: ${type}`);
    }
  } catch (err) {
    sendError(id, String(err));
  }
};

async function handleInit(id: number): Promise<void> {
  try {
    const { FFmpeg } = await import("@ffmpeg/ffmpeg");
    const { fetchFile, toBlobURL } = await import("@ffmpeg/util");

    const ffmpegInstance = new FFmpeg();

    const baseURL = "https://unpkg.com/@ffmpeg/core@0.12.6/dist/esm";

    await ffmpegInstance.load({
      coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, "text/javascript"),
      wasmURL: await toBlobURL(
        `${baseURL}/ffmpeg-core.wasm`,
        "application/wasm",
      ),
    });

    // Store with fetchFile attached
    ffmpeg = ffmpegInstance as unknown as FFmpegInstance;
    ffmpeg.fetchFile = fetchFile as unknown as (
      file: File,
    ) => Promise<Uint8Array>;

    isInitialized = true;
    sendResponse({ type: "init-complete", id });
  } catch (err) {
    sendError(id, `Failed to initialize FFmpeg: ${err}`);
  }
}

async function handleStartExport(
  id: number,
  payload: { edl: unknown; file: File; sampleRate: number },
): Promise<void> {
  if (!isInitialized || !ffmpeg) {
    sendError(id, "FFmpeg not initialized");
    return;
  }

  abortController = new AbortController();

  const { edl, file } = payload;
  const edlData = edl as {
    entries: Array<{ action: string; startMs: number; endMs: number }>;
  };

  try {
    // Step 1: Write input file
    sendProgress(id, 10, "Reading video file...");
    const inputName = "input.mp4";
    await ffmpeg.writeFile(inputName, await ffmpeg.fetchFile(file));

    // Step 2: Extract keep segments
    sendProgress(id, 30, "Extracting segments...");
    const keepEntries = edlData.entries.filter((e) => e.action === "keep");
    const segmentFiles: string[] = [];

    for (let i = 0; i < keepEntries.length; i++) {
      if (abortController?.signal.aborted) {
        throw new Error("Export cancelled");
      }

      const entry = keepEntries[i];
      const startSec = (entry.startMs / 1000).toFixed(3);
      const endSec = (entry.endMs / 1000).toFixed(3);
      const segmentName = `seg_${i.toString().padStart(4, "0")}.mp4`;

      await ffmpeg.exec([
        "-ss",
        startSec,
        "-to",
        endSec,
        "-i",
        inputName,
        "-c",
        "copy",
        "-avoid_negative_ts",
        "make_zero",
        "-y",
        segmentName,
      ]);

      segmentFiles.push(segmentName);

      const progress = 30 + (i / keepEntries.length) * 40;
      sendProgress(
        id,
        progress,
        `Extracting segment ${i + 1}/${keepEntries.length}...`,
      );
    }

    // Step 3: Create concat list
    sendProgress(id, 75, "Merging segments...");
    const concatList = segmentFiles.map((f) => `file '${f}'`).join("\n");
    await ffmpeg.writeFile("concat.txt", new TextEncoder().encode(concatList));

    // Step 4: Concat segments
    const outputName = "output.mp4";
    await ffmpeg.exec([
      "-f",
      "concat",
      "-safe",
      "0",
      "-i",
      "concat.txt",
      "-c",
      "copy",
      "-y",
      outputName,
    ]);

    // Step 5: Read output
    sendProgress(id, 90, "Preparing output...");
    const outputData = await ffmpeg.readFile(outputName);

    // Step 6: Cleanup temp files
    for (const f of segmentFiles) {
      await ffmpeg.deleteFile(f);
    }
    await ffmpeg.deleteFile("concat.txt");
    await ffmpeg.deleteFile(inputName);
    await ffmpeg.deleteFile(outputName);

    // Step 7: Create blob and download
    sendProgress(id, 95, "Creating download...");
    const blob = new Blob([outputData], { type: "video/mp4" });
    const url = URL.createObjectURL(blob);

    sendComplete(id, url, file.name.replace(/\.[^/.]+$/, "_trimmed.mp4"));
  } catch (err) {
    if (abortController?.signal.aborted) {
      sendError(id, "Export cancelled");
    } else {
      sendError(id, String(err));
    }
  }
}

function handleCancelExport(id: number): void {
  abortController?.abort();
  sendResponse({ type: "export-cancelled", id });
}

function sendProgress(id: number, progress: number, step: string): void {
  sendResponse({
    type: "export-progress",
    id,
    payload: { progress, step },
  });
}

function sendComplete(id: number, outputPath: string, filename: string): void {
  sendResponse({
    type: "export-complete",
    id,
    payload: { progress: 100, step: "Export complete", outputPath, filename },
  });
}

function sendResponse(response: WorkerMessage): void {
  self.postMessage(response);
}

function sendError(id: number, error: string): void {
  self.postMessage({ type: "error", id, error });
}
