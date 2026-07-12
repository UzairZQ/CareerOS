# CareerOS Germany - Project Structure Log

Created: 2026-07-04 20:57 CEST

## Current Repository State

The repository now contains the implemented full-stack vertical slice, not only the visual prototype.

```text
CareerOS/
  app/
    api/
      ai-insight/route.ts
      ai-settings/route.ts
    auth/callback/route.ts
    dashboard/page.tsx
    dashboard/loading.tsx
    dashboard/error.tsx
    globals.css
    layout.tsx
    page.tsx
  components/
    auth-panel.tsx
    add-application-form.tsx
    application-management-panel.tsx
    application-record-editor.tsx
    work-hours-permit.tsx
    jd-evidence-workspace.tsx
    learning-sprint-panel.tsx
    evidence-map-table.tsx
    cv-check-panel.tsx
    application-assistant-panel.tsx
    profile-settings-panel.tsx
    ai-settings-panel.tsx
    dashboard-analytics-panel.tsx
  lib/
    careeros-analyzer.ts
    dashboard-analytics.ts
    dashboard-validation.ts
    application-validation.ts
    work-hours.ts
    user-profile.ts
    ai-providers.ts
    auth-errors.ts
    auth-navigation.ts
    supabase/
    server/
      dashboard-data.ts
      secret-crypto.ts
  supabase/
    schema.sql
    migrations/20260709_require_proof_for_cv_ready.sql
    migrations/20260710_add_cv_text_to_user_profiles.sql
    migrations/20260710_add_learning_sprints.sql
    migrations/20260712_add_application_metadata.sql
  tests/
    analyzer.test.ts
    validation.test.ts
    integration/supabase-flow.test.ts
    e2e/dashboard-authenticated.spec.ts
    e2e/auth.spec.ts
  proxy.ts
  .env.example
  eslint.config.mjs
  playwright.config.ts
  vitest.config.ts
  context.md
  implementation-plan.md
  README.md
```

## Architecture Decision

Next.js App Router is the confirmed framework. React components live in
`components/`, server-rendered route composition lives in `app/`, shared domain
logic lives in `lib/`, and Supabase SQL/RLS lives in `supabase/`.

## Decision Log

- 2026-07-04: Reset the folder to start clean.
- 2026-07-04: Refined CareerOS away from an AI-first job analyzer.
- 2026-07-04: Updated direction to a practical student job-search and work-compliance dashboard.
- 2026-07-04: Confirmed non-AI-first approach using rules, database logic, analytics, and structured workflows.
- 2026-07-04: Noted updated Germany student work baseline: 140 full days / 280 half-days per calendar year, or 20 hours/week during lecture period, with user-specific permit verification required.
- 2026-07-04: Added Module 5: AI Insights (Bring Your Own Key). Gemini is the default optional provider, with Groq and OpenRouter planned as alternatives. AI stays off by default and runs only through backend functions using encrypted per-user keys.
- 2026-07-04: `milestone-1.md` will be created only after discussion.
- 2026-07-06: Created the first Next.js visual prototype with `/` as the animated video login/entry screen and `/dashboard` as the CareerOS dark premium dashboard mock.
- 2026-07-09: Implemented the Supabase-backed auth/dashboard vertical slice, optional BYOK AI routes, authenticated E2E coverage, proof-link enforcement, honest empty state, local selectable-text PDF extraction, live proof-link migration verification, and production verification gates.
- 2026-07-10: Added explicit CV text persistence through `user_profiles.cv_text`; selectable-text PDF extraction remains local, and the save/reload path is covered by live integration and authenticated E2E tests.
- 2026-07-11: Added persisted Learning Sprint plans/tasks with per-task proof, database proof constraints, RLS isolation, proof-gated skill improvement, and mobile overflow regression coverage.
- 2026-07-11: Added dashboard route-level loading and recoverable error boundaries for resilient server-rendered navigation.
- 2026-07-11: Added a separate application record editor for complete job-field updates, with Zod validation, live Supabase verification, and authenticated browser coverage.
- 2026-07-12: Hardened email/password auth with confirmation-aware errors, duplicate-submit protection, resend/reset cooldowns, and a non-email-generating public auth E2E test.
- 2026-07-12: Added optional application source and applied-date fields with an additive live migration and end-to-end coverage.
