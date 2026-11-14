-- Run in Supabase SQL Editor after marketplace/supabase/phase2_admin_photos.sql.
-- Media metadata is only publicly listed for approved properties.
create table if not exists public.property_brochures (
  id uuid primary key default gen_random_uuid(),
  property_id uuid not null references public.properties(id) on delete cascade,
  storage_path text not null unique,
  file_name text not null,
  created_at timestamptz not null default now()
);
create unique index if not exists property_brochures_one_per_property on public.property_brochures(property_id);
alter table public.property_brochures enable row level security;
revoke all on public.property_brochures from anon, authenticated;
grant select on public.property_brochures to anon, authenticated;
grant insert on public.property_brochures to authenticated;
drop policy if exists "Approved brochures visible" on public.property_brochures;
create policy "Approved brochures visible" on public.property_brochures for select to anon,authenticated using (
  exists(select 1 from public.properties p where p.id=property_id and p.status='approved')
  or exists(select 1 from public.properties p where p.id=property_id and p.user_id=auth.uid())
  or exists(select 1 from public.admin_users a where a.user_id=auth.uid())
);
drop policy if exists "Owners attach brochures" on public.property_brochures;
create policy "Owners attach brochures" on public.property_brochures for insert to authenticated with check (
  exists(select 1 from public.properties p where p.id=property_id and p.user_id=auth.uid() and p.status='pending')
  and storage_path like auth.uid()::text || '/' || property_id::text || '/%'
);
-- Private bucket: use signed download links issued only after approval.
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values ('property-brochures','property-brochures',false,10485760,array['application/pdf'])
on conflict (id) do update set public=false,file_size_limit=10485760,allowed_mime_types=array['application/pdf'];
drop policy if exists "Owners upload property brochures" on storage.objects;
create policy "Owners upload property brochures" on storage.objects for insert to authenticated with check (
 bucket_id='property-brochures'
 and (storage.foldername(name))[1]=auth.uid()::text
 and exists(select 1 from public.properties p
  where p.id=((storage.foldername(name))[2])::uuid and p.user_id=auth.uid() and p.status='pending')
);
-- A SECURITY DEFINER RPC checks approval before issuing a short-lived signed URL.
-- Supabase Storage signed URLs require a storage API call, not raw SQL. Instead,
-- permit Storage SELECT only for approved listings, owners, and admins.
drop policy if exists "Approved brochure downloads" on storage.objects;
create policy "Approved brochure downloads" on storage.objects for select to anon,authenticated using (
 bucket_id='property-brochures' and exists (
  select 1 from public.property_brochures b join public.properties p on p.id=b.property_id
  where b.storage_path=name and (
    p.status='approved' or p.user_id=auth.uid()
    or exists(select 1 from public.admin_users a where a.user_id=auth.uid())
  )
 )
);
-- Existing photo bucket is public; URLs can be accessed if known before approval.
-- Only approved photos are shown in the marketplace interface.
