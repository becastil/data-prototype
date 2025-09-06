'use client';

// HIPAA-aligned client-side storage helper
// - Never stores PHI directly in localStorage
// - Only stores an opaque session token reference on disk
// - Data lives in-memory and auto-expires

// Development-only logging utility
const isDev = process.env.NODE_ENV === 'development';
const devLog = (...args: any[]) => isDev && console.log(...args);
const devWarn = (...args: any[]) => isDev && console.warn(...args);

type CacheEntry<T = unknown> = {
  data: T;
  expiresAt: number | null;
};

function isBrowser() {
  return typeof window !== 'undefined';
}

function now() {
  return Date.now();
}

function base64Url(bytes: Uint8Array) {
  // Convert to base64url string
  let str = '';
  for (let i = 0; i < bytes.length; i++) str += String.fromCharCode(bytes[i]);
  return btoa(str).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

async function generateSecureToken(byteLength = 32): Promise<string> {
  if (isBrowser() && window.crypto?.getRandomValues) {
    const buf = new Uint8Array(byteLength);
    window.crypto.getRandomValues(buf);
    return base64Url(buf);
  }
  // Fallback (non-crypto): not expected on client, but provide a minimal fallback
  const buf = new Uint8Array(byteLength);
  for (let i = 0; i < byteLength; i++) buf[i] = Math.floor(Math.random() * 256);
  return base64Url(buf);
}

export class SecureHealthcareStorage {
  private memoryCache = new Map<string, CacheEntry>();
  private timeouts = new Map<string, ReturnType<typeof setTimeout>>();
  private namespace = 'schs:'; // secure healthcare storage
  private maxCacheSize = 100; // Prevent unlimited memory growth
  private cleanupInterval: ReturnType<typeof setInterval> | null = null;
  private isInitialized = false;

  private storageKey(key: string) {
    return `${this.namespace}${key}`;
  }

  private initCleanup() {
    if (this.isInitialized || !isBrowser()) return;
    this.isInitialized = true;
    
    // Cleanup expired entries every 5 minutes
    this.cleanupInterval = setInterval(() => {
      this.cleanupExpired();
    }, 5 * 60 * 1000);
    
    // Cleanup on page unload
    const handleUnload = () => this.destroy();
    window.addEventListener('beforeunload', handleUnload);
    window.addEventListener('unload', handleUnload);
    
    // Store cleanup reference
    (window as any).__secureHealthcareCleanup = handleUnload;
  }
  
  private cleanupExpired() {
    if (!isBrowser()) return;
    const nowTs = now();
    const expiredTokens: string[] = [];
    
    for (const [token, entry] of this.memoryCache.entries()) {
      if (entry.expiresAt && nowTs > entry.expiresAt) {
        expiredTokens.push(token);
      }
    }
    
    expiredTokens.forEach(token => {
      this.memoryCache.delete(token);
    });
    
    // Enforce cache size limit
    if (this.memoryCache.size > this.maxCacheSize) {
      const excess = this.memoryCache.size - this.maxCacheSize;
      const tokens = Array.from(this.memoryCache.keys()).slice(0, excess);
      tokens.forEach(token => this.memoryCache.delete(token));
    }
  }

  /**
   * Stores data in-memory only, writing an opaque token reference to localStorage.
   * The token itself contains no PHI.
   * @returns the generated session token
   */
  async storeTemporary<T = unknown>(key: string, data: T, opts?: { ttlMs?: number }): Promise<string | null> {
    if (!isBrowser()) return null;
    this.initCleanup(); // Ensure cleanup is initialized
    const ttlMs = opts?.ttlMs ?? 60 * 60 * 1000; // default 1 hour
    const token = await generateSecureToken();

    // In-memory cache (contains PHI)
    const expiresAt = ttlMs > 0 ? now() + ttlMs : null;
    this.memoryCache.set(token, { data, expiresAt });

    // Persist only the token reference and expiry metadata on disk
    try {
      devLog('[SecureHealthcareStorage] storeTemporary key:', key, 'ttlMs:', ttlMs);
      const storageVal = JSON.stringify({ token, expiresAt });
      window.localStorage.setItem(this.storageKey(key), storageVal);
    } catch {
      // If disk write fails, still operate in-memory
    }

    // Auto-expire from memory and disk
    if (ttlMs > 0) {
      // Clear any existing timeout for this key
      const existingTimeout = this.timeouts.get(key);
      if (existingTimeout) {
        clearTimeout(existingTimeout);
      }
      
      const timeout = setTimeout(() => {
        this.clear(key);
      }, ttlMs);
      this.timeouts.set(key, timeout);
    }

    return token;
  }

  /**
   * Retrieves data from in-memory cache using the stored token reference.
   * If memory was cleared (e.g., page reload), returns undefined and clears the stale token.
   */
  retrieve<T = unknown>(key: string): T | undefined {
    if (!isBrowser()) return undefined;
    try {
      devLog('[SecureHealthcareStorage] retrieve key:', key);
      const refRaw = window.localStorage.getItem(this.storageKey(key));
      if (!refRaw) return undefined;
      const { token, expiresAt } = JSON.parse(refRaw) as { token: string; expiresAt: number | null };

      if (expiresAt && now() > expiresAt) {
        devWarn('[SecureHealthcareStorage] token expired for key:', key);
        this.clear(key);
        return undefined;
      }

      const entry = this.memoryCache.get(token);
      if (!entry) {
        // Token exists but memory is gone (reload/new tab). Remove stale token.
        devWarn('[SecureHealthcareStorage] token found but memory entry missing (stale). Clearing key:', key);
        this.safeRemoveKey(key);
        return undefined;
      }

      if (entry.expiresAt && now() > entry.expiresAt) {
        devWarn('[SecureHealthcareStorage] memory entry expired for key:', key);
        this.clear(key);
        return undefined;
      }

      return entry.data as T;
    } catch {
      return undefined;
    }
  }

  /**
   * Clears both memory and the on-disk token reference for a key.
   */
  clear(key: string) {
    if (!isBrowser()) return;
    try {
      devLog('[SecureHealthcareStorage] clear key:', key);
      const refRaw = window.localStorage.getItem(this.storageKey(key));
      if (refRaw) {
        const { token } = JSON.parse(refRaw) as { token: string };
        this.memoryCache.delete(token);
      }
    } catch {}
    this.safeRemoveKey(key);

    // Always cleanup timeout, even if localStorage operations fail
    const t = this.timeouts.get(key);
    if (t) {
      clearTimeout(t);
      this.timeouts.delete(key);
    }
  }

  clearAll() {
    if (!isBrowser()) return;
    devLog('[SecureHealthcareStorage] clearAll keys under namespace');
    // Remove all keys under this namespace
    try {
      const keysToRemove: string[] = [];
      for (let i = 0; i < window.localStorage.length; i++) {
        const k = window.localStorage.key(i);
        if (k && k.startsWith(this.namespace)) keysToRemove.push(k);
      }
      for (const k of keysToRemove) window.localStorage.removeItem(k);
    } catch {}

    // Clear memory and timeouts
    this.memoryCache.clear();
    this.timeouts.forEach((t) => clearTimeout(t));
    this.timeouts.clear();
  }
  
  destroy() {
    if (!isBrowser()) return;
    devLog('[SecureHealthcareStorage] destroying instance');
    
    // Clear all data
    this.clearAll();
    
    // Clear cleanup interval
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
    
    // Remove event listeners
    try {
      const cleanup = (window as any).__secureHealthcareCleanup;
      if (cleanup) {
        window.removeEventListener('beforeunload', cleanup);
        window.removeEventListener('unload', cleanup);
        delete (window as any).__secureHealthcareCleanup;
      }
    } catch {}
    
    this.isInitialized = false;
  }

  private safeRemoveKey(key: string) {
    try {
      window.localStorage.removeItem(this.storageKey(key));
    } catch {}
  }
}

// Export a singleton instance for app-wide use
export const secureHealthcareStorage = new SecureHealthcareStorage();
