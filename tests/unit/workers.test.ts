import { describe, it, expect } from "vitest";
import {
  createMessageId,
  createVADMessage,
  createExportStartMessage,
  createExportCancelMessage,
} from "../../app/workers/message-contracts";

describe("Worker Message Contracts", () => {
  describe("createMessageId", () => {
    it("should return incrementing IDs", () => {
      const id1 = createMessageId();
      const id2 = createMessageId();
      expect(id2).toBeGreaterThan(id1);
    });
  });

  describe("createVADMessage", () => {
    it("should create VAD message", () => {
      const pcmData = new Float32Array(512);
      const msg = createVADMessage(pcmData, 16000);
      expect(msg.type).toBe("process-chunk");
      expect(msg.payload?.sampleRate).toBe(16000);
      expect(msg.id).toBeGreaterThan(0);
    });
  });

  describe("createExportStartMessage", () => {
    it("should create export start message", () => {
      const file = new File(["test"], "test.mp4");
      const msg = createExportStartMessage({}, file);
      expect(msg.type).toBe("start-export");
      expect(msg.payload?.file).toBe(file);
    });
  });

  describe("createExportCancelMessage", () => {
    it("should create export cancel message", () => {
      const msg = createExportCancelMessage();
      expect(msg.type).toBe("cancel-export");
    });
  });
});
