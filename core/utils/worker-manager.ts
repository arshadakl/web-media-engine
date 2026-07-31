/**
 * Worker Manager for pooled web workers with typed message contracts.
 * Handles worker lifecycle, message routing, and crash recovery.
 */

export interface WorkerMessage<T = unknown> {
  id: string;
  type: string;
  payload: T;
}

export interface WorkerResponse<T = unknown> {
  id: string;
  type: string;
  payload: T;
  workerId: number;
}

export interface WorkerManagerOptions {
  /** Number of workers in the pool (default: navigator.hardwareConcurrency - 2) */
  poolSize?: number;
  /** Worker script URL */
  workerUrl: string | URL;
  /** Maximum restart attempts per worker (default: 3) */
  maxRestarts?: number;
}

type MessageHandler<T> = (response: WorkerResponse<T>) => void;
type ErrorHandler = (error: Error, workerId: number) => void;

interface WorkerInstance {
  worker: Worker;
  id: number;
  restartCount: number;
  busy: boolean;
}

/**
 * Generic worker manager with pool, message routing, and crash recovery.
 */
export class WorkerManager<TSend = unknown, TRecv = unknown> {
  private readonly workerUrl: string | URL;
  private readonly poolSize: number;
  private readonly maxRestarts: number;
  private workers: WorkerInstance[] = [];
  private messageHandlers = new Map<string, MessageHandler<TRecv>>();
  private errorHandler: ErrorHandler | null = null;
  private nextWorkerIndex = 0;
  private messageIdCounter = 0;

  constructor(options: WorkerManagerOptions) {
    this.workerUrl = options.workerUrl;
    this.poolSize = options.poolSize ?? this.getDefaultPoolSize();
    this.maxRestarts = options.maxRestarts ?? 3;
  }

  /**
   * Initialize the worker pool.
   */
  async initialize(): Promise<void> {
    const initPromises: Promise<void>[] = [];
    for (let i = 0; i < this.poolSize; i++) {
      initPromises.push(this.createWorker(i));
    }
    await Promise.all(initPromises);
  }

  /**
   * Terminate all workers and clean up.
   */
  terminate(): void {
    for (const instance of this.workers) {
      instance.worker.terminate();
    }
    this.workers = [];
    this.messageHandlers.clear();
  }

  /**
   * Send a message to the next available worker.
   * @param type - Message type identifier
   * @param payload - Message payload
   * @returns Promise that resolves with the response
   */
  postMessage(type: string, payload: TSend): Promise<WorkerResponse<TRecv>> {
    return new Promise((resolve, reject) => {
      const worker = this.getNextWorker();
      if (!worker) {
        reject(new Error("No available workers"));
        return;
      }

      const id = this.generateMessageId();
      const message: WorkerMessage<TSend> = { id, type, payload };

      this.messageHandlers.set(id, (response) => {
        this.messageHandlers.delete(id);
        worker.busy = false;
        resolve(response);
      });

      worker.busy = true;
      worker.worker.postMessage(message);
    });
  }

  /**
   * Register a handler for worker responses.
   * @param id - Message ID to listen for
   * @param handler - Response handler
   */
  onResponse(id: string, handler: MessageHandler<TRecv>): void {
    this.messageHandlers.set(id, handler);
  }

  /**
   * Register an error handler for worker errors.
   * @param handler - Error handler function
   */
  onError(handler: ErrorHandler): void {
    this.errorHandler = handler;
  }

  /**
   * Get the number of active workers.
   * @returns Number of workers in the pool
   */
  getPoolSize(): number {
    return this.workers.length;
  }

  /**
   * Get the number of busy workers.
   * @returns Number of busy workers
   */
  getBusyCount(): number {
    return this.workers.filter((w) => w.busy).length;
  }

  /**
   * Get the number of available workers.
   * @returns Number of available workers
   */
  getAvailableCount(): number {
    return this.workers.filter((w) => !w.busy).length;
  }

  private getDefaultPoolSize(): number {
    if (
      typeof navigator !== "undefined" &&
      "hardwareConcurrency" in navigator
    ) {
      return Math.max(1, navigator.hardwareConcurrency - 2);
    }
    return 2;
  }

  private async createWorker(id: number): Promise<void> {
    const worker = new Worker(this.workerUrl, { type: "module" });

    const instance: WorkerInstance = {
      worker,
      id,
      restartCount: 0,
      busy: false,
    };

    worker.onmessage = (event: MessageEvent<WorkerResponse<TRecv>>) => {
      const handler = this.messageHandlers.get(event.data.id);
      if (handler) {
        handler(event.data);
      }
    };

    worker.onerror = (event) => {
      this.handleWorkerError(instance, new Error(event.message));
    };

    this.workers.push(instance);
  }

  private async handleWorkerError(
    instance: WorkerInstance,
    error: Error,
  ): Promise<void> {
    instance.busy = false;

    if (this.errorHandler) {
      this.errorHandler(error, instance.id);
    }

    if (instance.restartCount < this.maxRestarts) {
      instance.restartCount++;
      instance.worker.terminate();
      await this.createWorker(instance.id);
    }
  }

  private getNextWorker(): WorkerInstance | null {
    const available = this.workers.filter((w) => !w.busy);
    if (available.length === 0) {
      return null;
    }

    // Round-robin selection
    const worker = available[this.nextWorkerIndex % available.length];
    this.nextWorkerIndex = (this.nextWorkerIndex + 1) % available.length;
    return worker;
  }

  private generateMessageId(): string {
    return `msg-${++this.messageIdCounter}-${Date.now()}`;
  }
}

/**
 * Create a worker manager instance.
 * @param options - Configuration options
 * @returns WorkerManager instance
 */
export function createWorkerManager<TSend = unknown, TRecv = unknown>(
  options: WorkerManagerOptions,
): WorkerManager<TSend, TRecv> {
  return new WorkerManager<TSend, TRecv>(options);
}
