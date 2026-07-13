create extension if not exists "pgcrypto";

create table if not exists public.applications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  company text not null,
  role text not null,
  location text,
  url text,
  job_description text,
  source text,
  applied_date date,
  status text not null default 'saved'
    check (status in ('saved', 'applied', 'interview', 'rejected', 'offer')),
  follow_up_date date,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.applications enable row level security;

drop policy if exists "Users can read own applications" on public.applications;
create policy "Users can read own applications"
on public.applications for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists "Users can create own applications" on public.applications;
create policy "Users can create own applications"
on public.applications for insert
to authenticated
with check (auth.uid() = user_id);

drop policy if exists "Users can update own applications" on public.applications;
create policy "Users can update own applications"
on public.applications for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "Users can delete own applications" on public.applications;
create policy "Users can delete own applications"
on public.applications for delete
to authenticated
using (auth.uid() = user_id);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists applications_set_updated_at on public.applications;
create trigger applications_set_updated_at
before update on public.applications
for each row
execute function public.set_updated_at();

create index if not exists applications_user_id_created_at_idx
on public.applications (user_id, created_at desc);

create table if not exists public.evidence_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  application_id uuid references public.applications(id) on delete cascade,
  skill text not null,
  skill_category text not null default 'tools'
    check (skill_category in ('frontend', 'backend', 'data', 'tools', 'language', 'process')),
  requirement text not null default 'required'
    check (requirement in ('required', 'nice-to-have')),
  evidence_type text not null default 'learning_task'
    check (evidence_type in ('project', 'work_experience', 'course', 'certification', 'learning_task', 'other')),
  evidence_summary text,
  confidence text not null default 'missing'
    check (confidence in ('direct', 'bridge', 'basic', 'learning', 'missing')),
  proof_url text,
  proof_task text,
  is_cv_ready boolean generated always as (
    confidence in ('direct', 'bridge', 'basic')
    and coalesce(length(trim(evidence_summary)), 0) > 0
    and coalesce(length(trim(proof_url)), 0) > 0
  ) stored,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, application_id, skill)
);

alter table public.evidence_items enable row level security;

drop policy if exists "Users can read own evidence" on public.evidence_items;
create policy "Users can read own evidence"
on public.evidence_items for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists "Users can create own evidence" on public.evidence_items;
create policy "Users can create own evidence"
on public.evidence_items for insert
to authenticated
with check (
  auth.uid() = user_id
  and (
    application_id is null
    or exists (
      select 1 from public.applications
      where applications.id = evidence_items.application_id
        and applications.user_id = auth.uid()
    )
  )
);

drop policy if exists "Users can update own evidence" on public.evidence_items;
create policy "Users can update own evidence"
on public.evidence_items for update
to authenticated
using (auth.uid() = user_id)
with check (
  auth.uid() = user_id
  and (
    application_id is null
    or exists (
      select 1 from public.applications
      where applications.id = evidence_items.application_id
        and applications.user_id = auth.uid()
    )
  )
);

drop policy if exists "Users can delete own evidence" on public.evidence_items;
create policy "Users can delete own evidence"
on public.evidence_items for delete
to authenticated
using (auth.uid() = user_id);

drop trigger if exists evidence_items_set_updated_at on public.evidence_items;
create trigger evidence_items_set_updated_at
before update on public.evidence_items
for each row
execute function public.set_updated_at();

create index if not exists evidence_items_user_application_idx
on public.evidence_items (user_id, application_id);

create table if not exists public.work_hour_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  work_date date not null,
  employer text,
  hours numeric(4,2) not null check (hours > 0 and hours <= 24),
  day_type text not null default 'full'
    check (day_type in ('full', 'half')),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.work_hour_logs enable row level security;

drop policy if exists "Users can read own work hour logs" on public.work_hour_logs;
create policy "Users can read own work hour logs"
on public.work_hour_logs for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists "Users can create own work hour logs" on public.work_hour_logs;
create policy "Users can create own work hour logs"
on public.work_hour_logs for insert
to authenticated
with check (auth.uid() = user_id);

drop policy if exists "Users can update own work hour logs" on public.work_hour_logs;
create policy "Users can update own work hour logs"
on public.work_hour_logs for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "Users can delete own work hour logs" on public.work_hour_logs;
create policy "Users can delete own work hour logs"
on public.work_hour_logs for delete
to authenticated
using (auth.uid() = user_id);

drop trigger if exists work_hour_logs_set_updated_at on public.work_hour_logs;
create trigger work_hour_logs_set_updated_at
before update on public.work_hour_logs
for each row
execute function public.set_updated_at();

create index if not exists work_hour_logs_user_date_idx
on public.work_hour_logs (user_id, work_date desc);

create table if not exists public.ai_provider_settings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  provider text not null
    check (provider in ('gemini', 'groq', 'openrouter')),
  encrypted_api_key text not null,
  key_hint text,
  enabled boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, provider)
);

alter table public.ai_provider_settings enable row level security;

drop policy if exists "Users can read own ai provider settings" on public.ai_provider_settings;
create policy "Users can read own ai provider settings"
on public.ai_provider_settings for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists "Users can create own ai provider settings" on public.ai_provider_settings;
create policy "Users can create own ai provider settings"
on public.ai_provider_settings for insert
to authenticated
with check (auth.uid() = user_id);

drop policy if exists "Users can update own ai provider settings" on public.ai_provider_settings;
create policy "Users can update own ai provider settings"
on public.ai_provider_settings for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "Users can delete own ai provider settings" on public.ai_provider_settings;
create policy "Users can delete own ai provider settings"
on public.ai_provider_settings for delete
to authenticated
using (auth.uid() = user_id);

