-- Phase 12: guest inquiries through Edge Function only.
-- Existing signed-in inquiries and admin CRM are preserved.
alter table public.property_inquiries alter column user_id drop not null;
create table if not exists public.guest_inquiry_limits (
  key_hash text primary key,
  window_start timestamptz not null default now(),
  attempts integer not null default 0
);
alter table public.guest_inquiry_limits enable row level security;
revoke all on public.guest_inquiry_limits from public,anon,authenticated;
-- Used exclusively by the Edge Function with its service-role credential.
create or replace function public.consume_guest_inquiry_limit(bucket_key text, max_attempts integer default 5)
returns boolean language plpgsql security definer set search_path = '' as $$
declare allowed boolean;
begin
 if current_setting('request.jwt.claim.role',true) is distinct from 'service_role' then
   raise exception 'Service role only';
 end if;
 if bucket_key !~ '^[a-f0-9]{64}$' or max_attempts < 1 or max_attempts > 20 then
   raise exception 'Invalid limit parameters';
 end if;
 insert into public.guest_inquiry_limits as lim (key_hash,window_start,attempts)
 values (bucket_key,now(),1)
 on conflict (key_hash) do update set
   attempts = case when lim.window_start < now()-interval '1 hour' then 1 else lim.attempts+1 end,
   window_start = case when lim.window_start < now()-interval '1 hour' then now() else lim.window_start end
 returning attempts <= max_attempts into allowed;
 return allowed;
end $$;
revoke all on function public.consume_guest_inquiry_limit(text,integer) from public,anon,authenticated;
grant execute on function public.consume_guest_inquiry_limit(text,integer) to service_role;
-- No anonymous table insert policy is added. The Edge Function uses service role
-- only after CAPTCHA, rate limit, validation, and approved-listing checks.
