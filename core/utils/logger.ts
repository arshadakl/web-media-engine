export type LogLevel = 'DEBUG' | 'INFO' | 'WARN' | 'ERROR';

export interface LogEntry {
  id: string;
  timestamp: number;
  level: LogLevel;
  module: string;
  message: string;
  details?: unknown;
}

type LogListener = (entry: LogEntry) => void;

class StructuredLogger {
  private logs: LogEntry[] = [];
  private maxLogs = 500;
  private listeners: Set<LogListener> = new Set();
  private isDev = true;

  constructor() {
    this.isDev = typeof process !== 'undefined' && process.env.NODE_ENV !== 'production';
  }

  private log(level: LogLevel, module: string, message: string, details?: unknown) {
    const entry: LogEntry = {
      id: Math.random().toString(36).substring(2, 9),
      timestamp: Date.now(),
      level,
      module,
      message,
      details,
    };

    this.logs.push(entry);
    if (this.logs.length > this.maxLogs) {
      this.logs.shift();
    }

    if (this.isDev) {
      const timeStr = new Date(entry.timestamp).toISOString().split('T')[1]?.slice(0, 8);
      const prefix = `[${timeStr}] [${entry.level}] [${entry.module}]`;
      if (level === 'ERROR') {
        console.error(prefix, message, details ?? '');
      } else if (level === 'WARN') {
        console.warn(prefix, message, details ?? '');
      } else if (level === 'INFO') {
        console.info(prefix, message, details ?? '');
      } else {
        console.debug(prefix, message, details ?? '');
      }
    }

    this.listeners.forEach((listener) => listener(entry));
  }

  debug(module: string, message: string, details?: unknown) {
    this.log('DEBUG', module, message, details);
  }

  info(module: string, message: string, details?: unknown) {
    this.log('INFO', module, message, details);
  }

  warn(module: string, message: string, details?: unknown) {
    this.log('WARN', module, message, details);
  }

  error(module: string, message: string, details?: unknown) {
    this.log('ERROR', module, message, details);
  }

  getLogs(): LogEntry[] {
    return [...this.logs];
  }

  clear() {
    this.logs = [];
  }

  subscribe(listener: LogListener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }
}

export const logger = new StructuredLogger();
