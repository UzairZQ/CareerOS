# CareerOS Germany - Project Structure Log

Created: 2026-07-04 20:57 CEST

## Current Repository State

The previous prototype files were deleted so CareerOS Germany can start clean.

Current files:

```text
CareerOS/
  app/
    dashboard/
      page.tsx
    globals.css
    layout.tsx
    page.tsx
  components/
    animated-heading.tsx
    fade-in.tsx
  implementation-plan.md
  package.json
  tailwind.config.ts
  docs/
    project-structure.md
```

## Planned Structure

The exact app structure will be decided after milestone 1 is confirmed.

If we choose Next.js App Router:

```text
CareerOS/
  app/
  components/
  lib/
  supabase/
  docs/
```

If we choose Vite + React Router:

```text
CareerOS/
  src/
    components/
    modules/
    routes/
    lib/
  supabase/
  docs/
```

## Decision Log

- 2026-07-04: Reset the folder to start clean.
- 2026-07-04: Refined CareerOS away from an AI-first job analyzer.
- 2026-07-04: Updated direction to a practical student job-search and work-compliance dashboard.
- 2026-07-04: Confirmed non-AI-first approach using rules, database logic, analytics, and structured workflows.
- 2026-07-04: Noted updated Germany student work baseline: 140 full days / 280 half-days per calendar year, or 20 hours/week during lecture period, with user-specific permit verification required.
- 2026-07-04: Added Module 5: AI Insights (Bring Your Own Key). Gemini is the default optional provider, with Groq and OpenRouter planned as alternatives. AI stays off by default and runs only through backend functions using encrypted per-user keys.
- 2026-07-04: `milestone-1.md` will be created only after discussion.
- 2026-07-06: Created the first Next.js visual prototype with `/` as the animated video login/entry screen and `/dashboard` as the CareerOS dark premium dashboard mock.
