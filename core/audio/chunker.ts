/**
 * File Manager for streaming video file access.
 * Supports File System Access API (Chromium) with fallback to <input> for Firefox/Safari.
 * Never loads the full file into RAM.
 */

export interface FileMetadata {
  name: string;
  size: number;
  type: string;
  lastModified: number;
}

export interface ChunkRange {
  start: number;
  end: number;
}

/**
 * Streaming file manager that supports chunked reads.
 * Uses File System Access API when available, falls back to File API.
 */
export class FileManager {
  private fileHandle: FileSystemFileHandle | File | null = null;
  private metadata: FileMetadata | null = null;
  private useFileSystemAccess = false;

  /**
   * Check if File System Access API is available.
   * @returns True if showOpenFilePicker is supported
   */
  static isFileSystemAccessSupported(): boolean {
    return typeof window !== "undefined" && "showOpenFilePicker" in window;
  }

  /**
   * Open a file using the best available method.
   * @param file - Optional File object (for fallback mode)
   * @returns File metadata
   */
  async open(file?: File): Promise<FileMetadata> {
    if (file) {
      // Fallback mode: use File object directly
      this.fileHandle = file;
      this.useFileSystemAccess = false;
    } else if (FileManager.isFileSystemAccessSupported()) {
      // File System Access API mode
      const [handle] = await window.showOpenFilePicker({
        types: [
          {
            description: "Video files",
            accept: {
              "video/*": [
                ".mp4",
                ".mkv",
                ".webm",
                ".avi",
                ".mov",
                ".flv",
                ".wmv",
              ],
            },
          },
        ],
        multiple: false,
      });
      this.fileHandle = handle;
      this.useFileSystemAccess = true;
    } else {
      throw new Error(
        "No file provided and File System Access API is not available",
      );
    }

    this.metadata = await this.extractMetadata();
    return this.metadata;
  }

  /**
   * Read a chunk of the file.
   * @param start - Start byte position
   * @param end - End byte position (exclusive)
   * @returns ArrayBuffer containing the requested bytes
   */
  async readChunk(start: number, end: number): Promise<ArrayBuffer> {
    if (!this.fileHandle) {
      throw new Error("No file opened. Call open() first.");
    }

    if (this.useFileSystemAccess) {
      return this.readChunkFileSystemAccess(start, end);
    }
    return this.readChunkFileApi(start, end);
  }

  /**
   * Get the file size.
   * @returns File size in bytes
   */
  getSize(): number {
    return this.metadata?.size ?? 0;
  }

  /**
   * Get file metadata.
   * @returns File metadata or null if no file is open
   */
  getMetadata(): FileMetadata | null {
    return this.metadata;
  }

  /**
   * Get the total number of chunks for a given chunk size.
   * @param chunkSize - Size of each chunk in bytes
   * @returns Number of chunks
   */
  getChunkCount(chunkSize: number): number {
    const size = this.getSize();
    return Math.ceil(size / chunkSize);
  }

  /**
   * Get chunk ranges for a given chunk size.
   * @param chunkSize - Size of each chunk in bytes
   * @returns Array of chunk ranges
   */
  getChunkRanges(chunkSize: number): ChunkRange[] {
    const size = this.getSize();
    const ranges: ChunkRange[] = [];
    let offset = 0;

    while (offset < size) {
      const end = Math.min(offset + chunkSize, size);
      ranges.push({ start: offset, end });
      offset = end;
    }

    return ranges;
  }

  /**
   * Close the file handle and release resources.
   */
  close(): void {
    this.fileHandle = null;
    this.metadata = null;
    this.useFileSystemAccess = false;
  }

  private async readChunkFileSystemAccess(
    start: number,
    end: number,
  ): Promise<ArrayBuffer> {
    const handle = this.fileHandle as FileSystemFileHandle;
    const file = await handle.getFile();
    return file.slice(start, end).arrayBuffer();
  }

  private async readChunkFileApi(
    start: number,
    end: number,
  ): Promise<ArrayBuffer> {
    const file = this.fileHandle as File;
    return file.slice(start, end).arrayBuffer();
  }

  private async extractMetadata(): Promise<FileMetadata> {
    if (this.useFileSystemAccess) {
      const handle = this.fileHandle as FileSystemFileHandle;
      const file = await handle.getFile();
      return {
        name: file.name,
        size: file.size,
        type: file.type,
        lastModified: file.lastModified,
      };
    }

    const file = this.fileHandle as File;
    return {
      name: file.name,
      size: file.size,
      type: file.type,
      lastModified: file.lastModified,
    };
  }
}

/**
 * Create a file manager instance.
 * @returns FileManager instance
 */
export function createFileManager(): FileManager {
  return new FileManager();
}
