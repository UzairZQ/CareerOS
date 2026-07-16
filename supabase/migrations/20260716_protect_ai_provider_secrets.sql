-- Encrypted provider keys must never be readable through the authenticated
-- Supabase REST client. Server routes use the service-role client after
-- authenticating the current user.
drop policy if exists "Users can read own ai provider settings" on public.ai_provider_settings;
