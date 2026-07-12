# CareerOS Context

Last updated: 2026-07-11

## Project Summary

CareerOS is a full-stack portfolio project for international students and early-career developers in Germany. The product goal is not to be a generic AI CV generator. The core idea is a job-search operating system where job applications, work-hour limits, CV checks, skill gaps, and evidence are tracked together.

The differentiating concept is the Evidence Map:

```text
required skill -> my evidence -> confidence level -> learning/proof task
```

The app should help users make aggressive but defensible applications. No CV claim should be treated as ready unless the user has evidence or a proof task.

## Current Product Direction

Primary user:
- International students in Germany
- Working-student applicants
- Junior developers and career switchers
- People who need to prove skills through projects, courses, certificates, work, GitHub, deployment links, or notes

Current product modules:
- Auth
- Application dashboard
- Job tracker
- Work-hour permit tracker
- CV readability/ATS check
- Skill gap / evidence map and learning sprint
- Evidence-backed Application Assistant
- Optional BYOK AI insights

The app name shown in the landing/auth UI is currently **CareerOS**. The Germany-specific context still matters in the product, docs, and dashboard concepts.

## Tech Stack

Current stack:
- Next.js App Router
- React
- TypeScript
- Tailwind CSS
- Supabase
- Supabase Auth
- PostgreSQL through Supabase
- `@supabase/ssr`
- `@supabase/supabase-js`
- `pdfjs-dist` for local text extraction from selectable-text CV PDFs
- `lucide-react`

Dashboard data access is intentionally separated into the server-only
`lib/server/dashboard-data.ts` module. It runs independent profile,
application, work-hour, and AI-settings queries in parallel, then loads
application-scoped evidence and calculates analytics before the page composes
the React modules.

The JD/Evidence workspace keeps its server-backed mutation logic in the parent
but renders the Learning Sprint through `components/learning-sprint-panel.tsx`.
The child owns presentation, while the parent owns persistence and evidence
state through typed props and callbacks.

The Evidence Map table follows the same boundary in
`components/evidence-map-table.tsx`: row inputs and status visuals live in the
child, while `jd-evidence-workspace.tsx` owns the validated save callback.

Installed dependencies added during auth work:
- `@supabase/ssr`
- `@supabase/supabase-js`

No shadcn/ui setup has been completed yet. Some UI is custom Tailwind.

## Environment And Secrets

Local env file:

```text
.env.local
```

It is ignored by git through `.gitignore`.

Required env vars:

