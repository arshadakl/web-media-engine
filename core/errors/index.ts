export class AppError extends Error {
  public readonly code: string;
  public readonly recoverable: boolean;

  constructor(message: string, code: string, recoverable: boolean = false) {
    super(message);
    this.name = "AppError";
    this.code = code;
    this.recoverable = recoverable;
  }
}

export class ExtractionError extends AppError {
  constructor(message: string, recoverable: boolean = false) {
    super(message, "EXTRACTION_ERROR", recoverable);
    this.name = "ExtractionError";
  }
}

export class VADError extends AppError {
  constructor(message: string, recoverable: boolean = false) {
    super(message, "VAD_ERROR", recoverable);
    this.name = "VADError";
  }
}

export class ExportError extends AppError {
  constructor(message: string, recoverable: boolean = false) {
    super(message, "EXPORT_ERROR", recoverable);
    this.name = "ExportError";
  }
}

export class ValidationError extends AppError {
  constructor(message: string) {
    super(message, "VALIDATION_ERROR", false);
    this.name = "ValidationError";
  }
}

export function getErrorUIConfig(error: AppError): {
  title: string;
  message: string;
  canRetry: boolean;
} {
  switch (error.code) {
    case "EXTRACTION_ERROR":
      return {
        title: "Extraction Failed",
        message: error.message,
        canRetry: error.recoverable,
      };
    case "VAD_ERROR":
      return {
        title: "Analysis Error",
        message: error.message,
        canRetry: error.recoverable,
      };
    case "EXPORT_ERROR":
      return {
        title: "Export Failed",
        message: error.message,
        canRetry: error.recoverable,
      };
    case "VALIDATION_ERROR":
      return {
        title: "Invalid Input",
        message: error.message,
        canRetry: false,
      };
    default:
      return {
        title: "Error",
        message: error.message,
        canRetry: false,
      };
  }
}
