/**
 * CACHE SYSTEM - Sistema de cache inteligente para módulos AI
 * Features: LRU cache, TTL, compression, stats
 */
import { EventEmitter } from 'events';

export interface CacheConfig {
  maxSize?: number;
  defaultTtl?: number;
  enableCompression?: boolean;
  enableStats?: boolean;
}

export interface CacheEntry<T> {
  key: string;
  value: T;
  timestamp: number;
  ttl: number;
  hits: number;
  size: number;
}

export class CacheSystem<T = any> extends EventEmitter {
  private cache: Map<string, CacheEntry<T>>;
  private config: Required<CacheConfig>;
  private stats = { hits: 0, misses: 0, evictions: 0, size: 0 };

  constructor(config: Partial<CacheConfig> = {}) {
    super();
    this.config = {
      maxSize: config.maxSize || 1000,
      defaultTtl: config.defaultTtl || 3600000,
      enableCompression: config.enableCompression ?? false,
      enableStats: config.enableStats ?? true,
    };
    this.cache = new Map();
  }

  public set(key: string, value: T, ttl?: number): void {
    if (this.cache.size >= this.config.maxSize) {
      this.evictLRU();
    }

    const entry: CacheEntry<T> = {
      key,
      value,
      timestamp: Date.now(),
      ttl: ttl || this.config.defaultTtl,
      hits: 0,
      size: this.estimateSize(value),
    };

    this.cache.set(key, entry);
    this.stats.size += entry.size;
    this.emit('cache:set', { key, size: entry.size });
  }

  public get(key: string): T | null {
    const entry = this.cache.get(key);

    if (!entry) {
      this.stats.misses++;
      this.emit('cache:miss', { key });
      return null;
    }

    if (Date.now() - entry.timestamp > entry.ttl) {
      this.delete(key);
      this.stats.misses++;
      return null;
    }

    entry.hits++;
    this.stats.hits++;
    this.emit('cache:hit', { key, hits: entry.hits });
    return entry.value;
  }

  public has(key: string): boolean {
    return this.get(key) !== null;
  }

  public delete(key: string): void {
    const entry = this.cache.get(key);
    if (entry) {
      this.stats.size -= entry.size;
      this.cache.delete(key);
      this.emit('cache:delete', { key });
    }
  }

  public clear(): void {
    this.cache.clear();
    this.stats = { hits: 0, misses: 0, evictions: 0, size: 0 };
    this.emit('cache:clear');
  }

  private evictLRU(): void {
    let oldestKey: string | null = null;
    let oldestTime = Infinity;

    for (const [key, entry] of this.cache.entries()) {
      const lastAccess = entry.timestamp + entry.hits * 1000;
      if (lastAccess < oldestTime) {
        oldestTime = lastAccess;
        oldestKey = key;
      }
    }

    if (oldestKey) {
      this.delete(oldestKey);
      this.stats.evictions++;
      this.emit('cache:eviction', { key: oldestKey });
    }
  }

  private estimateSize(value: T): number {
    return JSON.stringify(value).length;
  }

  public getStats() {
    return {
      ...this.stats,
      entries: this.cache.size,
      hitRate: this.stats.hits / (this.stats.hits + this.stats.misses) || 0,
    };
  }
}

export default CacheSystem;
