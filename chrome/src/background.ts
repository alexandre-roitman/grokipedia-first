import {
  buildGrokipediaUrl,
  checkGrokipediaExists,
  DEFAULT_PREFERENCES,
  ExistenceCache,
  extractWikipediaArticleFromUrl,
  isGrokipediaHost,
  shouldRedirectLanguage,
  shouldSkipRedirect,
  type Preferences,
} from "@grokipedia-first/shared";
import browser from "webextension-polyfill";

const PREFERENCES_KEY = "preferences";
const STATS_KEY = "usageStats";

const existenceCache = new ExistenceCache();
const pendingChecks = new Map<number, string>();

let preferences: Preferences = { ...DEFAULT_PREFERENCES };

async function loadPreferences(): Promise<Preferences> {
  const stored = await browser.storage.sync.get(PREFERENCES_KEY);
  const value = stored[PREFERENCES_KEY] as Partial<Preferences> | undefined;
  preferences = { ...DEFAULT_PREFERENCES, ...value };
  return preferences;
}

async function savePreferences(prefs: Preferences): Promise<void> {
  preferences = prefs;
  await browser.storage.sync.set({ [PREFERENCES_KEY]: prefs });
}

async function recordStat(event: string): Promise<void> {
  if (!preferences.statsOptIn) return;
  const stored = await browser.storage.local.get(STATS_KEY);
  const stats = (stored[STATS_KEY] as Record<string, number>) ?? {};
  stats[event] = (stats[event] ?? 0) + 1;
  await browser.storage.local.set({ [STATS_KEY]: stats });
}

function isNeverAskAgain(title: string): boolean {
  return preferences.neverAskAgain.includes(title);
}

async function navigateToGrokipedia(
  tabId: number,
  grokipediaUrl: string
): Promise<void> {
  if (preferences.openInNewTab) {
    await browser.tabs.create({ url: grokipediaUrl });
    return;
  }
  await browser.tabs.update(tabId, { url: grokipediaUrl });
}

async function injectPopover(
  tabId: number,
  articleTitle: string,
  grokipediaUrl: string
): Promise<void> {
  await browser.scripting.insertCSS({
    target: { tabId },
    files: ["content-popover.css"],
  });

  await browser.scripting.executeScript({
    target: { tabId },
    files: ["content-popover.js"],
  });

  await browser.tabs.sendMessage(tabId, {
    type: "SHOW_POPOVER",
    articleTitle,
    grokipediaUrl,
  });
}

async function handleMissingArticle(
  tabId: number,
  articleTitle: string,
  grokipediaUrl: string
): Promise<void> {
  if (preferences.fallbackMode === "silent" || isNeverAskAgain(articleTitle)) {
    return;
  }

  try {
    await injectPopover(tabId, articleTitle, grokipediaUrl);
  } catch {
    // Page may not be injectable (e.g. chrome:// URLs).
  }
}

async function processNavigation(
  tabId: number,
  url: string,
  frameId: number
): Promise<void> {
  if (frameId !== 0) return;

  try {
    const hostname = new URL(url).hostname;
    if (isGrokipediaHost(hostname)) return;
  } catch {
    return;
  }

  if (!preferences.enabled) return;

  const article = extractWikipediaArticleFromUrl(url);
  if (!article || shouldSkipRedirect(url, article)) return;
  if (!shouldRedirectLanguage(article.language, preferences.englishOnly)) return;

  const cached = existenceCache.get(article.grokipediaUrl);
  if (cached === "exists") {
    await recordStat("redirect_cached");
    await navigateToGrokipedia(tabId, article.grokipediaUrl);
    return;
  }

  if (cached === "missing") {
    await recordStat("missing_cached");
    await handleMissingArticle(tabId, article.title, article.grokipediaUrl);
    return;
  }

  if (pendingChecks.get(tabId) === article.grokipediaUrl) return;
  pendingChecks.set(tabId, article.grokipediaUrl);

  const result = await checkGrokipediaExists(article.grokipediaUrl);
  existenceCache.set(article.grokipediaUrl, result);
  pendingChecks.delete(tabId);

  if (result === "exists") {
    await recordStat("redirect");
    await navigateToGrokipedia(tabId, article.grokipediaUrl);
    return;
  }

  if (result === "missing") {
    await recordStat("missing");
    await handleMissingArticle(tabId, article.title, article.grokipediaUrl);
    return;
  }

  await recordStat("check_error");
}

browser.action.onClicked.addListener(() => {
  void browser.runtime.openOptionsPage();
});

browser.webNavigation.onCommitted.addListener((details) => {
  void processNavigation(details.tabId, details.url, details.frameId);
});

browser.tabs.onRemoved.addListener((tabId) => {
  pendingChecks.delete(tabId);
});

browser.contextMenus.create({
  id: "open-in-grokipedia",
  title: "Open this page in Grokipedia",
  contexts: ["page", "link"],
});

browser.contextMenus.onClicked.addListener(async (info, tab) => {
  const targetUrl = info.linkUrl ?? info.pageUrl ?? tab?.url;
  if (!targetUrl) return;

  const article = extractWikipediaArticleFromUrl(targetUrl);
  const grokipediaUrl = article
    ? article.grokipediaUrl
    : buildGrokipediaUrl(
        new URL(targetUrl).pathname.split("/").pop()?.replace(/_/g, " ") ?? ""
      );

  if (tab?.id) {
    if (preferences.openInNewTab) {
      await browser.tabs.create({ url: grokipediaUrl });
    } else {
      await browser.tabs.update(tab.id, { url: grokipediaUrl });
    }
  } else {
    await browser.tabs.create({ url: grokipediaUrl });
  }
});

browser.runtime.onMessage.addListener((message, _sender) => {
  if (message.type === "GET_PREFERENCES") {
    return Promise.resolve(preferences);
  }

  if (message.type === "SET_PREFERENCES") {
    return savePreferences(message.preferences as Preferences);
  }

  if (message.type === "RESET_PREFERENCES") {
    existenceCache.clear();
    return savePreferences({ ...DEFAULT_PREFERENCES });
  }

  if (message.type === "NEVER_ASK_AGAIN") {
    const title = message.articleTitle as string;
    if (!preferences.neverAskAgain.includes(title)) {
      preferences.neverAskAgain = [...preferences.neverAskAgain, title];
      return savePreferences(preferences);
    }
    return Promise.resolve();
  }

  if (message.type === "REMOVE_NEVER_ASK") {
    const title = message.articleTitle as string;
    preferences.neverAskAgain = preferences.neverAskAgain.filter((t) => t !== title);
    return savePreferences(preferences);
  }

  return undefined;
});

void loadPreferences();

browser.storage.onChanged.addListener((changes, area) => {
  if (area === "sync" && changes[PREFERENCES_KEY]) {
    preferences = {
      ...DEFAULT_PREFERENCES,
      ...(changes[PREFERENCES_KEY].newValue as Partial<Preferences>),
    };
  }
});
