import { describe, it, expect } from "vitest";
import {
  AppError,
  ExtractionError,
  VADError,
  ExportError,
  ValidationError,
  getErrorUIConfig,
} from "../../core/errors";

describe("Error Classes", () => {
  it("should create AppError with correct properties", () => {
    const error = new AppError("test message", "TEST_CODE", true);
    expect(error.message).toBe("test message");
    expect(error.code).toBe("TEST_CODE");
    expect(error.recoverable).toBe(true);
    expect(error.name).toBe("AppError");
  });

  it("should create ExtractionError", () => {
    const error = new ExtractionError("extraction failed", true);
    expect(error.code).toBe("EXTRACTION_ERROR");
    expect(error.recoverable).toBe(true);
    expect(error.name).toBe("ExtractionError");
  });

  it("should create VADError", () => {
    const error = new VADError("vad failed");
    expect(error.code).toBe("VAD_ERROR");
    expect(error.recoverable).toBe(false);
  });

  it("should create ExportError", () => {
    const error = new ExportError("export failed", true);
    expect(error.code).toBe("EXPORT_ERROR");
    expect(error.recoverable).toBe(true);
  });

  it("should create ValidationError", () => {
    const error = new ValidationError("invalid input");
    expect(error.code).toBe("VALIDATION_ERROR");
    expect(error.recoverable).toBe(false);
  });
});

describe("getErrorUIConfig", () => {
  it("should return correct config for ExtractionError", () => {
    const error = new ExtractionError("file not found", true);
    const config = getErrorUIConfig(error);
    expect(config.title).toBe("Extraction Failed");
    expect(config.canRetry).toBe(true);
  });

  it("should return correct config for VADError", () => {
    const error = new VADError("model load failed");
    const config = getErrorUIConfig(error);
    expect(config.title).toBe("Analysis Error");
    expect(config.canRetry).toBe(false);
  });

  it("should return correct config for ExportError", () => {
    const error = new ExportError("export cancelled", true);
    const config = getErrorUIConfig(error);
    expect(config.title).toBe("Export Failed");
    expect(config.canRetry).toBe(true);
  });

  it("should return default config for unknown error", () => {
    const error = new AppError("unknown", "UNKNOWN");
    const config = getErrorUIConfig(error);
    expect(config.title).toBe("Error");
    expect(config.canRetry).toBe(false);
  });
});
