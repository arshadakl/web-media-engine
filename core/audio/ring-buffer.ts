/**
 * Ring buffer for streaming PCM data processing.
 * Uses a circular array for efficient FIFO operations.
 */

/**
 * Ring buffer for streaming data processing.
 */
export class RingBuffer<T> {
  private buffer: (T | null)[];
  private head = 0;
  private tail = 0;
  private count = 0;
  private readonly capacity: number;

  constructor(capacity: number) {
    this.capacity = capacity;
    this.buffer = new Array(capacity).fill(null);
  }

  /**
   * Push an item into the buffer.
   * @param item - Item to push
   * @returns True if successful, false if buffer is full
   */
  push(item: T): boolean {
    if (this.isFull()) {
      return false;
    }

    this.buffer[this.tail] = item;
    this.tail = (this.tail + 1) % this.capacity;
    this.count++;
    return true;
  }

  /**
   * Pop an item from the buffer.
   * @returns The item, or null if buffer is empty
   */
  pop(): T | null {
    if (this.isEmpty()) {
      return null;
    }

    const item = this.buffer[this.head];
    this.buffer[this.head] = null;
    this.head = (this.head + 1) % this.capacity;
    this.count--;
    return item;
  }

  /**
   * Peek at the next item without removing it.
   * @returns The item, or null if buffer is empty
   */
  peek(): T | null {
    if (this.isEmpty()) {
      return null;
    }
    return this.buffer[this.head];
  }

  /**
   * Check if the buffer is full.
   * @returns True if buffer is full
   */
  isFull(): boolean {
    return this.count === this.capacity;
  }

  /**
   * Check if the buffer is empty.
   * @returns True if buffer is empty
   */
  isEmpty(): boolean {
    return this.count === 0;
  }

  /**
   * Get the number of items in the buffer.
   * @returns Number of items
   */
  size(): number {
    return this.count;
  }

  /**
   * Get the capacity of the buffer.
   * @returns Buffer capacity
   */
  getCapacity(): number {
    return this.capacity;
  }

  /**
   * Clear all items from the buffer.
   */
  clear(): void {
    this.buffer.fill(null);
    this.head = 0;
    this.tail = 0;
    this.count = 0;
  }

  /**
   * Get all items in the buffer (FIFO order).
   * @returns Array of items
   */
  toArray(): T[] {
    const items: T[] = [];
    let index = this.head;

    for (let i = 0; i < this.count; i++) {
      items.push(this.buffer[index] as T);
      index = (index + 1) % this.capacity;
    }

    return items;
  }
}

/**
 * Create a ring buffer instance.
 * @param capacity - Buffer capacity
 * @returns RingBuffer instance
 */
export function createRingBuffer<T>(capacity: number): RingBuffer<T> {
  return new RingBuffer<T>(capacity);
}
