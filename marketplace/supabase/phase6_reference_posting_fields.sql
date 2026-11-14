-- Apply after phase2_admin_photos.sql and phase4_property_brochures.sql.
-- Preserve all fields from the reference four-step posting form without
-- changing the existing public_properties view or moderation RPC signatures.
alter table public.properties
  add column if not exists details jsonb not null default '{}'::jsonb;
comment on column public.properties.details is
  'Full reference posting form values, including seller details, map coordinates, specifications, amenities and media metadata. Private; not exposed by public_properties view.';

create table if not exists public.property_documents (
 id uuid primary key default gen_random_uuid(),
 property_id uuid not null references public.properties(id) on delete cascade,
 storage_path text not null unique,
 file_name text not null,
 document_type text not null check (document_type in ('brochure','floor-plan')),
 created_at timestamptz not null default now(),
 unique(property_id,document_type)
);
create index if not exists property_documents_property_idx on public.property_documents(property_id);
alter table public.property_documents enable row level security;
revoke all on public.property_documents from anon,authenticated;
grant insert,select on public.property_documents to authenticated;
grant select on public.property_documents to anon;

-- Keep owner and admin privileges limited to their own listings.
-- A SECURITY DEFINER helper prevents public clients from querying the
-- private properties table in media metadata policies.
create or replace function public.can_access_property_document(target_property_id uuid)
returns boolean language sql stable security definer set search_path = ''
as $$
 select exists (
  select 1 from public.properties p where p.id=target_property_id
  and (
   p.status='approved'
   or p.user_id=(select auth.uid())
   or exists(select 1 from public.admin_users a where a.user_id=(select auth.uid()))
  )
 );
$$;
revoke all on function public.can_access_property_document(uuid) from public;
grant execute on function public.can_access_property_document(uuid) to anon,authenticated;

drop policy if exists "Owners add property documents" on public.property_documents;
create policy "Owners add property documents" on public.property_documents for insert to authenticated with check (
 exists(select 1 from public.properties p where p.id=property_id and p.user_id=auth.uid() and p.status='pending')
 and storage_path like auth.uid()::text || '/' || property_id::text || '/%'
);
drop policy if exists "Authorized property documents visible" on public.property_documents;
create policy "Authorized property documents visible" on public.property_documents for select to anon,authenticated
using(public.can_access_property_document(property_id));

-- Existing property-brochures private bucket accepts both document types.
-- File paths remain user/property/random.pdf.
drop policy if exists "Authorized property document downloads" on storage.objects;
create policy "Authorized property document downloads" on storage.objects for select to anon,authenticated using (
 bucket_id='property-brochures'
 and exists(
  select 1 from public.property_documents d where d.storage_path=name
  and public.can_access_property_document(d.property_id)
 )
);
-- Existing policy "Approved brochure downloads" remains for legacy brochures.
