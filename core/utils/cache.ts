/**
 * IndexedDB cache layer for WASM binaries and models.
 * Supports versioned keys for cache invalidation.
 */

const DB_NAME = "web-media-engine-cache";
const DB_VERSION = 1;
const STORE_NAME = "cache-store";

export interface CacheEntry<T = unknown> {
  key: string;
  data: T;
  version: string;
  timestamp: number;
}

export interface CacheOptions {
  /** Database version for schema changes */
  dbVersion?: number;
  /** Cache version for key invalidation */
  cacheVersion?: string;
}

/**
 * IndexedDB-based cache with versioned keys.
 */
export class Cache {
  private readonly dbVersion: number;
  private readonly cacheVersion: string;
  private db: IDBDatabase | null = null;

  constructor(options: CacheOptions = {}) {
    this.dbVersion = options.dbVersion ?? DB_VERSION;
    this.cacheVersion = options.cacheVersion ?? "1.0.0";
  }

  /**
   * Initialize the cache database.
   */
  async initialize(): Promise<void> {
    if (this.db) {
      return;
    }

    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, this.dbVersion);

      request.onerror = () => {
        reject(new Error(`Failed to open database: ${request.error?.message}`));
      };

      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME, { keyPath: "key" });
        }
      };
    });
  }

  /**
   * Store a value in the cache.
   * @param key - Cache key
   * @param data - Data to store
   */
  async store<T>(key: string, data: T): Promise<void> {
    await this.ensureInitialized();

    const entry: CacheEntry<T> = {
      key: this.getVersionedKey(key),
      data,
      version: this.cacheVersion,
      timestamp: Date.now(),
    };

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(STORE_NAME, "readwrite");
      const store = transaction.objectStore(STORE_NAME);
      const request = store.put(entry);

      request.onsuccess = () => resolve();
      request.onerror = () =>
        reject(new Error(`Failed to store: ${request.error?.message}`));
    });
  }

  /**
   * Retrieve a value from the cache.
   * @param key - Cache key
   * @returns Cached data or null if not found
   */
  async retrieve<T>(key: string): Promise<T | null> {
    await this.ensureInitialized();

    const versionedKey = this.getVersionedKey(key);

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(STORE_NAME, "readonly");
      const store = transaction.objectStore(STORE_NAME);
      const request = store.get(versionedKey);

      request.onsuccess = () => {
        const result = request.result as CacheEntry<T> | undefined;
        if (result && result.version === this.cacheVersion) {
          resolve(result.data);
        } else {
          resolve(null);
        }
      };

      request.onerror = () =>
        reject(new Error(`Failed to retrieve: ${request.error?.message}`));
    });
  }

  /**
   * Check if a key exists in the cache.
   * @param key - Cache key
   * @returns True if key exists and version matches
   */
  async has(key: string): Promise<boolean> {
    const data = await this.retrieve(key);
    return data !== null;
  }

  /**
   * Remove a key from the cache.
   * @param key - Cache key
   */
  async remove(key: string): Promise<void> {
    await this.ensureInitialized();

    const versionedKey = this.getVersionedKey(key);

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(STORE_NAME, "readwrite");
      const store = transaction.objectStore(STORE_NAME);
      const request = store.delete(versionedKey);

      request.onsuccess = () => resolve();
      request.onerror = () =>
        reject(new Error(`Failed to remove: ${request.error?.message}`));
    });
  }

  /**
   * Clear all cache entries.
   */
  async clear(): Promise<void> {
    await this.ensureInitialized();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(STORE_NAME, "readwrite");
      const store = transaction.objectStore(STORE_NAME);
      const request = store.clear();

      request.onsuccess = () => resolve();
      request.onerror = () =>
        reject(new Error(`Failed to clear: ${request.error?.message}`));
    });
  }

  /**
   * Get the number of entries in the cache.
   * @returns Number of cached entries
   */
  async size(): Promise<number> {
    await this.ensureInitialized();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(STORE_NAME, "readonly");
      const store = transaction.objectStore(STORE_NAME);
      const request = store.count();

      request.onsuccess = () => resolve(request.result);
      request.onerror = () =>
        reject(new Error(`Failed to count: ${request.error?.message}`));
    });
  }

  /**
   * Get all keys in the cache.
   * @returns Array of cache keys (without version prefix)
   */
  async keys(): Promise<string[]> {
    await this.ensureInitialized();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(STORE_NAME, "readonly");
      const store = transaction.objectStore(STORE_NAME);
      const request = store.getAllKeys();

      request.onsuccess = () => {
        const keys = request.result as string[];
        const prefix = `${this.cacheVersion}:`;
        resolve(keys.map((k) => k.replace(prefix, "")));
      };

      request.onerror = () =>
        reject(new Error(`Failed to get keys: ${request.error?.message}`));
    });
  }

  /**
   * Close the database connection.
   */
  close(): void {
    if (this.db) {
      this.db.close();
      this.db = null;
    }
  }

  private getVersionedKey(key: string): string {
    return `${this.cacheVersion}:${key}`;
  }

  private async ensureInitialized(): Promise<void> {
    if (!this.db) {
      await this.initialize();
    }
  }
}

/**
 * Create a cache instance.
 * @param options - Cache configuration options
 * @returns Cache instance
 */
export function createCache(options?: CacheOptions): Cache {
  return new Cache(options);
}
