import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  WorkerManager,
  createWorkerManager,
} from "../../core/utils/worker-manager";

// Mock Worker class
class MockWorker {
  onmessage: ((event: MessageEvent) => void) | null = null;
  onerror: ((event: ErrorEvent) => void) | null = null;
  private terminated = false;

  constructor(public readonly url: string | URL) {}

  postMessage(data: unknown): void {
    // Simulate async response
    setTimeout(() => {
      if (this.onmessage && !this.terminated) {
        const response = {
          data: {
            id: (data as { id: string }).id,
            type: "response",
            payload: { success: true },
            workerId: 0,
          },
        };
        this.onmessage(response as MessageEvent);
      }
    }, 10);
  }

  terminate(): void {
    this.terminated = true;
  }
}

// Mock global Worker
Object.defineProperty(globalThis, "Worker", {
  value: MockWorker,
  writable: true,
  configurable: true,
});

describe("WorkerManager", () => {
  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  describe("createWorkerManager", () => {
    it("should create a worker manager instance", () => {
      const manager = createWorkerManager({
        workerUrl: "worker.js",
        poolSize: 2,
      });
      expect(manager).toBeInstanceOf(WorkerManager);
    });
  });

  describe("initialization", () => {
    it("should initialize with specified pool size", async () => {
      const manager = createWorkerManager({
        workerUrl: "worker.js",
        poolSize: 3,
      });
      await manager.initialize();
      expect(manager.getPoolSize()).toBe(3);
      manager.terminate();
    });

    it("should use default pool size", async () => {
      const manager = createWorkerManager({
        workerUrl: "worker.js",
      });
      await manager.initialize();
      expect(manager.getPoolSize()).toBeGreaterThan(0);
      manager.terminate();
    });
  });

  describe("message passing", () => {
    it("should send message and receive response", async () => {
      const manager = createWorkerManager<
        { test: string },
        { success: boolean }
      >({
        workerUrl: "worker.js",
        poolSize: 1,
      });
      await manager.initialize();

      const promise = manager.postMessage("test", { test: "hello" });
      vi.advanceTimersByTime(50);
      const response = await promise;
      expect(response.payload).toEqual({ success: true });

      manager.terminate();
    }, 10000);

    it("should handle multiple messages", async () => {
      const manager = createWorkerManager({
        workerUrl: "worker.js",
        poolSize: 2,
      });
      await manager.initialize();

      const promise1 = manager.postMessage("test", { data: 1 });
      const promise2 = manager.postMessage("test", { data: 2 });
      vi.advanceTimersByTime(50);

      const [response1, response2] = await Promise.all([promise1, promise2]);
      expect(response1.payload).toEqual({ success: true });
      expect(response2.payload).toEqual({ success: true });

      manager.terminate();
    }, 10000);
  });

  describe("worker state", () => {
    it("should track busy workers", async () => {
      const manager = createWorkerManager({
        workerUrl: "worker.js",
        poolSize: 2,
      });
      await manager.initialize();

      expect(manager.getBusyCount()).toBe(0);
      expect(manager.getAvailableCount()).toBe(2);

      manager.terminate();
    });
  });

  describe("termination", () => {
    it("should terminate all workers", async () => {
      const manager = createWorkerManager({
        workerUrl: "worker.js",
        poolSize: 2,
      });
      await manager.initialize();
      manager.terminate();
      expect(manager.getPoolSize()).toBe(0);
    });
  });
});
