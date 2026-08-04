import { logger } from './logger';

export interface WorkerMessage<T = unknown> {
  type: string;
  id?: string;
  payload: T;
}

export type WorkerMessageHandler<T = unknown> = (payload: T) => void;

export class WorkerManager {
  private worker: Worker | null = null;
  private messageListeners: Map<string, Set<WorkerMessageHandler>> = new Map();
  private workerScriptUrl: string;

  constructor(workerScriptUrl: string) {
    this.workerScriptUrl = workerScriptUrl;
  }

  public async initialize(): Promise<boolean> {
    try {
      this.worker = new Worker(this.workerScriptUrl, { type: 'module' });
      this.worker.onmessage = (event: MessageEvent<WorkerMessage>) => {
        const { type, payload } = event.data;
        const handlers = this.messageListeners.get(type);
        if (handlers) {
          handlers.forEach((h) => h(payload));
        }
      };

      this.worker.onerror = (error) => {
        logger.error('WorkerManager', `Worker error in ${this.workerScriptUrl}`, error);
      };

      logger.info('WorkerManager', `Worker initialized successfully: ${this.workerScriptUrl}`);
      return true;
    } catch (err) {
      logger.warn('WorkerManager', `Failed to initialize worker ${this.workerScriptUrl}, falling back to main thread`, err);
      this.worker = null;
      return false;
    }
  }

  public postMessage<T = unknown>(type: string, payload: T, transferables?: Transferable[]) {
    if (this.worker) {
      const message: WorkerMessage<T> = { type, payload };
      if (transferables && transferables.length > 0) {
        this.worker.postMessage(message, transferables);
      } else {
        this.worker.postMessage(message);
      }
    }
  }

  public on<T = unknown>(type: string, handler: WorkerMessageHandler<T>): () => void {
    if (!this.messageListeners.has(type)) {
      this.messageListeners.set(type, new Set());
    }
    const handlers = this.messageListeners.get(type)!;
    handlers.add(handler as WorkerMessageHandler);

    return () => {
      handlers.delete(handler as WorkerMessageHandler);
    };
  }

  public terminate() {
    if (this.worker) {
      this.worker.terminate();
      this.worker = null;
    }
    this.messageListeners.clear();
  }
}