```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
SUPABASE_DB_PASSWORD=
AI_KEY_ENCRYPTION_SECRET=
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

`.env.example` is the safe tracked checklist. `AI_KEY_ENCRYPTION_SECRET` is
recommended in production so encrypted BYOK keys use a dedicated secret rather
than the service-role fallback.

Important:
- Do not commit `.env.local`.
- Do not print secret values in logs, docs, or commits.
- `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` are okay for browser use.
- `SUPABASE_SERVICE_ROLE_KEY` and `SUPABASE_DB_PASSWORD` must remain server-only and should not be exposed to client code.

## Supabase State

The Supabase project is connected locally.

The database schema file is:

```text
supabase/schema.sql
```

This SQL has already been run successfully in Supabase SQL Editor. Supabase returned:

```text
Success. No rows returned
```

The current schema creates:
- `public.applications`
- `public.evidence_items`
- `public.work_hour_logs`
- `public.ai_provider_settings`
- `public.user_profiles`
- RLS and own-user policies on every table
- `updated_at` triggers and user/date/application indexes

The schema has been run successfully in Supabase SQL Editor. The migration
`supabase/migrations/20260709_require_proof_for_cv_ready.sql` was also applied
to the connected live project and verified through a schema query and the live
integration test. `evidence_items.is_cv_ready` is now true only when evidence
text, a proof link, and a `direct`, `bridge`, or `basic` confidence are present.

The migration `supabase/migrations/20260710_add_cv_text_to_user_profiles.sql`
was applied to the connected live project and verified through the live
integration and authenticated E2E suites. `user_profiles.cv_text` stores only
the user's explicitly saved extracted/pasted CV text; PDF binaries are not
uploaded by the CV workflow.

The migration `supabase/migrations/20260710_add_learning_sprints.sql` was also
applied to the connected live project. `learning_sprints` stores one plan per
user/application/skill and `learning_sprint_tasks` stores ordered tasks and
proof. RLS scopes both tables to the owning user, and a database check prevents
`completed = true` without a proof URL or note.

Current `applications` fields:
- `id`
- `user_id`
- `company`
- `role`
- `location`
- `url`
- `job_description`
- `status`
- `follow_up_date`
- `notes`
- `created_at`
- `updated_at`

Allowed status values:
- `saved`
- `applied`
- `interview`
- `rejected`
- `offer`

## Auth Implementation

Implemented:
- Real email/password login
- Real email/password signup
- User metadata saved on signup:
  - `full_name`
  - `target_role`
- Password reset request
- Google OAuth button
- Auth callback route
- Server-side dashboard protection
- Sign out button

Important files:

```text
app/page.tsx
app/auth/callback/route.ts
app/dashboard/page.tsx
components/auth-panel.tsx
components/sign-out-button.tsx
lib/supabase/browser.ts
lib/supabase/server.ts
proxy.ts
```

Auth behavior:
- If a user is signed in and visits `/`, they are redirected to `/dashboard`.
- If a user is not signed in and visits `/dashboard`, they are redirected to `/`.
- `/auth/callback` exchanges the auth code for a session and redirects to `/dashboard` by default.
- Sign out clears the Supabase session and redirects to `/`.
- When Supabase requires email confirmation, login explains that state and offers a resend action with a 60-second client cooldown.
- Signup switches to the login view after the first successful request, preventing users from accidentally submitting signup repeatedly.
- Password reset requests also have a 60-second client cooldown.

Google sign-in:
- UI button exists.
- Supabase Google provider still needs to be enabled/configured in Supabase.
- Google Cloud OAuth client should use Supabase callback URL, usually:

```text
https://<project-ref>.supabase.co/auth/v1/callback
```

Do not add a random localhost callback in Google unless the Supabase flow specifically requires it. Google redirects to Supabase, and Supabase redirects back to the app.

## Current Landing/Auth Design

Landing page:
- Fullscreen looping video background
- No top nav
- Brand eyebrow says `CareerOS`
- Hero text:

```text
Build your German dream with proof.
```

Hero text was moved up into the blue-sky area so it does not touch the books or the boy below.

Auth card:
- Inspired by a reference sign-in card image/component
- Centered heading/subheading
- Large soft glass inputs
- White primary CTA like the reference
- Divider with `or`
- Google button below primary CTA
- Bottom mode-switch link:
  - `Don't have an account? Sign up`
  - `Already have an account? Sign in`
- Moving border/light-beam effect implemented in CSS
- Button shimmer effects implemented in CSS
- Supabase logic preserved
- Submit is disabled until client hydration completes, preventing a fast click
  from falling back to native form navigation before React is attached

Important files:

```text
app/page.tsx
components/auth-panel.tsx
app/globals.css
components/slow-background-video.tsx
```

Responsive behavior:
- Desktop/laptop: cinematic one-screen layout where possible
- Tablet/mobile: stacked layout with vertical scroll allowed
- No horizontal overflow should occur

Previously tested viewports:
- `1440x820`
- `1280x720`
- `768x1024`
- `390x844`

## Dashboard Implementation

Dashboard is protected and server-rendered.

Current dashboard includes:
- Sidebar with compact user profile card
- Sidebar modules:
  - Overview
  - Applications
  - Work Hours
  - Skill Gap
  - CV Check
  - Assistant
  - AI Insights
  - Logout
- Add Job form
- Supabase-backed application CRUD
- Search and status filtering
- Follow-up and notes editing
- Complete application record editing for company, role, location, URL, and job description
- Two-click delete confirmation
- Work-hour logging/deletion and compliance summary
- Rule-based JD analyzer and persisted Evidence Map
- 3/7/14-day learning sprint generation
- Persisted 3/7/14-day Learning Sprint plans with task proof and skill improvement
- Rule-based CV/ATS inspection
- Local PDF upload and selectable-text extraction into the ATS editor
- Explicit CV text save and reload persistence through `user_profiles.cv_text`
- Evidence-backed application suggestions
- User profile settings
- Optional encrypted BYOK AI settings and inline insights
- Route-level dashboard loading skeleton and recoverable error boundary
- Honest empty state when a new user has no applications; no fabricated job cards
- Empty CV, JD, and assistant states do not prefill sample user/job content
- Table-not-ready warnings if a schema query errors

Important dashboard files:

```text
app/dashboard/page.tsx
components/add-application-form.tsx
components/sign-out-button.tsx
app/globals.css
```

CV upload behavior:
- CV Check accepts a PDF up to 5 MB.
- `pdfjs-dist` extracts selectable text locally in the browser; the PDF is not
  uploaded to Supabase or sent to an AI provider by this workflow.
