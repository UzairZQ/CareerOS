alter table public.applications
  add column if not exists source text,
  add column if not exists applied_date date;

create index if not exists applications_user_applied_date_idx
on public.applications (user_id, applied_date desc);
