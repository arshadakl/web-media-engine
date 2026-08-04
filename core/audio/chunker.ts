import { memoryGuard } from '../utils/memory-guard';

export interface ChunkReadOptions {
  startByte: number;
  endByte: number;
}

export class FileChunker {
  private file: File;
  private totalSize: number;

  constructor(file: File) {
    this.file = file;
    this.totalSize = file.size;
  }

  public getFileSize(): number {
    return this.totalSize;
  }

  public async readChunk(startByte: number, endByte: number): Promise<ArrayBuffer> {
    const clampedEnd = Math.min(this.totalSize, endByte);
    const slice = this.file.slice(startByte, clampedEnd);
    return await slice.arrayBuffer();
  }

  public async *streamChunks(chunkSizeBytes?: number): AsyncGenerator<{ index: number; buffer: ArrayBuffer; startByte: number; endByte: number }> {
    const defaultSizeBytes = (chunkSizeBytes || memoryGuard.getMaxChunkSizeMB()) * 1024 * 1024;
    let offset = 0;
    let index = 0;

    while (offset < this.totalSize) {
      const end = Math.min(this.totalSize, offset + defaultSizeBytes);
      const buffer = await this.readChunk(offset, end);
      yield {
        index,
        buffer,
        startByte: offset,
        endByte: end,
      };
      index++;
      offset = end;
    }
  }
}