- Extracted text replaces the editable CV text area and immediately feeds the
  existing deterministic ATS checks.
- Scanned/image-only PDFs show a fallback asking the user to paste text or
  export a selectable-text PDF.
- Unsupported files, oversized files, and extraction failures are shown inline.

Current Add Job form writes to:

```text
public.applications
```

Fields submitted:
- `user_id`
- `company`
- `role`
- `location`
- `url`
- `job_description`
- `status`
- `follow_up_date`
- `notes`

After insert, the form calls `router.refresh()` so server-rendered application data updates.

Evidence Map saves also call `router.refresh()` so dashboard evidence coverage
updates immediately after proof is saved.

## Design Preferences And Decisions

User preferences discovered during iteration:
- Practical SaaS dashboard, not flashy startup dashboard
- Calm, professional, daily-use feel
- No generic landing page first once authenticated
- First authenticated screen should be dashboard
- Auth should be beautiful but stable
- Avoid white buttons generally, but for the final reference auth card the user specifically asked to imitate the reference, and the reference uses a white primary CTA
- Keep visible brand as `CareerOS`, not `CareerOS Germany`, in the landing/auth UI
- Auth card should follow the provided reference more closely than the earlier custom glass panel
- Dashboard should remain calmer and more professional than the experimental high-end redesign
- Do not let containers clip at the bottom
- Responsiveness matters across screen sizes

Design assets:
- Landing page currently uses remote video:

```text
https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260314_131748_f2ca2a28-fed7-44c8-b9a9-bd9acdd5ec31.mp4
```

Typography:
- `Instrument Serif`
- `Inter`
- `Lora`

Defined in:

```text
app/layout.tsx
tailwind.config.ts
```

## Known Build/Tooling Notes

Build command:

```bash
npm run build
```

Dev command:

```bash
npm run dev -- --port 3000
```

Lint command:

```bash
npm run lint
```

Next 16 removed `next lint`; the project now uses the ESLint flat config in
`eslint.config.mjs` and runs `eslint .`.

On this machine, if `npm` is not found in a shell, use:

```bash
PATH="/opt/homebrew/bin:/opt/homebrew/opt/node/bin:$PATH" npm run build
PATH="/opt/homebrew/bin:/opt/homebrew/opt/node/bin:$PATH" npm run dev -- --port 3000
```

Known Next.js cache issue:
- Running production build while dev server is active can corrupt/stale `.next`.
- Symptoms include errors such as:
  - `Cannot find module './331.js'`
  - `Cannot find module './833.js'`
  - failed page data collection for `/icon.svg`
  - missing `.next/routes-manifest.json`

Fix:

```bash
lsof -tiTCP:3000 -sTCP:LISTEN | xargs -r kill
rm -rf .next
npm run build
```

Then restart dev:

```bash
rm -rf .next
npm run dev -- --port 3000
```

Current production-hardening notes:
- Project is on Next `16.2.10`.
- Next 16 uses `proxy.ts` instead of the deprecated `middleware.ts` convention.
- `postcss` is pinned/overridden to `8.5.16`.
- `npm audit --audit-level=moderate` currently reports `0 vulnerabilities`.
- `npm run build` currently passes through the explicit webpack builder. This
  avoids a Turbopack process-port restriction observed in the local sandbox.
- `npm run lint` currently passes.
- `npm test` runs Vitest unit tests in `tests/`.
- `npm run test:integration` runs the real Supabase integration flow. It requires `.env.local` to be sourced first or equivalent env vars to be present:
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - `SUPABASE_SERVICE_ROLE_KEY`
- Current test coverage includes:
  - application create/update validation
  - profile/work-hour/evidence/AI settings validation
  - deterministic JD analyzer extraction
  - CV checker risk/missing-keyword behavior
  - Application Assistant evidence-backed suggestion rules
- Current authenticated E2E coverage includes:
  - temporary Supabase user creation and cleanup
  - email/password login and redirect to `/dashboard`
  - signup/login mode switching without sending live confirmation emails
  - dashboard module navigation
  - add-job form submission and database verification
  - application status, follow-up, and notes update
  - complete application record editing and database verification
  - work-hour log submission and database verification
  - profile settings save
  - Evidence Map React proof save and database verification
  - CV check module rendering
  - selectable-text PDF selection, local extraction, and ATS text-area update
  - explicit CV text save followed by page reload and value restoration
  - Learning Sprint creation, task proof saves, and proof-gated skill improvement
  - invalid AI key validation without a provider call
  - valid temporary BYOK key activation refreshes AI insight buttons without an external model call
  - database verification after the UI mutation
  - no page errors or console errors during the flow
