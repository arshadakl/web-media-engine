import { describe, it, expect, vi, beforeEach } from "vitest";
import { FileManager, createFileManager } from "../../core/audio/chunker";

// Mock File System Access API
const mockFileData = new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
const mockFile = new File([mockFileData.buffer], "test.mp4", {
  type: "video/mp4",
});

const mockFileHandle = {
  getFile: vi.fn().mockResolvedValue(mockFile),
};

Object.defineProperty(window, "showOpenFilePicker", {
  value: vi.fn().mockResolvedValue([mockFileHandle]),
  writable: true,
  configurable: true,
});

describe("FileManager", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("createFileManager", () => {
    it("should create a file manager instance", () => {
      expect(createFileManager()).toBeInstanceOf(FileManager);
    });
  });

  describe("isFileSystemAccessSupported", () => {
    it("should return true when showOpenFilePicker exists", () => {
      expect(FileManager.isFileSystemAccessSupported()).toBe(true);
    });
  });

  describe("open with File object", () => {
    it("should open a file and return metadata", async () => {
      const manager = createFileManager();
      const metadata = await manager.open(mockFile);

      expect(metadata.name).toBe("test.mp4");
      expect(metadata.size).toBe(mockFileData.length);
      expect(metadata.type).toBe("video/mp4");
    });

    it("should set correct metadata", async () => {
      const manager = createFileManager();
      await manager.open(mockFile);

      expect(manager.getSize()).toBe(mockFileData.length);
      const meta = manager.getMetadata();
      expect(meta?.name).toBe("test.mp4");
      expect(meta?.type).toBe("video/mp4");
    });
  });

  describe("open with File System Access API", () => {
    it("should open file using showOpenFilePicker", async () => {
      const manager = createFileManager();
      const metadata = await manager.open();

      expect(window.showOpenFilePicker).toHaveBeenCalled();
      expect(metadata.name).toBe("test.mp4");
    });
  });

  describe("readChunk", () => {
    it("should read a chunk of the file", async () => {
      const manager = createFileManager();
      await manager.open(mockFile);

      const chunk = await manager.readChunk(0, 5);
      const view = new Uint8Array(chunk);

      expect(view).toEqual(new Uint8Array([1, 2, 3, 4, 5]));
    });

    it("should read a chunk from the middle", async () => {
      const manager = createFileManager();
      await manager.open(mockFile);

      const chunk = await manager.readChunk(5, 10);
      const view = new Uint8Array(chunk);

      expect(view).toEqual(new Uint8Array([6, 7, 8, 9, 10]));
    });

    it("should throw when no file is opened", async () => {
      const manager = createFileManager();
      await expect(manager.readChunk(0, 5)).rejects.toThrow("No file opened");
    });
  });

  describe("getChunkCount", () => {
    it("should calculate correct chunk count", async () => {
      const manager = createFileManager();
      await manager.open(mockFile);

      expect(manager.getChunkCount(3)).toBe(4);
    });

    it("should handle exact division", async () => {
      const manager = createFileManager();
      await manager.open(mockFile);

      expect(manager.getChunkCount(mockFileData.length)).toBe(1);
    });
  });

  describe("getChunkRanges", () => {
    it("should generate correct chunk ranges", async () => {
      const manager = createFileManager();
      await manager.open(mockFile);

      const ranges = manager.getChunkRanges(4);
      expect(ranges).toEqual([
        { start: 0, end: 4 },
        { start: 4, end: 8 },
        { start: 8, end: mockFileData.length },
      ]);
    });

    it("should handle single chunk", async () => {
      const manager = createFileManager();
      await manager.open(mockFile);

      const ranges = manager.getChunkRanges(100);
      expect(ranges).toEqual([{ start: 0, end: mockFileData.length }]);
    });
  });

  describe("close", () => {
    it("should clear file handle and metadata", async () => {
      const manager = createFileManager();
      await manager.open(mockFile);
      manager.close();

      expect(manager.getSize()).toBe(0);
      expect(manager.getMetadata()).toBeNull();
    });
  });
});
