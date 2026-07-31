export interface DownloadResult {
  success: boolean;
  error?: string;
}

export async function saveWithFSA(
  data: Blob,
  filename: string,
): Promise<DownloadResult> {
  try {
    const handle = await window.showSaveFilePicker({
      suggestedName: filename,
      types: [
        {
          description: "MP4 Video",
          accept: { "video/mp4": [".mp4"] },
        },
      ],
    });
    const writable = await handle.createWritable();
    await writable.write(data);
    await writable.close();
    return { success: true };
  } catch (err) {
    if (err instanceof DOMException && err.name === "AbortError") {
      return { success: false, error: "User cancelled" };
    }
    return { success: false, error: String(err) };
  }
}

export function saveWithBlob(data: Blob, filename: string): DownloadResult {
  const url = URL.createObjectURL(data);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  return { success: true };
}

export function supportsFSA(): boolean {
  return "showSaveFilePicker" in window;
}

export function shouldWarnLargeFile(sizeBytes: number): boolean {
  return sizeBytes > 2 * 1024 * 1024 * 1024; // 2GB
}

export async function downloadVideo(
  data: Blob,
  filename: string,
): Promise<DownloadResult> {
  if (supportsFSA()) {
    return saveWithFSA(data, filename);
  }
  return saveWithBlob(data, filename);
}