- Current integration coverage includes:
  - temporary confirmed Supabase Auth user creation
  - sign-in with anon client
  - RLS-protected application create/read/update, including complete record fields
  - cross-user isolation check
  - profile upsert
  - saved CV text round-trip through `user_profiles.cv_text`
  - Learning Sprint/task persistence, proof constraint, and cross-user RLS isolation
  - work-hour log insert
  - evidence upsert with generated `is_cv_ready`
  - cleanup of temporary users/rows
- The integration test loads `.env.local` itself when present, so the documented
  integration command is self-contained.
- The test suite caught and fixed a real analyzer bug: skills followed by punctuation, such as `Supabase.` or `PostgreSQL.`, were not matching correctly.
- The analyzer now avoids false positives from generic `next` text and plain `SQL` being classified as `Next.js` or `PostgreSQL`.
- Dashboard evidence coverage only counts CV-ready evidence for skills actually requested by analyzed jobs.
- Dashboard mutations now use Zod validation:
  - application create/update: `lib/application-validation.ts`
  - profile, work-hour logs, evidence rows, AI provider settings: `lib/dashboard-validation.ts`
- Dashboard server data loading and query orchestration live in
  `lib/server/dashboard-data.ts`, keeping `app/dashboard/page.tsx` focused on
  route composition.
- Learning Sprint rendering lives in `components/learning-sprint-panel.tsx`,
  reducing the JD/Evidence workspace while keeping its proof callbacks typed.
- Evidence Map row rendering lives in `components/evidence-map-table.tsx`,
  keeping confidence styling and row controls out of the parent workspace.
- `/api/ai-settings` validates JSON/provider/key payloads server-side and rejects unauthenticated requests before writes.
- `/api/ai-insight` rejects malformed/oversized payloads, uses authenticated per-user encrypted keys, and applies a 30-second provider timeout.
- Auth provider errors are normalized into user-friendly messages, including a clear email-send rate-limit state.
- Email-confirmation and password-reset actions are guarded by cooldowns so the UI does not encourage repeated provider requests.
- AI defaults are current and configurable through `CAREEROS_GEMINI_MODEL`, `CAREEROS_GROQ_MODEL`, and `CAREEROS_OPENROUTER_MODEL`; current defaults are Gemini 2.5 Flash, Groq GPT-OSS 20B, and OpenRouter Google Gemini 2.5 Flash.
- Async form handlers capture their form element before Supabase awaits, so successful add-job and work-hour submissions do not hit React's cleared `event.currentTarget`.
- Optional dashboard validation fields accept `null` as well as empty strings, matching the database payloads for blank profile/evidence fields.
- Saving or removing a BYOK provider calls `router.refresh()` so already-rendered AI insight controls reflect the new setting immediately.
- CV-ready evidence now requires a proof link in addition to evidence text and a non-learning confidence level.
- Dashboard analytics now also requires a proof link before counting evidence coverage or CV-ready evidence.
- The optional AI insight route validates the entire request body with Zod before reading provider settings or calling an external provider.
- Dashboard analytics reads the user's full application set instead of silently capping summaries at 20 rows.
- The top dashboard search affordance now jumps to the real application search/filter controls instead of being an inert input.
- The overview Details and filter controls now navigate to analytics/application controls, and Profile is included in the module rail.
- Auth callback redirects are restricted to same-origin relative paths and failed OAuth/code exchanges return a recoverable login error.
- OAuth callback destinations reject backslash-based paths as well, closing a browser URL normalization open-redirect edge case.
- Dashboard module navigation is now real in-page navigation:
  - desktop sidebar links use anchors such as `#overview`, `#applications`, `#work-hours`, `#skill-gap`, `#cv-check`, `#assistant`, `#ai-insights`
  - mobile has a horizontal module nav
  - overview appears first; application creation/management lives under the Applications module

## Verified Runtime State

Verified across 2026-07-09 through 2026-07-12:

