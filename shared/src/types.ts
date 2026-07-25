export type FallbackMode = "popover" | "silent";

export interface Preferences {
  enabled: boolean;
  fallbackMode: FallbackMode;
  englishOnly: boolean;
  openInNewTab: boolean;
  neverAskAgain: string[];
  statsOptIn: boolean;
}

export interface WikipediaArticle {
  title: string;
  language: string;
  grokipediaUrl: string;
}

export type ExistenceResult = "exists" | "missing" | "error";

export interface ExistenceCacheEntry {
  result: ExistenceResult;
  timestamp: number;
}
