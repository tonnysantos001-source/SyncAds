// =========================================================================
// MÓDULO DE INTEGRAÇÕES GLOBAL - CACHE EM MEMÓRIA COM TTL (Deno)
// =========================================================================

import { CacheInterface } from "../types.ts";

interface CacheEntry<T> {
  value: T;
  expiresAt: number;
}

export class Cache implements CacheInterface {
  private store: Map<string, CacheEntry<any>>;

  constructor() {
    this.store = new Map<string, CacheEntry<any>>();
  }

  /**
   * Obtém valor do cache se não expirado
   */
  async get<T>(key: string): Promise<T | null> {
    const entry = this.store.get(key);
    
    if (!entry) {
      return null;
    }

    if (Date.now() > entry.expiresAt) {
      this.store.delete(key);
      return null;
    }

    return entry.value as T;
  }

  /**
   * Grava valor no cache com TTL em segundos (padrão 300 segundos = 5 minutos)
   */
  async set<T>(key: string, value: T, ttlSeconds: number = 300): Promise<void> {
    const expiresAt = Date.now() + ttlSeconds * 1000;
    this.store.set(key, { value, expiresAt });
  }

  /**
   * Remove chave do cache
   */
  async delete(key: string): Promise<void> {
    this.store.delete(key);
  }

  /**
   * Limpa todas as entradas expiradas (Garbage Collector manual se necessário)
   */
  prune(): void {
    const now = Date.now();
    for (const [key, entry] of this.store.entries()) {
      if (now > entry.expiresAt) {
        this.store.delete(key);
      }
    }
  }
}
