import { describe, it, expect } from "vitest";
import {
  createMessageId,
  createVADProcessMessage,
  createExportStartMessage,
  createExportCancelMessage,
  createVADInitMessage,
  createVADResetMessage,
  createExportInitMessage,
} from "../../app/workers/message-contracts";

describe("Worker Message Contracts", () => {
  describe("createMessageId", () => {
    it("should return incrementing IDs", () => {
      const id1 = createMessageId();
      const id2 = createMessageId();
      expect(id2).toBeGreaterThan(id1);
    });
  });

  describe("VAD Messages", () => {
    it("should create VAD init message", () => {
      const msg = createVADInitMessage();
      expect(msg.type).toBe("init");
      expect(msg.id).toBeGreaterThan(0);
    });

    it("should create VAD process message", () => {
      const pcmData = new Float32Array(512);
      const msg = createVADProcessMessage(pcmData, 16000);
      expect(msg.type).toBe("process-chunk");
      expect(msg.payload?.sampleRate).toBe(16000);
      expect(msg.id).toBeGreaterThan(0);
    });

    it("should create VAD reset message", () => {
      const msg = createVADResetMessage();
      expect(msg.type).toBe("reset");
    });
  });

  describe("Export Messages", () => {
    it("should create export init message", () => {
      const msg = createExportInitMessage();
      expect(msg.type).toBe("init");
    });

    it("should create export start message", () => {
      const file = new File(["test"], "test.mp4");
      const msg = createExportStartMessage({}, file);
      expect(msg.type).toBe("start-export");
      expect(msg.payload?.file).toBe(file);
    });

    it("should create export cancel message", () => {
      const msg = createExportCancelMessage();
      expect(msg.type).toBe("cancel-export");
    });
  });
});
