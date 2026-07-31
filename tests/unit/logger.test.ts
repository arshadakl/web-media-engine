import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { Logger, LogLevel, createLogger } from "../../core/utils/logger";

describe("Logger", () => {
  beforeEach(() => {
    vi.spyOn(console, "log").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("createLogger", () => {
    it("should create a logger instance", () => {
      const logger = createLogger("test");
      expect(logger).toBeInstanceOf(Logger);
    });
  });

  describe("log levels", () => {
    it("should log debug messages when level is DEBUG", () => {
      const logger = createLogger("test", { minLevel: LogLevel.DEBUG });
      logger.debug("debug message");
      expect(console.log).toHaveBeenCalled();
    });

    it("should filter debug messages when level is INFO", () => {
      const logger = createLogger("test", { minLevel: LogLevel.INFO });
      logger.debug("debug message");
      expect(console.log).not.toHaveBeenCalled();
    });

    it("should log info messages", () => {
      const logger = createLogger("test", { minLevel: LogLevel.DEBUG });
      logger.info("info message");
      expect(console.log).toHaveBeenCalled();
    });

    it("should log warning messages", () => {
      const logger = createLogger("test", { minLevel: LogLevel.DEBUG });
      logger.warn("warn message");
      expect(console.log).toHaveBeenCalled();
    });

    it("should log error messages", () => {
      const logger = createLogger("test", { minLevel: LogLevel.DEBUG });
      logger.error("error message");
      expect(console.log).toHaveBeenCalled();
    });
  });

  describe("production mode", () => {
    it("should buffer messages instead of console output", () => {
      const logger = createLogger("test", { production: true });
      logger.info("message 1");
      logger.warn("message 2");

      expect(console.log).not.toHaveBeenCalled();
      expect(logger.getBuffer()).toHaveLength(2);
    });

    it("should include module name in buffer", () => {
      const logger = createLogger("my-module", { production: true });
      logger.info("test message");

      const buffer = logger.getBuffer();
      expect(buffer[0].module).toBe("my-module");
    });

    it("should respect max buffer size", () => {
      const logger = createLogger("test", {
        production: true,
        maxBufferSize: 3,
      });
      logger.info("1");
      logger.info("2");
      logger.info("3");
      logger.info("4");

      expect(logger.getBuffer()).toHaveLength(3);
      expect(logger.getBuffer()[0].message).toBe("2");
    });

    it("should clear buffer", () => {
      const logger = createLogger("test", { production: true });
      logger.info("message");
      logger.clearBuffer();
      expect(logger.getBuffer()).toHaveLength(0);
    });

    it("should return buffer size", () => {
      const logger = createLogger("test", { production: true });
      logger.info("1");
      logger.info("2");
      expect(logger.getBufferSize()).toBe(2);
    });
  });

  describe("log entries", () => {
    it("should include timestamp", () => {
      const logger = createLogger("test", { production: true });
      logger.info("message");

      const entry = logger.getBuffer()[0];
      expect(entry.timestamp).toBeInstanceOf(Date);
    });

    it("should include level", () => {
      const logger = createLogger("test", { production: true });
      logger.warn("message");

      const entry = logger.getBuffer()[0];
      expect(entry.level).toBe(LogLevel.WARN);
    });

    it("should include optional data", () => {
      const logger = createLogger("test", { production: true });
      const data = { key: "value" };
      logger.info("message", data);

      const entry = logger.getBuffer()[0];
      expect(entry.data).toEqual(data);
    });
  });
});
