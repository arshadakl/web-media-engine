import type { WorkerMessage, ExportWorkerResponse } from "./message-contracts";

let abortController: AbortController | null = null;

self.onmessage = async (event: MessageEvent<WorkerMessage>) => {
  const { type, id, payload } = event.data;

  try {
    switch (type) {
      case "start-export":
        await handleStartExport(id, payload as { edl: unknown; file: File });
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

async function handleStartExport(
  id: number,
  payload: { edl: unknown; file: File },
): Promise<void> {
  abortController = new AbortController();

  const { edl: _edl, file: _file } = payload;

  try {
    // Step 1: Load FFmpeg
    sendProgress(id, 0, "Loading FFmpeg...");
    await loadFFmpeg();

    // Step 2: Extract audio
    sendProgress(id, 10, "Extracting audio...");
    // await extractAudio(file)

    // Step 3: Run VAD
    sendProgress(id, 30, "Analyzing audio...");
    // const vadFrames = await runVAD(audioData)

    // Step 4: Build timeline
    sendProgress(id, 50, "Building timeline...");
    // const segments = buildSegments(vadFrames)
    // const edl = generateEDL(segments)

    // Step 5: Export
    sendProgress(id, 70, "Exporting video...");
    // await exportVideo(edl, file)

    sendComplete(id, "/output.mp4");
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

async function loadFFmpeg(): Promise<void> {
  // Placeholder for FFmpeg loading
  await new Promise((resolve) => setTimeout(resolve, 100));
}

function sendProgress(id: number, progress: number, step: string): void {
  sendResponse({
    type: "export-progress",
    id,
    payload: { progress, step },
  });
}

function sendComplete(id: number, outputPath: string): void {
  sendResponse({
    type: "export-complete",
    id,
    payload: { progress: 100, step: "Export complete", outputPath },
  });
}

function sendResponse(response: ExportWorkerResponse): void {
  self.postMessage(response);
}

function sendError(id: number, error: string): void {
  self.postMessage({ type: "export-error", id, error });
}
