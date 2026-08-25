# First Response — Cyber Crime Citizen Journey

Independent hackathon prototype for Build What Moves India. This is **not** an official government product and does not imply government endorsement.

## Insight

When cyber fraud happens, the first minutes should not be spent figuring out which government form to fill. The citizen should first be triaged, protected, helped to preserve evidence, and then guided into a structured report.

## Journey

The prototype demonstrates:

1. Triage from human language, not legal categories.
2. Urgent first response for financial fraud with a simulated `Call 1930` prompt.
3. AI-safe structured understanding that never invents missing facts.
4. Mock evidence locker for screenshots, SMS, phone, UPI, URL, email, chat, and notes.
5. Editable incident timeline.
6. Reviewable evidence pack requiring explicit approval.
7. Mock report creation and simulated status tracking.
8. Secondary deterministic scam check that is intentionally not the homepage hero.

## Trust and privacy

- All data is synthetic or mock/demo data.
- The app does not connect to government systems.
- The app does not place calls or freeze accounts.
- The app must not collect Aadhaar, PAN, OTPs, bank credentials, payment credentials, health data, or government account credentials.
- The prototype preserves citizen text and does not silently delete evidence.

## Development

```bash
npm install
npm run dev
npm test
npm run typecheck
npm run build
```

## Architecture

- `app/` — Next.js shell and connected citizen journey.
- `components/` — Reusable UI blocks.
- `ai/` — AI-safe extraction/fallback modules.
- `triage/` — Deterministic routing and user override.
- `evidence/` — Mock evidence items and signal extraction.
- `timeline/` — Timeline generation and editing.
- `status/` — Simulated status state machine.
- `scam-check/` — Secondary deterministic mock signature matching.
- `data/` — Synthetic historical cases.
- `types/` — Shared domain models.
- `__tests__/` — Deterministic unit tests.
