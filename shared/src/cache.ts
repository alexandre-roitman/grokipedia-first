import {
  EXISTENCE_CACHE_MAX_SIZE,
  EXISTENCE_CACHE_TTL_MS,
} from "./defaults.js";
import type { ExistenceCacheEntry, ExistenceResult } from "./types.js";

export class ExistenceCache {
  private entries = new Map<string, ExistenceCacheEntry>();

  get(url: string): ExistenceResult | null {
    const entry = this.entries.get(url);
    if (!entry) return null;

    if (Date.now() - entry.timestamp > EXISTENCE_CACHE_TTL_MS) {
      this.entries.delete(url);
      return null;
    }

    return entry.result;
  }

  set(url: string, result: ExistenceResult): void {
    if (this.entries.size >= EXISTENCE_CACHE_MAX_SIZE) {
      const oldestKey = this.entries.keys().next().value;
      if (oldestKey) this.entries.delete(oldestKey);
    }
    this.entries.set(url, { result, timestamp: Date.now() });
  }

  clear(): void {
    this.entries.clear();
  }
}

export async function checkGrokipediaExists(
  grokipediaUrl: string,
  fetchFn: typeof fetch = fetch
): Promise<ExistenceResult> {
  try {
    const response = await fetchFn(grokipediaUrl, {
      method: "HEAD",
      redirect: "follow",
    });

    if (response.ok) return "exists";
    if (response.status === 404 || response.status === 410) return "missing";
    return "error";
  } catch {
    return "error";
  }
}
