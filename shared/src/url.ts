import { GROKI_PAGE_PREFIX } from "./defaults.js";
import type { WikipediaArticle } from "./types.js";

const WIKI_HOST_PATTERN = /^([a-z]{2,})\.wikipedia\.org$/i;
const GROKI_HOST_PATTERN = /(^|\.)grokipedia\.com$/i;

/** Decode Wikipedia path segment to article title (spaces, not underscores). */
export function decodeWikiTitle(segment: string): string {
  try {
    return decodeURIComponent(segment.replace(/_/g, " "));
  } catch {
    return segment.replace(/_/g, " ");
  }
}

/** Encode article title for Grokipedia URL (underscores). */
export function encodeGrokipediaTitle(title: string): string {
  return encodeURIComponent(title.replace(/ /g, "_"));
}

export function buildGrokipediaUrl(title: string): string {
  return `${GROKI_PAGE_PREFIX}${encodeGrokipediaTitle(title)}`;
}

export function isGrokipediaHost(hostname: string): boolean {
  return GROKI_HOST_PATTERN.test(hostname);
}

export function parseWikipediaUrl(url: string): WikipediaArticle | null {
  try {
    const parsed = new URL(url);
    if (!WIKI_HOST_PATTERN.test(parsed.hostname)) {
      return null;
    }

    const language = parsed.hostname.split(".")[0].toLowerCase();
    const match = parsed.pathname.match(/^\/wiki\/(.+)$/);
    if (!match) {
      return null;
    }

    const title = decodeWikiTitle(match[1]);
    if (!title) {
      return null;
    }

    return {
      title,
      language,
      grokipediaUrl: buildGrokipediaUrl(title),
    };
  } catch {
    return null;
  }
}

export function extractWikipediaArticleFromUrl(url: string): WikipediaArticle | null {
  return parseWikipediaUrl(url);
}
