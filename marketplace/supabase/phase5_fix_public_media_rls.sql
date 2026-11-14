-- Run in Supabase SQL Editor as project owner.
-- Fix: public media RLS must not directly query restricted public.properties as anon.
create or replace function public.can_view_property_media(target_property_id uuid)
returns boolean language sql stable security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.properties p
    where p.id = target_property_id
      and (
        p.status = 'approved'
        or p.user_id = (select auth.uid())
        or exists (
          select 1 from public.admin_users a
          where a.user_id = (select auth.uid())
        )
      )
  );
$$;
revoke all on function public.can_view_property_media(uuid) from public;
grant execute on function public.can_view_property_media(uuid) to anon, authenticated;

drop policy if exists "Approved photos visible" on public.property_photos;
create policy "Approved photos visible"
on public.property_photos for select to anon, authenticated
using (public.can_view_property_media(property_id));

drop policy if exists "Approved brochures visible" on public.property_brochures;
create policy "Approved brochures visible"
on public.property_brochures for select to anon, authenticated
using (public.can_view_property_media(property_id));

drop policy if exists "Approved brochure downloads" on storage.objects;
create policy "Approved brochure downloads"
on storage.objects for select to anon, authenticated
using (
  bucket_id = 'property-brochures'
  and exists (
    select 1 from public.property_brochures b
    where b.storage_path = name
      and public.can_view_property_media(b.property_id)
  )
);
-- Keep the properties table private; no SELECT grant to anon is needed.
