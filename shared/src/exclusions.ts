import type { WikipediaArticle } from "./types.js";

const EXCLUDED_PREFIXES = [
  "Special:",
  "Talk:",
  "Help:",
  "User:",
  "User_talk:",
  "Wikipedia:",
  "File:",
  "Template:",
  "Category:",
  "Portal:",
  "Draft:",
  "TimedText:",
  "Module:",
];

const MAIN_PAGE_TITLES = new Set([
  "Main Page",
  "Main_Page",
  "Wikipedia",
]);

function hasExcludedPath(pathname: string): boolean {
  if (pathname.includes("/wiki/Special:")) return true;
  if (pathname.includes("/w/index.php")) return true;
  if (pathname.includes("/wiki/Wikipedia:")) return true;
  return false;
}

function isEditOrHistoryUrl(url: URL): boolean {
  if (url.searchParams.has("action")) {
    const action = url.searchParams.get("action");
    if (action && action !== "view") return true;
  }
  if (url.pathname.includes("/w/index.php")) return true;
  return false;
}

function isSearchUrl(url: URL): boolean {
  return (
    url.searchParams.has("search") ||
    url.pathname.includes("/wiki/Special:Search") ||
    url.pathname.includes("/wiki/Special:WhatLinksHere")
  );
}

export function isExcludedArticleTitle(title: string): boolean {
  const normalized = title.replace(/_/g, " ");
  if (MAIN_PAGE_TITLES.has(title) || MAIN_PAGE_TITLES.has(normalized)) {
    return true;
  }

  return EXCLUDED_PREFIXES.some(
    (prefix) =>
      title.startsWith(prefix) ||
      normalized.startsWith(prefix.replace(/_/g, " "))
  );
}

export function shouldSkipRedirect(
  url: string,
  article: WikipediaArticle | null
): boolean {
  if (!article) return true;

  try {
    const parsed = new URL(url);

    if (hasExcludedPath(parsed.pathname)) return true;
    if (isEditOrHistoryUrl(parsed)) return true;
    if (isSearchUrl(parsed)) return true;
    if (isExcludedArticleTitle(article.title)) return true;

    return false;
  } catch {
    return true;
  }
}

export function shouldRedirectLanguage(
  language: string,
  englishOnly: boolean
): boolean {
  if (!englishOnly) return true;
  return language === "en";
}
