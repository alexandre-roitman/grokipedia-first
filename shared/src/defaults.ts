import type { Preferences } from "./types.js";

export const DEFAULT_PREFERENCES: Preferences = {
  enabled: true,
  fallbackMode: "popover",
  englishOnly: true,
  openInNewTab: false,
  neverAskAgain: [],
  statsOptIn: false,
};

export const GROKI_BASE_URL = "https://grokipedia.com";
export const GROKI_PAGE_PREFIX = `${GROKI_BASE_URL}/page/`;

/** Cache TTL for existence checks (5 minutes). */
export const EXISTENCE_CACHE_TTL_MS = 5 * 60 * 1000;

/** Max cached existence entries. */
export const EXISTENCE_CACHE_MAX_SIZE = 500;
