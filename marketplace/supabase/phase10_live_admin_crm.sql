-- Phase 10: live admin CRM and session analytics. Run after phases 2 and 3.
-- Counts are browser sessions, NOT verified unique humans; no IP/location inference.
create table if not exists public.site_sessions (
  id uuid primary key,
  first_seen timestamptz not null default now(),
  last_seen timestamptz not null default now(),
  device text not null default 'desktop' check (device in ('mobile','desktop','tablet'))
);
alter table public.site_sessions enable row level security;
revoke all on public.site_sessions from public, anon, authenticated;

create or replace function public.record_site_session(session_id uuid, device_type text)
returns void language plpgsql security definer set search_path = '' as $$
begin
 if session_id is null or device_type not in ('mobile','desktop','tablet') then
  raise exception 'Invalid session';
 end if;
 insert into public.site_sessions(id,device) values(session_id,device_type)
 on conflict (id) do update set last_seen=now(),device=excluded.device
 where public.site_sessions.last_seen < now() - interval '20 seconds';
end $$;
revoke all on function public.record_site_session(uuid,text) from public;
grant execute on function public.record_site_session(uuid,text) to anon,authenticated;

create or replace function public.admin_site_analytics()
returns jsonb language plpgsql security definer set search_path = '' as $$
declare result jsonb;
begin
 if (select auth.uid()) is null or not exists(select 1 from public.admin_users where user_id=(select auth.uid())) then
  raise exception 'Not authorized';
 end if;
 select jsonb_build_object(
  'totalVisitors',count(*),
  'todayVisitors',count(*) filter(where first_seen >= date_trunc('day',now() at time zone 'UTC') at time zone 'UTC'),
  'activeNow',count(*) filter(where last_seen >= now()-interval '60 seconds'),
  'deviceBreakdown',jsonb_build_object(
    'mobile',coalesce(round(100.0*count(*) filter(where device='mobile' and last_seen>=now()-interval '60 seconds')/nullif(count(*) filter(where last_seen>=now()-interval '60 seconds'),0)),0),
    'desktop',coalesce(round(100.0*count(*) filter(where device='desktop' and last_seen>=now()-interval '60 seconds')/nullif(count(*) filter(where last_seen>=now()-interval '60 seconds'),0)),0),
    'tablet',coalesce(round(100.0*count(*) filter(where device='tablet' and last_seen>=now()-interval '60 seconds')/nullif(count(*) filter(where last_seen>=now()-interval '60 seconds'),0)),0)
  )
 ) into result from public.site_sessions;
 return result;
end $$;
revoke all on function public.admin_site_analytics() from public,anon;
grant execute on function public.admin_site_analytics() to authenticated;

-- Admin-only directory of actual Supabase Auth accounts; no seeded users.
create or replace function public.admin_user_directory()
returns table(id uuid,name text,email text,phone text,role text,city text,verified boolean,listings_count bigint,joined_date timestamptz)
language plpgsql security definer set search_path = '' as $$
begin
 if (select auth.uid()) is null or not exists(select 1 from public.admin_users where user_id=(select auth.uid())) then
  raise exception 'Not authorized';
 end if;
 return query select u.id,
  coalesce(nullif(u.raw_user_meta_data->>'full_name',''),nullif(u.raw_user_meta_data->>'name',''),split_part(coalesce(u.email,''),'@',1),'User'),
  coalesce(u.email,''),coalesce(u.phone,u.raw_user_meta_data->>'phone',''),
  case when a.user_id is not null then 'admin'
       when u.raw_user_meta_data->>'role' in ('owner','agent','builder','buyer') then u.raw_user_meta_data->>'role'
       else 'buyer' end,
  coalesce(u.raw_user_meta_data->>'city',''),
  (u.email_confirmed_at is not null or u.phone_confirmed_at is not null),
  (select count(*) from public.properties p where p.user_id=u.id),
  u.created_at
 from auth.users u left join public.admin_users a on a.user_id=u.id
 order by u.created_at desc limit 1000;
end $$;
revoke all on function public.admin_user_directory() from public,anon;
grant execute on function public.admin_user_directory() to authenticated;
