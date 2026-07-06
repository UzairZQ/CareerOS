# CareerOS Germany - Implementation Plan

## What This Project Is

CareerOS Germany is a web platform for international students in Germany, starting with Werkstudent and early-career job seekers.

It helps users:

1. Track job applications in one place.
2. Track student working hours for visa/work-compliance awareness.
3. Check whether a CV is readable by an ATS parser.
4. Compare job descriptions against their skills and evidence.
5. Turn missing skills into practical proof-building tasks.
6. Optionally get AI insights using the user's own API key.

The project has two goals:

1. Build a genuinely useful tool for international students in Germany.
2. Learn modern web development step by step, honestly enough to explain and add the skills to a CV.

This is not an AI CV generator. The strongest version of CareerOS is a structured dashboard that remembers data, tracks progress, compares applications, and helps users make evidence-backed decisions over time.

## Product Positioning

CareerOS should be positioned as:

> A student job-search and work-compliance dashboard for international students in Germany, with ATS checks and skill-gap planning.

It should not be positioned as:

> A ChatGPT wrapper or fake CV generator.

The app should work without paid AI. Any AI integration should be optional later.

The default project AI provider, when AI is enabled, is Gemini. Users can bring their own API key. No platform-wide paid AI key is required for the base product.

## Target Users

- International students in Germany.
- Werkstudent job seekers.
- Junior developers and career switchers.
- Students moving from one technical area to another, such as mobile development to web/full-stack.
- Candidates who need to track applications, work limits, CV readability, and proof for claimed skills.

## Core Modules

### 1. App Shell and Auth

- Sign up and log in.
- User profile with name, university, semester, visa/work status, target roles, and languages.
- Protected dashboard after login.
- Navigation between modules.
- Supabase Row Level Security so each user only sees their own data.

Learning goals:

- React components.
- Routing.
- Supabase Auth.
- Protected routes.
- Basic PostgreSQL schema design.
- Row Level Security.

### 2. Job Application Tracker

- Add job applications.
- Store company, role, location, link, source, date applied, status, follow-up date, and notes.
- Filter and sort by status/date.
- Dashboard summaries such as total applications, response rate, interviews, rejections, offers, and upcoming follow-ups.

Learning goals:

- CRUD workflows.
- Forms and validation.
- Supabase insert/select/update/delete.
- Tables and dashboard UI.

### 3. Hour Tracker

- Log hours worked per employer and date.
- Track weekly hours.
- Track full-day and half-day usage.
- Show remaining allowance and warning states.
- Visualize hours with charts.

Important Germany rule baseline:

- Current official guidance says third-country students may work up to 140 full days or 280 half-days per calendar year without additional approval.
- A workday up to 4 hours counts as a half working day.
- Alternatively, students may work up to 20 hours per week during the lecture period.
- CareerOS should present this as guidance, not legal advice, and should let users verify rules against their own residence permit/Zusatzblatt.

Learning goals:

- Date handling.
- Aggregations.
- Compliance-style calculations.
- Recharts or another charting library.
- Clear warning/error states.

### 4. ATS Checker

- Upload a CV PDF.
- Extract raw text client-side using pdf.js.
- Show the user exactly what a machine can read.
- Run rule-based checks:
  - email detected
  - phone detected
  - standard section headings found
  - skills section found
  - suspiciously low extracted text
  - possible layout/order issues
- Provide a score and checklist of fixes.

Learning goals:

- File input handling.
- PDF text extraction.
- Regex and rule-based validation.
- User-facing diagnostics.

### 5. AI Insights (Bring Your Own Key)

AI Insights is optional and off by default.

The base product must work fully without AI. Users who want AI help can open a settings page, choose a provider, and add their own API key.

Initial providers:

- Gemini as the default recommended provider.
- Groq as an alternative provider.
- OpenRouter as an alternative provider.

The providers are chosen because they are developer-friendly and currently offer free-tier or free-model options, but provider limits can change. CareerOS should treat AI as a bonus layer, not a dependency.

Key handling rules:

- The user's API key is tied only to that user's account.
- The key is never shown to other users.
- The key is never logged.
- The key is never stored in client-side JavaScript.
- The key is sent from the settings form to a backend function over HTTPS.
- The backend function encrypts the key before storing it in Supabase.
- AI calls are made through a Supabase Edge Function, not directly from the browser.

After a key is added:

- The ATS Checker can show an optional "Get AI insight" button.
- The Skill Gap Analyzer can show an optional "Get AI insight" button.
- The app sends already-extracted structured data to the chosen model, such as skills, job-description text, skill-gap results, and ATS findings.
- The AI response is shown inline as extra guidance.

Without a key:

- The ATS Checker still runs with rule-based checks.
- The Skill Gap Analyzer still runs with keyword matching and database-backed comparison.
- No AI buttons are required for the app to feel complete.

Learning goals:

- Secure per-user secret storage.
- Supabase Edge Functions.
- Calling external APIs from a backend.
- Graceful degradation when optional AI is disabled.
- Provider abstraction for Gemini, Groq, and OpenRouter.

### 6. Skill Gap Analyzer

