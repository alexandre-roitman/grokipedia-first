import browser from "webextension-polyfill";

interface PopoverMessage {
  type: "SHOW_POPOVER";
  articleTitle: string;
  grokipediaUrl: string;
}

const POPOVER_ID = "grokipedia-first-popover";

function removePopover(): void {
  document.getElementById(POPOVER_ID)?.remove();
}

function createPopover(articleTitle: string, grokipediaUrl: string): HTMLElement {
  const overlay = document.createElement("div");
  overlay.id = POPOVER_ID;
  overlay.setAttribute("role", "dialog");
  overlay.setAttribute("aria-modal", "true");
  overlay.setAttribute("aria-labelledby", "gf-popover-title");

  const card = document.createElement("div");
  card.className = "gf-popover-card";

  const title = document.createElement("h2");
  title.id = "gf-popover-title";
  title.className = "gf-popover-title";
  title.textContent = "Article not on Grokipedia yet";

  const message = document.createElement("p");
  message.className = "gf-popover-message";
  message.textContent = `"${articleTitle}" isn't available on Grokipedia yet. You can still visit Grokipedia or read Wikipedia.`;

  const actions = document.createElement("div");
  actions.className = "gf-popover-actions";

  const goButton = document.createElement("button");
  goButton.type = "button";
  goButton.className = "gf-btn gf-btn-primary";
  goButton.textContent = "Go to Grokipedia";
  goButton.addEventListener("click", () => {
    window.location.href = grokipediaUrl;
  });

  const stayButton = document.createElement("button");
  stayButton.type = "button";
  stayButton.className = "gf-btn gf-btn-secondary";
  stayButton.textContent = "View Wikipedia Anyway";
  stayButton.addEventListener("click", () => {
    removePopover();
  });

  const neverButton = document.createElement("button");
  neverButton.type = "button";
  neverButton.className = "gf-btn gf-btn-ghost";
  neverButton.textContent = "Never ask for this article";
  neverButton.addEventListener("click", async () => {
    await browser.runtime.sendMessage({
      type: "NEVER_ASK_AGAIN",
      articleTitle,
    });
    removePopover();
  });

  actions.append(goButton, stayButton, neverButton);
  card.append(title, message, actions);
  overlay.append(card);

  overlay.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      removePopover();
    }
  });

  return overlay;
}

function showPopover(articleTitle: string, grokipediaUrl: string): void {
  removePopover();
  const popover = createPopover(articleTitle, grokipediaUrl);
  document.body.append(popover);
  popover.querySelector<HTMLButtonElement>(".gf-btn-primary")?.focus();
}

browser.runtime.onMessage.addListener((message: PopoverMessage) => {
  if (message.type === "SHOW_POPOVER") {
    showPopover(message.articleTitle, message.grokipediaUrl);
  }
});
