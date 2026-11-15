-- Phase 11: fix admin_user_directory() return-column type mismatches.
-- Safe to rerun. Does not delete or modify any user, inquiry or property data.
-- PostgreSQL RETURN QUERY requires each returned column's type to match exactly.
create or replace function public.admin_user_directory()
returns table(
 id uuid, name text, email text, phone text, role text, city text,
 verified boolean, listings_count bigint, joined_date timestamptz
)
language plpgsql security definer set search_path = '' as $$
begin
 if (select auth.uid()) is null or not exists (
  select 1 from public.admin_users a where a.user_id = (select auth.uid())
 ) then
  raise exception 'Not authorized';
 end if;
 return query
 select
  u.id::uuid,
  coalesce(
   nullif(u.raw_user_meta_data->>'full_name',''),
   nullif(u.raw_user_meta_data->>'name',''),
   split_part(coalesce(u.email::text,''),'@',1),
   'User'
  )::text,
  coalesce(u.email::text,'')::text,
  coalesce(u.phone::text,u.raw_user_meta_data->>'phone','')::text,
  (case
   when a.user_id is not null then 'admin'
   when u.raw_user_meta_data->>'role' in ('owner','agent','builder','buyer')
    then u.raw_user_meta_data->>'role'
   else 'buyer'
  end)::text,
  coalesce(u.raw_user_meta_data->>'city','')::text,
  (u.email_confirmed_at is not null or u.phone_confirmed_at is not null)::boolean,
  (select count(*)::bigint from public.properties p where p.user_id=u.id),
  u.created_at::timestamptz
 from auth.users u
 left join public.admin_users a on a.user_id=u.id
 order by u.created_at desc
 limit 1000;
end $$;
revoke all on function public.admin_user_directory() from public,anon;
grant execute on function public.admin_user_directory() to authenticated;
