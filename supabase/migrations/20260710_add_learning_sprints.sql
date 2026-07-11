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
on public.learning_sprints for select to authenticated
using (auth.uid() = user_id);

drop policy if exists "Users can create own learning sprints" on public.learning_sprints;
create policy "Users can create own learning sprints"
on public.learning_sprints for insert to authenticated
with check (auth.uid() = user_id);

drop policy if exists "Users can update own learning sprints" on public.learning_sprints;
create policy "Users can update own learning sprints"
on public.learning_sprints for update to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "Users can delete own learning sprints" on public.learning_sprints;
create policy "Users can delete own learning sprints"
on public.learning_sprints for delete to authenticated
using (auth.uid() = user_id);

drop trigger if exists learning_sprints_set_updated_at on public.learning_sprints;
create trigger learning_sprints_set_updated_at
before update on public.learning_sprints
for each row execute function public.set_updated_at();

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
on public.learning_sprint_tasks for select to authenticated
using (
  exists (
    select 1 from public.learning_sprints
    where learning_sprints.id = learning_sprint_tasks.sprint_id
      and learning_sprints.user_id = auth.uid()
  )
);

drop policy if exists "Users can create own learning sprint tasks" on public.learning_sprint_tasks;
create policy "Users can create own learning sprint tasks"
on public.learning_sprint_tasks for insert to authenticated
with check (
  exists (
    select 1 from public.learning_sprints
    where learning_sprints.id = learning_sprint_tasks.sprint_id
      and learning_sprints.user_id = auth.uid()
  )
);

drop policy if exists "Users can update own learning sprint tasks" on public.learning_sprint_tasks;
create policy "Users can update own learning sprint tasks"
on public.learning_sprint_tasks for update to authenticated
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
on public.learning_sprint_tasks for delete to authenticated
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
for each row execute function public.set_updated_at();

create index if not exists learning_sprint_tasks_sprint_order_idx
on public.learning_sprint_tasks (sprint_id, task_order);
