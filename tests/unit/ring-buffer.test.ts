import { describe, it, expect } from "vitest";
import { RingBuffer, createRingBuffer } from "../../core/audio/ring-buffer";

describe("RingBuffer", () => {
  describe("createRingBuffer", () => {
    it("should create a ring buffer instance", () => {
      expect(createRingBuffer(10)).toBeInstanceOf(RingBuffer);
    });
  });

  describe("push and pop", () => {
    it("should push and pop items in FIFO order", () => {
      const buffer = createRingBuffer<number>(3);

      buffer.push(1);
      buffer.push(2);
      buffer.push(3);

      expect(buffer.pop()).toBe(1);
      expect(buffer.pop()).toBe(2);
      expect(buffer.pop()).toBe(3);
    });

    it("should return null when popping empty buffer", () => {
      const buffer = createRingBuffer<number>(3);
      expect(buffer.pop()).toBeNull();
    });

    it("should return false when pushing to full buffer", () => {
      const buffer = createRingBuffer<number>(2);

      expect(buffer.push(1)).toBe(true);
      expect(buffer.push(2)).toBe(true);
      expect(buffer.push(3)).toBe(false);
    });
  });

  describe("peek", () => {
    it("should peek without removing", () => {
      const buffer = createRingBuffer<number>(3);

      buffer.push(1);
      buffer.push(2);

      expect(buffer.peek()).toBe(1);
      expect(buffer.size()).toBe(2);
    });

    it("should return null when peeking empty buffer", () => {
      const buffer = createRingBuffer<number>(3);
      expect(buffer.peek()).toBeNull();
    });
  });

  describe("circular behavior", () => {
    it("should wrap around correctly", () => {
      const buffer = createRingBuffer<number>(3);

      buffer.push(1);
      buffer.push(2);
      buffer.push(3);

      // Pop one to make space
      expect(buffer.pop()).toBe(1);

      // Push new item (should wrap around)
      buffer.push(4);

      expect(buffer.pop()).toBe(2);
      expect(buffer.pop()).toBe(3);
      expect(buffer.pop()).toBe(4);
    });
  });

  describe("size and capacity", () => {
    it("should track size correctly", () => {
      const buffer = createRingBuffer<number>(5);

      expect(buffer.size()).toBe(0);
      expect(buffer.getCapacity()).toBe(5);

      buffer.push(1);
      buffer.push(2);

      expect(buffer.size()).toBe(2);

      buffer.pop();
      expect(buffer.size()).toBe(1);
    });

    it("should report isFull correctly", () => {
      const buffer = createRingBuffer<number>(2);

      expect(buffer.isFull()).toBe(false);

      buffer.push(1);
      buffer.push(2);

      expect(buffer.isFull()).toBe(true);
    });

    it("should report isEmpty correctly", () => {
      const buffer = createRingBuffer<number>(2);

      expect(buffer.isEmpty()).toBe(true);

      buffer.push(1);

      expect(buffer.isEmpty()).toBe(false);
    });
  });

  describe("clear", () => {
    it("should clear all items", () => {
      const buffer = createRingBuffer<number>(3);

      buffer.push(1);
      buffer.push(2);
      buffer.push(3);

      buffer.clear();

      expect(buffer.isEmpty()).toBe(true);
      expect(buffer.pop()).toBeNull();
    });
  });

  describe("toArray", () => {
    it("should return items in FIFO order", () => {
      const buffer = createRingBuffer<number>(5);

      buffer.push(1);
      buffer.push(2);
      buffer.push(3);

      expect(buffer.toArray()).toEqual([1, 2, 3]);
    });

    it("should return empty array for empty buffer", () => {
      const buffer = createRingBuffer<number>(5);
      expect(buffer.toArray()).toEqual([]);
    });
  });
});
