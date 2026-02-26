# PhenoChart

AI-powered medical code extraction from clinical narratives.
A Chrome extension sidecar for chart review, powered by PhenoML's Construe API.

## Install for Local Testing

### Prerequisites

- Node.js 18+
- npm
- Google Chrome

### Configure Credentials

After loading the extension, open the options page to enter your PhenoML credentials:

1. Go to `chrome://extensions`
2. Find PhenoChart and click **Details** → **Extension options** (or right-click the toolbar icon → **Options**)
3. Enter your Instance URL, Client ID, and Client Secret
4. Click **Save Credentials**

Credentials are stored locally in `browser.storage.local` — never in source code or `.env` files.

### Build

```bash
git clone <repo-url> && cd rcm-chrome-extension
npm install
npm run build
```

This produces a ready-to-load extension in `.output/chrome-mv3/`.

### Load into Chrome

1. Open Chrome and navigate to `chrome://extensions`
2. Toggle **Developer mode** on (top-right corner)
3. Click **Load unpacked**
4. Select the `.output/chrome-mv3/` folder inside the project directory
5. PhenoChart should now appear in your extensions toolbar (puzzle piece icon)
6. Pin it by clicking the puzzle piece icon and then the pin next to PhenoChart

### Open the Side Panel

- Click the PhenoChart diamond icon in the toolbar, or
- Right-click any page and select **PhenoChart** from the context menu

### Try the Demo

1. Click **Load Demo Encounter** in the side panel
2. Review the 7 AI-extracted codes (5 ICD-10-CM + 2 RXNORM)
3. Accept or reject each code
4. Submit your review
5. Click **Review Another** to reset

### Updating After Code Changes

When you make changes and rebuild:

```bash
npm run build
```

Then go back to `chrome://extensions` and click the **reload** icon (circular arrow) on the PhenoChart card. No need to remove and re-add the extension.

## Development

```bash
npm run dev     # Start with HMR
npm run build   # Production build
npm run check   # TypeScript check
npm run clean   # Remove build artifacts
```

## Demo Flow

1. **Idle** -- Side panel opens with PhenoChart branding
2. **Loading** -- Click "Load Demo Encounter" to start code extraction
3. **Review** -- 7 AI-extracted codes appear (5 ICD-10-CM conditions + 2 RXNORM medications)
4. **Accept/Reject** -- Review each code with citation-backed rationale
5. **Submit** -- Confirmation summary with accepted/rejected breakdown
6. **Reset** -- "Review Another" returns to idle

### Keyboard Shortcuts (Review State)

| Key | Action |
|-----|--------|
| Tab | Navigate between code cards |
| A | Accept focused card |
| R | Reject focused card |
| Escape | Cancel rejection comment |

## Stack

- [WXT](https://wxt.dev/) -- Chrome extension framework
- React 19 + TypeScript
- Tailwind CSS v4 + shadcn/ui
- PhenoML Construe API (mocked for V0)

## Architecture

```
Content Script (MedPlum page detection)
    |
    v
browser.storage.local (page context)
    |
    v
Side Panel (React app)
    - AppContext + useReducer state machine
    - 6 states: idle -> loading -> review -> submitting -> submitted | error
    - Mock services simulate API latency
```

The content script detects MedPlum EHR pages and writes page context to `browser.storage.local`. The side panel reads this context to show contextual messaging. All data is mocked for V0 -- no real API calls.

## V0 Scope

This is a fully mocked demo. No real Construe API calls, no FHIR reads/writes, no Chrome Web Store publishing. Load unpacked and click through the flow.

