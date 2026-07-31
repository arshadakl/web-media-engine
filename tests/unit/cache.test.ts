import { describe, it, expect, beforeEach } from "vitest";

// --- In-memory IndexedDB mock ---
class MockIDBObjectStore {
  private data = new Map<string, unknown>();

  put(entry: { key: string }) {
    this.data.set(entry.key, entry);
    const req = {
      result: undefined,
      onsuccess: null as (() => void) | null,
      onerror: null,
    };
    queueMicrotask(() => req.onsuccess?.());
    return req;
  }
  get(key: string) {
    const req = {
      result: this.data.get(key) ?? undefined,
      onsuccess: null as (() => void) | null,
      onerror: null,
    };
    queueMicrotask(() => req.onsuccess?.());
    return req;
  }
  delete(key: string) {
    this.data.delete(key);
    const req = {
      result: undefined,
      onsuccess: null as (() => void) | null,
      onerror: null,
    };
    queueMicrotask(() => req.onsuccess?.());
    return req;
  }
  clear() {
    this.data.clear();
    const req = {
      result: undefined,
      onsuccess: null as (() => void) | null,
      onerror: null,
    };
    queueMicrotask(() => req.onsuccess?.());
    return req;
  }
  count() {
    const req = {
      result: this.data.size,
      onsuccess: null as (() => void) | null,
      onerror: null,
    };
    queueMicrotask(() => req.onsuccess?.());
    return req;
  }
  getAllKeys() {
    const req = {
      result: Array.from(this.data.keys()),
      onsuccess: null as (() => void) | null,
      onerror: null,
    };
    queueMicrotask(() => req.onsuccess?.());
    return req;
  }
}

class MockIDBTransaction {
  private store: MockIDBObjectStore;
  constructor(store: MockIDBObjectStore) {
    this.store = store;
  }
  objectStore() {
    return this.store;
  }
}

class MockIDBDatabase {
  private store: MockIDBObjectStore;
  constructor(store: MockIDBObjectStore) {
    this.store = store;
  }
  transaction() {
    return new MockIDBTransaction(this.store);
  }
  close() {}
}

const sharedStore = new MockIDBObjectStore();

Object.defineProperty(globalThis, "indexedDB", {
  value: {
    open() {
      const req = {
        result: new MockIDBDatabase(sharedStore),
        onsuccess: null as ((e: Event) => void) | null,
        onerror: null,
        error: null,
      };
      queueMicrotask(() => req.onsuccess?.(new Event("success")));
      return req;
    },
  },
  writable: true,
  configurable: true,
});

const { Cache, createCache } = await import("../../core/utils/cache");

describe("Cache", () => {
  beforeEach(() => {
    sharedStore.clear();
  });

  it("should create a cache instance", () => {
    expect(createCache()).toBeInstanceOf(Cache);
  });

  it("should initialize the database", async () => {
    const cache = createCache();
    await cache.initialize();
  });

  it("should store and retrieve a value", async () => {
    const cache = createCache();
    await cache.initialize();
    await cache.store("test-key", { data: "test-value" });
    expect(await cache.retrieve("test-key")).toEqual({ data: "test-value" });
  });

  it("should return null for non-existent key", async () => {
    const cache = createCache();
    await cache.initialize();
    expect(await cache.retrieve("missing")).toBeNull();
  });

  it("should return true for existing key", async () => {
    const cache = createCache();
    await cache.initialize();
    await cache.store("existing", "value");
    expect(await cache.has("existing")).toBe(true);
  });

  it("should return false for non-existent key", async () => {
    const cache = createCache();
    await cache.initialize();
    expect(await cache.has("nope")).toBe(false);
  });

  it("should remove a key", async () => {
    const cache = createCache();
    await cache.initialize();
    await cache.store("to-remove", "value");
    await cache.remove("to-remove");
    expect(await cache.retrieve("to-remove")).toBeNull();
  });

  it("should clear all entries", async () => {
    const cache = createCache();
    await cache.initialize();
    await cache.store("a", 1);
    await cache.store("b", 2);
    await cache.clear();
    expect(await cache.size()).toBe(0);
  });

  it("should return correct size", async () => {
    const cache = createCache();
    await cache.initialize();
    await cache.store("k1", "v1");
    await cache.store("k2", "v2");
    expect(await cache.size()).toBe(2);
  });

  it("should return all keys", async () => {
    const cache = createCache();
    await cache.initialize();
    await cache.store("x", 1);
    await cache.store("y", 2);
    const keys = await cache.keys();
    expect(keys).toContain("x");
    expect(keys).toContain("y");
  });

  it("should invalidate entries when version changes", async () => {
    const c1 = createCache({ cacheVersion: "1.0.0" });
    await c1.initialize();
    await c1.store("vk", "value");

    const c2 = createCache({ cacheVersion: "2.0.0" });
    await c2.initialize();
    expect(await c2.retrieve("vk")).toBeNull();
  });

  it("should close the database", async () => {
    const cache = createCache();
    await cache.initialize();
    cache.close();
  });
});
