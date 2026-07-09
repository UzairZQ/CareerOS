alter table public.user_profiles
  add column if not exists cv_text text;
