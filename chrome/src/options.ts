import { DEFAULT_PREFERENCES, type Preferences } from "@grokipedia-first/shared";
import browser from "webextension-polyfill";

const enabled = document.getElementById("enabled") as HTMLInputElement;
const englishOnly = document.getElementById("englishOnly") as HTMLInputElement;
const openInNewTab = document.getElementById("openInNewTab") as HTMLInputElement;
const statsOptIn = document.getElementById("statsOptIn") as HTMLInputElement;
const saveBtn = document.getElementById("saveBtn") as HTMLButtonElement;
const resetBtn = document.getElementById("resetBtn") as HTMLButtonElement;
const neverAskList = document.getElementById("neverAskList") as HTMLUListElement;
const status = document.getElementById("status") as HTMLParagraphElement;

function getFallbackMode(): Preferences["fallbackMode"] {
  const selected = document.querySelector<HTMLInputElement>(
    'input[name="fallbackMode"]:checked'
  );
  return (selected?.value as Preferences["fallbackMode"]) ?? "popover";
}

function setFallbackMode(mode: Preferences["fallbackMode"]): void {
  const input = document.querySelector<HTMLInputElement>(
    `input[name="fallbackMode"][value="${mode}"]`
  );
  if (input) input.checked = true;
}

function renderNeverAskList(titles: string[]): void {
  neverAskList.replaceChildren();

  if (titles.length === 0) {
    const empty = document.createElement("li");
    empty.textContent = "No articles in the list.";
    empty.style.color = "var(--muted)";
    neverAskList.append(empty);
    return;
  }

  titles.forEach((title) => {
    const li = document.createElement("li");
    const span = document.createElement("span");
    span.textContent = title;

    const removeBtn = document.createElement("button");
    removeBtn.type = "button";
    removeBtn.textContent = "Remove";
    removeBtn.addEventListener("click", async () => {
      await browser.runtime.sendMessage({
        type: "REMOVE_NEVER_ASK",
        articleTitle: title,
      });
      await loadPreferences();
      setStatus("Removed from never-ask list.");
    });

    li.append(span, removeBtn);
    neverAskList.append(li);
  });
}

function applyPreferences(prefs: Preferences): void {
  enabled.checked = prefs.enabled;
  englishOnly.checked = prefs.englishOnly;
  openInNewTab.checked = prefs.openInNewTab;
  statsOptIn.checked = prefs.statsOptIn;
  setFallbackMode(prefs.fallbackMode);
  renderNeverAskList(prefs.neverAskAgain);
}

async function loadPreferences(): Promise<void> {
  const prefs = (await browser.runtime.sendMessage({
    type: "GET_PREFERENCES",
  })) as Preferences;
  applyPreferences({ ...DEFAULT_PREFERENCES, ...prefs });
}

async function collectPreferences(): Promise<Preferences> {
  const current = (await browser.runtime.sendMessage({
    type: "GET_PREFERENCES",
  })) as Preferences;

  return {
    enabled: enabled.checked,
    englishOnly: englishOnly.checked,
    openInNewTab: openInNewTab.checked,
    statsOptIn: statsOptIn.checked,
    fallbackMode: getFallbackMode(),
    neverAskAgain: current.neverAskAgain,
  };
}

function setStatus(message: string): void {
  status.textContent = message;
}

saveBtn.addEventListener("click", async () => {
  const prefs = await collectPreferences();
  await browser.runtime.sendMessage({
    type: "SET_PREFERENCES",
    preferences: prefs,
  });
  setStatus("Settings saved.");
});

resetBtn.addEventListener("click", async () => {
  await browser.runtime.sendMessage({ type: "RESET_PREFERENCES" });
  applyPreferences({ ...DEFAULT_PREFERENCES });
  setStatus("All preferences reset.");
});

void loadPreferences();
