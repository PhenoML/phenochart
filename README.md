# PhenoChart

AI-powered medical code extraction from clinical narratives.
A Chrome extension sidecar for chart review, powered by PhenoML's Construe API.

## Install for Local Testing

### Prerequisites

- Node.js 18+
- npm
- Google Chrome
- PhenoML API access ([sign up](https://console.pheno.ml))

### Build

```bash
git clone <repo-url> && cd phenochart
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

### Configure Credentials

Click the PhenoChart icon in the toolbar to open the side panel, then open Settings to enter your PhenoML credentials:

1. Enter your Instance URL, Username, Password, and FHIR Provider ID
2. Select the code systems you want to extract (ICD-10-CM, ICD-10-PCS, RXNORM, LOINC, HPO, CPT, SNOMED CT)
3. Click **Save**

Credentials are stored locally in `browser.storage.local` - never in source code or `.env` files. PhenoML is HIPAA compliant and SOC 2 Type II certified.

### Try the Demo

You can test the review flow without credentials:

1. Click **Load Demo Encounter** in the side panel
2. Review the AI-extracted ICD-10-CM codes
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

## Usage

### Real EHR mode

When on a Medplum encounter page with credentials configured, PhenoChart automatically detects the patient and encounter context. Click **Extract Codes** to run the Construe API against the encounter narrative. Review the extracted codes, then submit - accepted codes are written back to the patient record as FHIR resources.

### Demo mode

Click **Load Demo Encounter** to run through the full review flow with sample data. No credentials or EHR connection required.

## Stack

- [WXT](https://wxt.dev/) - Chrome extension framework
- React 19 + TypeScript
- Tailwind CSS v4 + shadcn/ui
- [PhenoML SDK](https://github.com/PhenoML/phenoml-ts-sdk) (`npm i -s phenoml`) - Construe API + FHIR client

## Architecture

```
Content Script (Medplum page detection)
    |
    v
browser.storage.local (page context)
    |
    v
Side Panel (React app)
    - AppContext + useReducer state machine
    - 6 states: idle -> loading -> review -> submitting -> submitted | error
    |
    +--> Real path: PhenoML SDK (construe.extractCodes) -> review -> FHIR write-back
    +--> Demo path: mock encounter + mock codes -> review -> simulated submission
```

The content script detects Medplum EHR pages and writes page context to `browser.storage.local`. The side panel reads this context to determine whether to use real API calls or demo data. In real mode, accepted codes are written back as FHIR resources (Condition, MedicationRequest, Observation, Procedure) via a FHIR bundle.