drop trigger if exists ai_provider_settings_set_updated_at on public.ai_provider_settings;
create trigger ai_provider_settings_set_updated_at
before update on public.ai_provider_settings
for each row
execute function public.set_updated_at();

create index if not exists ai_provider_settings_user_enabled_idx
on public.ai_provider_settings (user_id, enabled);

create table if not exists public.learning_sprints (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  application_id uuid not null references public.applications(id) on delete cascade,
  skill text not null,
  duration_days smallint not null check (duration_days in (3, 7, 14)),
  status text not null default 'active'
    check (status in ('active', 'completed', 'archived')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, application_id, skill)
);

alter table public.learning_sprints enable row level security;

drop policy if exists "Users can read own learning sprints" on public.learning_sprints;
create policy "Users can read own learning sprints"
on public.learning_sprints for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists "Users can create own learning sprints" on public.learning_sprints;
create policy "Users can create own learning sprints"
on public.learning_sprints for insert
to authenticated
with check (
  auth.uid() = user_id
  and exists (
    select 1 from public.applications
    where applications.id = learning_sprints.application_id
      and applications.user_id = auth.uid()
  )
);

drop policy if exists "Users can update own learning sprints" on public.learning_sprints;
create policy "Users can update own learning sprints"
on public.learning_sprints for update
to authenticated
using (auth.uid() = user_id)
with check (
  auth.uid() = user_id
  and exists (
    select 1 from public.applications
    where applications.id = learning_sprints.application_id
      and applications.user_id = auth.uid()
  )
);

drop policy if exists "Users can delete own learning sprints" on public.learning_sprints;
create policy "Users can delete own learning sprints"
on public.learning_sprints for delete
to authenticated
using (auth.uid() = user_id);

drop trigger if exists learning_sprints_set_updated_at on public.learning_sprints;
create trigger learning_sprints_set_updated_at
before update on public.learning_sprints
for each row
execute function public.set_updated_at();

create index if not exists learning_sprints_user_application_idx
on public.learning_sprints (user_id, application_id);

create table if not exists public.learning_sprint_tasks (
  id uuid primary key default gen_random_uuid(),
  sprint_id uuid not null references public.learning_sprints(id) on delete cascade,
  task_order smallint not null check (task_order > 0),
  title text not null,
  proof_url text,
  proof_note text,
  completed boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (sprint_id, task_order),
  check (
    not completed
    or coalesce(length(trim(proof_url)), 0) > 0
    or coalesce(length(trim(proof_note)), 0) > 0
  )
);

alter table public.learning_sprint_tasks enable row level security;

drop policy if exists "Users can read own learning sprint tasks" on public.learning_sprint_tasks;
create policy "Users can read own learning sprint tasks"
on public.learning_sprint_tasks for select
to authenticated
using (
  exists (
    select 1 from public.learning_sprints
    where learning_sprints.id = learning_sprint_tasks.sprint_id
      and learning_sprints.user_id = auth.uid()
  )
);

drop policy if exists "Users can create own learning sprint tasks" on public.learning_sprint_tasks;
create policy "Users can create own learning sprint tasks"
on public.learning_sprint_tasks for insert
to authenticated
with check (
  exists (
    select 1 from public.learning_sprints
    where learning_sprints.id = learning_sprint_tasks.sprint_id
      and learning_sprints.user_id = auth.uid()
  )
);

drop policy if exists "Users can update own learning sprint tasks" on public.learning_sprint_tasks;
create policy "Users can update own learning sprint tasks"
on public.learning_sprint_tasks for update
to authenticated
using (
  exists (
    select 1 from public.learning_sprints
    where learning_sprints.id = learning_sprint_tasks.sprint_id
      and learning_sprints.user_id = auth.uid()
  )
)
with check (
  exists (
    select 1 from public.learning_sprints
    where learning_sprints.id = learning_sprint_tasks.sprint_id
      and learning_sprints.user_id = auth.uid()
  )
);

drop policy if exists "Users can delete own learning sprint tasks" on public.learning_sprint_tasks;
create policy "Users can delete own learning sprint tasks"
on public.learning_sprint_tasks for delete
to authenticated
using (
  exists (
    select 1 from public.learning_sprints
    where learning_sprints.id = learning_sprint_tasks.sprint_id
      and learning_sprints.user_id = auth.uid()
  )
);

drop trigger if exists learning_sprint_tasks_set_updated_at on public.learning_sprint_tasks;
create trigger learning_sprint_tasks_set_updated_at
before update on public.learning_sprint_tasks
for each row
execute function public.set_updated_at();

create index if not exists learning_sprint_tasks_sprint_order_idx
on public.learning_sprint_tasks (sprint_id, task_order);

create table if not exists public.user_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  current_city text,
  work_authorization text not null default 'unknown'
    check (work_authorization in ('unknown', 'student_visa', 'eu_citizen', 'job_seeker', 'work_permit', 'other')),
  languages text[] not null default '{}',
  target_roles text[] not null default '{}',
  profile_note text,
  cv_text text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.user_profiles enable row level security;

drop policy if exists "Users can read own profile" on public.user_profiles;
create policy "Users can read own profile"
on public.user_profiles for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists "Users can create own profile" on public.user_profiles;
create policy "Users can create own profile"
on public.user_profiles for insert
to authenticated
with check (auth.uid() = user_id);

drop policy if exists "Users can update own profile" on public.user_profiles;
create policy "Users can update own profile"
on public.user_profiles for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop trigger if exists user_profiles_set_updated_at on public.user_profiles;
create trigger user_profiles_set_updated_at
before update on public.user_profiles
for each row
execute function public.set_updated_at();