- Maintain an editable skill taxonomy in the database.
- Seed starter skills across frontend, backend, mobile, database, DevOps, language, and soft-skill categories.
- Let users mark skills they have and attach evidence.
- Paste a job description and match it against the skill taxonomy.
- Show matched skills, missing skills, basic fit percentage, and suggested proof tasks.

Learning goals:

- Many-to-many relationships.
- String parsing.
- Skill taxonomy design.
- Evidence-backed product logic.
- More complex SQL queries.

## Non-AI Intelligence Strategy

CareerOS should be useful without AI.

The first version uses:

- keyword dictionaries
- regex
- rule-based scoring
- structured database relationships
- dashboard analytics
- template-based suggestions

Examples:

- If a job description mentions React, TypeScript, and PostgreSQL, the analyzer matches those against the skill taxonomy.
- If the user has React evidence but no TypeScript evidence, CareerOS marks React as stronger and TypeScript as a gap.
- If TypeScript appears often across saved jobs, CareerOS can recommend a TypeScript proof task.

Optional later AI:

- Gemini is the default planned AI provider for optional AI insights.
- Groq and OpenRouter are planned as optional Bring Your Own Key alternatives.
- Ollama or OpenAI can be considered later if they clearly add value.
- The app should never depend on paid AI to function.
- The rule-based system remains the source of truth.

## Tech Stack

Decision to confirm before implementation:

- If the priority is learning React fundamentals first: use Vite + React Router.
- If the priority is portfolio/job-market signaling for web roles: use Next.js App Router.

Current recommended direction:

- Frontend: React.
- Framework/routing: to be finalized before milestone 1.
- Language: TypeScript.
- Styling: Tailwind CSS + shadcn/ui.
- Backend/database/auth: Supabase.
- Database: PostgreSQL through Supabase.
- Validation: Zod.
- Forms: React Hook Form.
- Charts: Recharts.
- ATS parsing: pdf.js.
- Optional AI: Gemini first, with Groq and OpenRouter as Bring Your Own Key alternatives.
- AI backend: Supabase Edge Function, not browser-side API calls.
- Hosting: Vercel or Netlify for frontend, Supabase cloud for backend.

Important clarification:

- Supabase and PostgreSQL are not two separate databases.
- Supabase is the hosted platform.
- PostgreSQL is the database inside Supabase.

## Tutor-Mode Workflow

This project should be built slowly and intentionally.

Session rule:

- The assistant explains what we are building and why.
- The user should understand each file before moving on.
- We avoid generating a whole app in one shot.
- We build feature by feature.
- When useful, code can be created directly only after the user asks for implementation.
- Planning documents can be updated when the user explicitly asks to add or update them.

The goal is not just that CareerOS works. The goal is that the user can explain, debug, and extend it.

## Suggested Build Order

1. Finalize milestone 1 requirements.
2. Choose framework: Vite + React Router or Next.js App Router.
3. Set up project skeleton.
4. Build auth and profile.
5. Build dashboard shell.
6. Build job application tracker.
7. Build hour tracker.
8. Add charts and summaries.
9. Build ATS checker.
10. Build skill gap analyzer.
11. Build optional AI Insights with Bring Your Own Key only after ATS and skill-gap data already work without AI.

## Milestone 1 Direction

Milestone 1 should be small enough to finish and understand.

Recommended milestone 1:

- Project setup.
- Auth.
- User profile.
- Dashboard shell.
- Job application tracker.
- Basic Supabase schema and RLS.

Hour tracker can be milestone 2 unless we decide it is the main hook for the first version.

## Interview and CV Framing

Possible CV/interview wording after implementation:

- Built a full-stack student productivity platform for international students in Germany.
- Implemented Supabase Auth, PostgreSQL schema design, and Row Level Security for user-owned data.
- Built a job application tracker with CRUD operations, filtering, status tracking, and dashboard summaries.
- Built a student work-hour tracker using date calculations and compliance-style warning states.
- Implemented a rule-based ATS checker using PDF text extraction and validation rules.
- Designed a non-AI skill-gap analyzer using a database-backed skill taxonomy and job-description matching.

## Confirmed Decisions

- The app should be useful without paid AI.
- AI is optional later, not the foundation.
- Gemini is the default planned model/provider for optional AI insights.
- Groq and OpenRouter are planned as additional Bring Your Own Key provider options.
- User AI keys must be stored encrypted and used only through backend functions.
- Supabase means hosted PostgreSQL plus Auth, not a separate database choice.
- The product should focus on practical student workflows, not a generic landing page.
- We will create `milestone-1.md` only after discussing and locking the first milestone.

## Sources To Verify During Build

- Make it in Germany: student work rules - https://www.make-it-in-germany.com/en/study-vocational-training/studies-in-germany/work
- DAAD: side jobs and international student work limits - https://www.daad.de/en/studying-in-germany/work-career/side-jobs/
- Gemini API pricing and free tier details - https://ai.google.dev/gemini-api/docs/pricing
- Gemini API rate limits - https://ai.google.dev/gemini-api/docs/rate-limits
- Groq pricing and free start - https://groq.com/pricing
- Groq rate limits - https://console.groq.com/docs/rate-limits
- OpenRouter pricing and free tier notes - https://openrouter.ai/pricing
- OpenRouter free models router - https://openrouter.ai/openrouter/free
- User's own residence permit/Zusatzblatt for personal compliance details.
