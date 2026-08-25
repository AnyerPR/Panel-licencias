import { CacheConfig } from '../types/sdkTypes';

interface CacheEntry<T> {
  data: T;
  expiry: number;
}

export class SdkCache {
  private memoryCache = new Map<string, CacheEntry<any>>();
  private config: CacheConfig;

  constructor(config: CacheConfig = {}) {
    this.config = {
      enabled: config.enabled ?? true,
      ttlMs: config.ttlMs || 5 * 60 * 1000, // 5 minutos por defecto
      storageType: config.storageType || 'memory',
    };
  }

  public updateConfig(config: Partial<CacheConfig>): void {
    this.config = { ...this.config, ...config };
  }

  public get<T>(key: string): T | null {
    if (!this.config.enabled) return null;

    const now = Date.now();

    // 1. Intentar memoria
    if (this.memoryCache.has(key)) {
      const entry = this.memoryCache.get(key)!;
      if (now < entry.expiry) {
        return entry.data as T;
      }
      this.memoryCache.delete(key);
    }

    // 2. Intentar localStorage si está habilitado
    if (this.config.storageType === 'localStorage' && typeof window !== 'undefined' && window.localStorage) {
      try {
        const itemStr = localStorage.getItem(`sdk_license_cache_${key}`);
        if (itemStr) {
          const entry: CacheEntry<T> = JSON.parse(itemStr);
          if (now < entry.expiry) {
            // Sincronizar en memoria
            this.memoryCache.set(key, entry);
            return entry.data;
          }
          localStorage.removeItem(`sdk_license_cache_${key}`);
        }
      } catch {
        // Ignorar fallos de acceso a localStorage
      }
    }

    return null;
  }

  public set<T>(key: string, data: T, ttlMsOverride?: number): void {
    if (!this.config.enabled) return;

    const ttl = ttlMsOverride || this.config.ttlMs || 300000;
    const expiry = Date.now() + ttl;
    const entry: CacheEntry<T> = { data, expiry };

    this.memoryCache.set(key, entry);

    if (this.config.storageType === 'localStorage' && typeof window !== 'undefined' && window.localStorage) {
      try {
        localStorage.setItem(`sdk_license_cache_${key}`, JSON.stringify(entry));
      } catch {
        // Silencioso en caso de quota reducida
      }
    }
  }

  public remove(key: string): void {
    this.memoryCache.delete(key);
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        localStorage.removeItem(`sdk_license_cache_${key}`);
      } catch {
        // Ignorar
      }
    }
  }

  public clear(): void {
    this.memoryCache.clear();
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        const keysToRemove: string[] = [];
        for (let i = 0; i < localStorage.length; i++) {
          const k = localStorage.key(i);
          if (k && k.startsWith('sdk_license_cache_')) {
            keysToRemove.push(k);
          }
        }
        keysToRemove.forEach((k) => localStorage.removeItem(k));
      } catch {
        // Ignorar
      }
    }
  }
}
