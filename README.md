# First Response — Cyber Crime Citizen Journey

**Independent hackathon prototype — not an official government product.**

First Response reorders the citizen journey around one idea: **describe what is happening before asking people to classify it.** The urgent path surfaces a simulated 1930 action immediately; the standard path explains the form and guards evidence; the status path explains progress in plain language.

## What is implemented

- **Triage:** three plain-language paths plus free-text routing through a real OpenAI API call, with visible route choice and user override.
- **Urgent path:** first element is a simulated “Call 1930 now” action; complaint drafting happens after the action is visible.
- **Standard path:** calm complaint form with a live deterministic guard for `# $ @ * \` ' ~ | !` and an embedded synthetic scam check.
- **AI drafting:** OpenAI generates a summary from only supplied facts; deterministic extraction remains the fallback.
- **AI scam reasoning:** deterministic signature matching decides the verdict; OpenAI only explains the supplied signal.
- **Status tracker:** `Received` → `With cyber cell` → `Outcome shared`, with a synthetic historical timeline range and mock acknowledgment number.
- **Synthetic data:** 180 deterministic historical rows and mock scam signatures; no real case data.

## AI vs deterministic split

**OpenAI:** `app/api/ai/route.ts`

1. Free-text triage.
2. Urgent complaint drafting.
3. Plain-language reasoning for scam-check results.

**Deterministic:**

- `triage/triageRules.ts` — card overrides and transparent fallback routing.
- `validation/characterGuard.ts` — character-trap detection.
- `scam-check/scamCheck.ts` — signature matching and verdict.
- `status/statusMachine.ts` — state machine and synthetic timeline calculation.

The API key stays server-side. Set `OPENAI_API_KEY` in your local environment or Vercel project; never put it in client code. The implementation uses the official OpenAI JavaScript SDK and Responses API.

## Safety / privacy

- Synthetic/demo data only.
- No connection to `cybercrime.gov.in` or another government backend.
- No real calls, account freezes, payments, OTPs, Aadhaar, PAN, bank credentials, health data, or government credentials.
- Every page carries the independent-prototype disclosure.
- “Not found” in the scam check never means safe.
- Original incident text is not silently rewritten by the character guard.

## Run locally

```bash
npm install
cp .env.example .env.local
# add your OPENAI_API_KEY to .env.local
npm run dev
```

Then open `http://localhost:3000`.

## Checks

```bash
npm test
npm run typecheck
npm run build
```

The repository contains deterministic unit tests for triage, hallucination-safe extraction, every blocked character, multiple-character warnings, timeline editing, the three-state status machine, synthetic timeline ranges, and scam matching.

## Demo script

1. Tap **Money is being taken right now** → the red **Call 1930 now** action is immediately visible.
2. Click **Draft with OpenAI** → show the generated summary and missing-facts list.
3. Return to triage and enter a free-text story → click **Continue with AI triage** → show the selected route and override option.
4. Choose the standard path → type `refund-help@upi!` → show the live character warning.
5. Run the optional scam check → show `MATCH` or `NOT FOUND` and then the OpenAI explanation.
6. Approve the mock report → show the synthetic acknowledgment number → open the three-state status tracker.
