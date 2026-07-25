# Grokipedia First

Make Grokipedia your default encyclopedia. A cross-browser extension (Chrome + Firefox) that redirects English Wikipedia articles to their Grokipedia equivalents, with smart fallbacks when content is missing.

**Tagline:** Automatically redirect Wikipedia to Grokipedia — the truth-seeking AI encyclopedia.

## Features

- **Automatic redirect** — Wikipedia wiki articles are checked against Grokipedia (HEAD request) and redirected when a page exists
- **Smart fallback** — Popover prompt (default) or silent Wikipedia viewing when Grokipedia has no article
- **Settings page** — Toggle redirect, language filter, new-tab mode, never-ask-again list, and opt-in local stats
- **Context menu** — “Open this page in Grokipedia” on pages and links
- **Privacy-first** — Preferences stored locally/sync; no browsing history tracking

## Monorepo structure

```
grokipedia-first/
├── shared/          # Shared TypeScript logic (URL parsing, exclusions, cache)
├── chrome/          # Chrome MV3 extension build
├── firefox/         # Firefox MV3 extension build
├── icons/           # Generated extension icons
└── scripts/         # Build utilities
```

Chrome and Firefox share the same source files under `chrome/src/`. The `shared` package holds redirect logic used by both builds.

## Development

### Prerequisites

- Node.js 18+
- npm 9+

### Setup

```bash
npm install
npm run build
```

This generates icons and builds both extensions to:

- `chrome/dist/`
- `firefox/dist/`

### Load unpacked (Chrome)

1. Open `chrome://extensions`
2. Enable **Developer mode**
3. Click **Load unpacked** and select `chrome/dist`

### Load temporary (Firefox)

1. Open `about:debugging#/runtime/this-firefox`
2. Click **Load Temporary Add-on**
3. Select `firefox/dist/manifest.json`

### Individual builds

```bash
npm run build:chrome
npm run build:firefox
npm run icons
```

## Configuration

Open extension settings (right-click the extension icon → Options, or via `chrome://extensions`).

| Setting | Default | Description |
|---------|---------|-------------|
| Enable redirect | On | Master on/off switch |
| English only | On | Only redirect `en.wikipedia.org` |
| Open in new tab | Off | Open Grokipedia in a new tab instead of replacing the current tab |
| Fallback mode | Popover | Popover vs silent when Grokipedia article is missing |
| Usage stats | Off | Opt-in local counters only |

## Redirect exclusions

The extension never redirects:

- Special, Talk, Help, and other non-article namespaces
- Edit, history, and search URLs
- Main Page
- Pages already on `grokipedia.com`

## Publishing

Before publishing to Mozilla Add-ons, update `browser_specific_settings.gecko.id` in `firefox/manifest.json` with your official extension ID.

Update the GitHub and feedback links in `chrome/src/options.html` once the repository is created.

## Privacy

- No browsing history is collected or transmitted
- Preferences use `storage.sync` (browser sync when enabled)
- Optional usage statistics are stored locally only when opted in

## License

MIT — see [LICENSE](LICENSE).
