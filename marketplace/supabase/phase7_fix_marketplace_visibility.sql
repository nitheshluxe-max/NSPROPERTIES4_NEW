-- Run as Supabase project owner AFTER schema.sql, phase2, phase4, phase5 and phase6.
-- Repairs public marketplace access without exposing private or pending listings.
create or replace function public.can_view_property_media(target_property_id uuid)
returns boolean language sql stable security definer set search_path = ''
as $$
  select exists(
    select 1 from public.properties p where p.id=target_property_id
      and (p.status='approved' or p.user_id=(select auth.uid())
        or exists(select 1 from public.admin_users a where a.user_id=(select auth.uid())))
  );
$$;
revoke all on function public.can_view_property_media(uuid) from public;
grant execute on function public.can_view_property_media(uuid) to anon,authenticated;

drop policy if exists "Approved photos visible" on public.property_photos;
create policy "Approved photos visible" on public.property_photos
for select to anon,authenticated using (public.can_view_property_media(property_id));
drop policy if exists "Approved brochures visible" on public.property_brochures;
create policy "Approved brochures visible" on public.property_brochures
for select to anon,authenticated using (public.can_view_property_media(property_id));

-- Public listing view runs as its owner, not the anonymous API caller.
-- The view contains only approved properties and masks unconsented phone numbers.
create or replace view public.public_properties with (security_invoker=false) as
 select id,title,description,city,locality,purpose,property_type,price,area_sqft,
 case when publish_contact then contact_phone else null end as contact_phone,
 publish_contact,status,created_at
 from public.properties where status='approved';
alter view public.public_properties owner to postgres;
grant usage on schema public to anon,authenticated;
grant select on public.public_properties to anon,authenticated;

-- Never grant direct anonymous SELECT to the private base table.
revoke select on public.properties from anon;
-- Signed-in owners still need SELECT for insert(...).select('id') to work.
grant select on public.properties to authenticated;
drop policy if exists "Owners read own listings" on public.properties;
create policy "Owners read own listings" on public.properties for select to authenticated
using (user_id=(select auth.uid()));

-- Verify from a signed-out browser after running:
-- SELECT COUNT(*) FROM public.public_properties;
-- Only approved rows are expected. Pending/rejected listings remain hidden.
