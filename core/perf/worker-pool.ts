export interface WorkerPoolConfig {
  minWorkers: number;
  maxWorkers: number;
  taskTimeout: number;
}

export interface WorkerPoolStats {
  totalWorkers: number;
  busyWorkers: number;
  idleWorkers: number;
  queuedTasks: number;
  completedTasks: number;
}

const DEFAULT_CONFIG: WorkerPoolConfig = {
  minWorkers: 1,
  maxWorkers: navigator.hardwareConcurrency || 4,
  taskTimeout: 30000,
};

let config = { ...DEFAULT_CONFIG };
let stats: WorkerPoolStats = {
  totalWorkers: 0,
  busyWorkers: 0,
  idleWorkers: 0,
  queuedTasks: 0,
  completedTasks: 0,
};

export function configureWorkerPool(partial: Partial<WorkerPoolConfig>): void {
  config = { ...config, ...partial };
}

export function getWorkerPoolConfig(): WorkerPoolConfig {
  return { ...config };
}

export function getWorkerPoolStats(): WorkerPoolStats {
  return { ...stats };
}

export function updateWorkerPoolStats(partial: Partial<WorkerPoolStats>): void {
  stats = { ...stats, ...partial };
}

export function getOptimalWorkerCount(): number {
  const cores = navigator.hardwareConcurrency || 4;
  // Leave one core for main thread
  return Math.min(cores - 1, config.maxWorkers);
}

export function shouldSpawnWorker(): boolean {
  return stats.idleWorkers === 0 && stats.totalWorkers < config.maxWorkers;
}

export function shouldTerminateWorker(): boolean {
  return stats.idleWorkers > config.minWorkers && stats.queuedTasks === 0;
}

export function resetWorkerPoolStats(): void {
  stats = {
    totalWorkers: 0,
    busyWorkers: 0,
    idleWorkers: 0,
    queuedTasks: 0,
    completedTasks: 0,
  };
}