- `npm run lint` passed.
- `npm test` passed: 19 tests passed, 3 intentionally skipped integration tests in the default run.
- `npm run test:integration` passed: 3 real Supabase tests passed.
- The full single-worker Chromium suite passed 2 authenticated dashboard tests and transparently skipped signup when Supabase email-send rate limiting was active.
- The public auth browser test now checks mode switching only and creates no Supabase users or confirmation emails.
- `npm run build` passed with Next.js 16.2.10 using webpack.
- `npm audit --audit-level=moderate` reported 0 vulnerabilities.
- Browser inspection at the default 1280x720 viewport showed the dashboard content in an internal scroll region.
- Browser inspection at 390x844 showed no document-level horizontal overflow; only the compact module rail scrolls horizontally by design.
- The 2026-07-10 browser smoke check still shows no horizontal overflow at 1280x720 or 390x844 and no captured console errors.
- A live-console audit caught and fixed an Evidence Map maximum-update-depth loop by making its synchronization idempotent and its analyzer result stable.
- The empty-account E2E assertion proves a user with no applications sees the honest onboarding state rather than demo data.
- The PDF E2E assertion proves a selectable-text CV is parsed locally and fed
  into the ATS analyzer without a server upload.
- The empty-module E2E assertions prove CV Check, Skill Gap, and Assistant do
  not fabricate sample content for a new account.
- `app/dashboard/loading.tsx` and `app/dashboard/error.tsx` provide the
  Next.js route-level loading and recovery states for dashboard server renders.
- The authenticated E2E assertion proves explicitly saved CV text is restored
  after a full page reload.
- The authenticated E2E assertion proves a Learning Sprint can be created,
  each task can receive proof, and the skill can only be improved afterward.
- The mobile E2E assertion proves the dashboard has no document-level horizontal
  overflow at 390x844.
- The authenticated E2E assertion proves Evidence Map proof saves update the
  dashboard's live Evidence ready metric without a full-page reload.
- Playwright runs with one worker to avoid creating concurrent confirmation-email requests against Supabase's provider quota.

The dashboard is intentionally a long, scrollable work surface: the outer page stays fixed to the viewport while the main dashboard column scrolls through all modules. This is required so users can reach the complete application rather than clipping the lower modules.

## Git / Repo State Notes

GitHub repo was created and pushed earlier:

```text
https://github.com/UzairZQ/CareerOS.git
```

Recent committed state before the latest auth/dashboard work:
- `450719a Initial CareerOS Germany prototype`
- `8dfd9ac Clean up public hero navigation`
- `25f1a3b Add app icon`

Commits are pushed to `origin/main` after each completed milestone or major
vertical slice. Check with:

```bash
git status --short
```

Do not commit `.env.local`.

## Current Important Files

Auth:

```text
app/page.tsx
components/auth-panel.tsx
app/auth/callback/route.ts
proxy.ts
lib/supabase/browser.ts
lib/supabase/server.ts
```

Dashboard:

```text
app/dashboard/page.tsx
components/add-application-form.tsx
components/application-management-panel.tsx
components/application-record-editor.tsx
components/application-assistant-panel.tsx
components/cv-check-panel.tsx
components/dashboard-analytics-panel.tsx
components/jd-evidence-workspace.tsx
components/profile-settings-panel.tsx
components/sign-out-button.tsx
components/work-hours-permit.tsx
lib/application-validation.ts
lib/dashboard-validation.ts
tests/validation.test.ts
tests/analyzer.test.ts
tests/e2e/auth.spec.ts
tests/integration/supabase-flow.test.ts
vitest.config.ts
```

Styling:

```text
app/globals.css
tailwind.config.ts
app/layout.tsx
```

Database:

```text
supabase/schema.sql
```

Planning/docs:

```text
implementation-plan.md
docs/project-structure.md
README.md
context.md
```

## Suggested Next Steps

Recommended next implementation order:

1. Enable Google provider in Supabase if needed.
2. Test Google OAuth end to end.
3. Retest application desk interactions in the browser:
   - status update
   - follow-up date
   - notes
   - two-click delete guard
   - search/filter
4. Add stronger tests for dashboard mutations, ideally with Playwright once the UI stabilizes.
5. Continue production hardening:
   - authenticated browser retest for profile, work-hour logs, evidence rows, AI key settings
   - better loading states
   - accessibility pass
   - responsive screenshots across desktop/tablet/mobile
6. Improve module navigation with active-section highlighting if/when a client-side dashboard shell is introduced.
7. Add export or portfolio-demo seed flow if useful for presenting the project.

## What Future Codex Should Remember

- Do not redesign the dashboard into a flashy high-end concept without asking. The user preferred the calmer professional dashboard.
- The auth card should stay close to the provided reference image unless the user changes direction.
- Keep changes responsive and verify with browser screenshots/metrics across desktop, laptop, tablet, and mobile.
- Do not print or commit secret values.
- Prefer implementation plus verification, not just suggestions.
- The user is learning web development, so explain important architecture choices in plain terms when asked.
