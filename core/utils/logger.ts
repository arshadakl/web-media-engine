/**
 * Logger module for core/ utilities.
 * Development: colored console output with timestamp.
 * Production: in-memory buffer for debug panel.
 */

export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
}

const LOG_LEVEL_NAMES: Record<LogLevel, string> = {
  [LogLevel.DEBUG]: "DEBUG",
  [LogLevel.INFO]: "INFO",
  [LogLevel.WARN]: "WARN",
  [LogLevel.ERROR]: "ERROR",
};

const LOG_LEVEL_COLORS: Record<LogLevel, string> = {
  [LogLevel.DEBUG]: "\x1b[36m", // Cyan
  [LogLevel.INFO]: "\x1b[32m", // Green
  [LogLevel.WARN]: "\x1b[33m", // Yellow
  [LogLevel.ERROR]: "\x1b[31m", // Red
};

const RESET_COLOR = "\x1b[0m";

export interface LogEntry {
  timestamp: Date;
  level: LogLevel;
  module: string;
  message: string;
  data?: unknown;
}

export interface LoggerOptions {
  minLevel?: LogLevel;
  production?: boolean;
  maxBufferSize?: number;
}

/**
 * Structured logger with level filtering and production buffering.
 */
export class Logger {
  private readonly module: string;
  private readonly minLevel: LogLevel;
  private readonly production: boolean;
  private readonly buffer: LogEntry[] = [];
  private readonly maxBufferSize: number;

  constructor(module: string, options: LoggerOptions = {}) {
    this.module = module;
    this.minLevel = options.minLevel ?? LogLevel.DEBUG;
    this.production = options.production ?? false;
    this.maxBufferSize = options.maxBufferSize ?? 1000;
  }

  /**
   * Log a debug message.
   * @param message - The log message
   * @param data - Optional additional data
   */
  debug(message: string, data?: unknown): void {
    this.log(LogLevel.DEBUG, message, data);
  }

  /**
   * Log an info message.
   * @param message - The log message
   * @param data - Optional additional data
   */
  info(message: string, data?: unknown): void {
    this.log(LogLevel.INFO, message, data);
  }

  /**
   * Log a warning message.
   * @param message - The log message
   * @param data - Optional additional data
   */
  warn(message: string, data?: unknown): void {
    this.log(LogLevel.WARN, message, data);
  }

  /**
   * Log an error message.
   * @param message - The log message
   * @param data - Optional additional data
   */
  error(message: string, data?: unknown): void {
    this.log(LogLevel.ERROR, message, data);
  }

  /**
   * Get all buffered log entries (production mode).
   * @returns Array of log entries
   */
  getBuffer(): readonly LogEntry[] {
    return this.buffer;
  }

  /**
   * Clear the log buffer.
   */
  clearBuffer(): void {
    this.buffer.length = 0;
  }

  /**
   * Get the number of buffered entries.
   * @returns Buffer size
   */
  getBufferSize(): number {
    return this.buffer.length;
  }

  private log(level: LogLevel, message: string, data?: unknown): void {
    if (level < this.minLevel) {
      return;
    }

    const entry: LogEntry = {
      timestamp: new Date(),
      level,
      module: this.module,
      message,
      data,
    };

    if (this.production) {
      this.buffer.push(entry);
      if (this.buffer.length > this.maxBufferSize) {
        this.buffer.shift();
      }
    } else {
      this.outputToConsole(entry);
    }
  }

  private outputToConsole(entry: LogEntry): void {
    const timestamp = entry.timestamp.toISOString();
    const levelName = LOG_LEVEL_NAMES[entry.level];
    const color = LOG_LEVEL_COLORS[entry.level];
    const prefix = `${color}[${timestamp}] ${levelName} [${entry.module}]${RESET_COLOR}`;

    if (entry.data !== undefined) {
      console.log(`${prefix} ${entry.message}`, entry.data);
    } else {
      console.log(`${prefix} ${entry.message}`);
    }
  }
}

/**
 * Create a logger instance for a module.
 * @param module - Module name for log prefix
 * @param options - Logger configuration options
 * @returns Logger instance
 */
export function createLogger(module: string, options?: LoggerOptions): Logger {
  return new Logger(module, options);
}
