-- Run in Supabase SQL Editor after phase2 and phase6.
-- Admin-only update; do not grant direct UPDATE access to public.properties.
create or replace function public.admin_update_property(target_id uuid, changes jsonb)
returns void language plpgsql security definer set search_path = '' as $$
begin
  if (select auth.uid()) is null or not exists(
    select 1 from public.admin_users where user_id = (select auth.uid())
  ) then
    raise exception 'Not authorized to edit properties';
  end if;
  if changes is null or jsonb_typeof(changes) <> 'object' then
    raise exception 'Invalid property update';
  end if;
  update public.properties p set
    title = coalesce(nullif(btrim(changes->>'title'), ''), p.title),
    description = case when changes ? 'description' then changes->>'description' else p.description end,
    city = coalesce(nullif(btrim(changes->>'city'), ''), p.city),
    locality = coalesce(nullif(btrim(changes->>'locality'), ''), p.locality),
    price = case when changes ? 'price' then (changes->>'price')::numeric else p.price end,
    area_sqft = case when changes ? 'area_sqft' then nullif(changes->>'area_sqft', '')::numeric else p.area_sqft end,
    contact_phone = case when changes ? 'contact_phone' then changes->>'contact_phone' else p.contact_phone end,
    details = coalesce(p.details, '{}'::jsonb) || coalesce(changes->'details', '{}'::jsonb)
  where p.id = target_id;
  if not found then raise exception 'Property not found'; end if;
end $$;
revoke all on function public.admin_update_property(uuid,jsonb) from public, anon;
grant execute on function public.admin_update_property(uuid,jsonb) to authenticated;
