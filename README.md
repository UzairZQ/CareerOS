# CareerOS

CareerOS is a full-stack job-search operating system for international students and early-career developers in Germany.

It combines:

- Supabase Auth and user profiles
- Application tracking with status, follow-ups, notes, and search
- Germany-focused work-hour logging and allowance summaries
- Deterministic job-description analysis
- Local selectable-text PDF extraction for CV checks
- An evidence map: required skill -> evidence -> confidence -> proof task
- 3, 7, and 14-day learning sprints
- Rule-based CV/ATS inspection
- Evidence-backed application suggestions
- Optional BYOK AI insights through authenticated server routes

The product works without AI. AI is an optional enrichment layer, not the source of truth.

## Stack

- Next.js App Router 16
- React 19
- TypeScript
- Tailwind CSS
- Supabase Auth and PostgreSQL
- `@supabase/ssr`
- Zod
- `pdfjs-dist`
- Lucide React
- Vitest
- Playwright

## Run Locally

Create `.env.local` with:

```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
SUPABASE_DB_PASSWORD=
AI_KEY_ENCRYPTION_SECRET=
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

Use [.env.example](/Users/uzair99/Development/CareerOS/.env.example) as the
variable checklist. The service-role key, database password, and encryption
secret are server-only. In production, use a separate long random value for
`AI_KEY_ENCRYPTION_SECRET` instead of relying on the service-role fallback.

Then run:

```bash
npm install
npm run dev -- --port 3000
```

Open [http://localhost:3000](http://localhost:3000).

## Database

Run [supabase/schema.sql](/Users/uzair99/Development/CareerOS/supabase/schema.sql) in the Supabase SQL editor for the base schema and RLS policies.

After the base schema, run the migration in [supabase/migrations/20260709_require_proof_for_cv_ready.sql](/Users/uzair99/Development/CareerOS/supabase/migrations/20260709_require_proof_for_cv_ready.sql). It keeps `is_cv_ready` false until a CV-ready evidence row has both an evidence summary and a proof link.

Never commit `.env.local`, service-role credentials, database passwords, or provider API keys.

## Verification

```bash
npm run lint
npm test
npm run test:integration
npm run test:e2e
npm run build
npm audit --audit-level=moderate
```

The integration test uses temporary Supabase users and verifies RLS. The E2E tests cover login, signup metadata persistence, application CRUD, work-hour logging, profile saving, evidence persistence, local selectable-text PDF extraction, CV check rendering, BYOK activation, empty-state rendering, and browser error detection.

## Optional AI

Users can connect their own Gemini, Groq, or OpenRouter key from AI Insights. Keys are encrypted server-side, scoped to the authenticated user, and never exposed to browser-side JavaScript. Model defaults can be overridden with:

```bash
CAREEROS_GEMINI_MODEL=
CAREEROS_GROQ_MODEL=
CAREEROS_OPENROUTER_MODEL=
```

## Product Principle

CareerOS is not a generic AI CV generator. A skill is only useful in an application when the user can explain and prove it.
