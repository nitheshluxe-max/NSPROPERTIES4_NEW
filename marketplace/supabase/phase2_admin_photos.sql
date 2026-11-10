-- Phase 2. Run in Supabase SQL Editor as the project owner.
-- Allow owners to retrieve their own inserted property IDs without exposing other owners' private contact details.
grant select on public.properties to authenticated;
drop policy if exists "Owners read own listings" on public.properties;
create policy "Owners read own listings" on public.properties
for select to authenticated using (user_id=auth.uid());

create table if not exists public.admin_users (
 user_id uuid primary key references auth.users(id) on delete cascade,
 created_at timestamptz not null default now()
);
alter table public.admin_users enable row level security;
revoke all on public.admin_users from anon, authenticated;
grant select on public.admin_users to authenticated;
drop policy if exists "Admins see own membership" on public.admin_users;
create policy "Admins see own membership" on public.admin_users for select to authenticated using (user_id=auth.uid());

create table if not exists public.property_photos (
 id uuid primary key default gen_random_uuid(),
 property_id uuid not null references public.properties(id) on delete cascade,
 storage_path text not null unique,
 sort_order integer not null default 0,
 created_at timestamptz not null default now()
);
create index if not exists property_photos_property_idx on public.property_photos(property_id,sort_order);
alter table public.property_photos enable row level security;
revoke all on public.property_photos from anon,authenticated;
grant insert,select on public.property_photos to authenticated;
grant select on public.property_photos to anon;
drop policy if exists "Owners add photos to own property" on public.property_photos;
create policy "Owners add photos to own property" on public.property_photos for insert to authenticated with check (
 exists(select 1 from public.properties p where p.id=property_id and p.user_id=auth.uid())
 and storage_path like auth.uid()::text || '/' || property_id::text || '/%'
);
drop policy if exists "Approved photos visible" on public.property_photos;
create policy "Approved photos visible" on public.property_photos for select to anon,authenticated using (
 exists(select 1 from public.properties p where p.id=property_id and p.status='approved')
 or exists(select 1 from public.properties p where p.id=property_id and p.user_id=auth.uid())
 or exists(select 1 from public.admin_users a where a.user_id=auth.uid())
);

-- Public bucket: uploaded images are accessible to anyone who has the object URL.
-- Do not upload private documents or images that must remain confidential.
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values ('property-photos','property-photos',true,5242880,array['image/jpeg','image/png','image/webp'])
on conflict (id) do update set public=true,file_size_limit=5242880,allowed_mime_types=array['image/jpeg','image/png','image/webp'];
drop policy if exists "Property owners upload photos" on storage.objects;
create policy "Property owners upload photos" on storage.objects for insert to authenticated with check (
 bucket_id='property-photos'
 and (storage.foldername(name))[1]=auth.uid()::text
 and exists (
  select 1 from public.properties p
  where p.id=((storage.foldername(name))[2])::uuid and p.user_id=auth.uid()
 )
);
-- Upload-only: no client overwrite or delete privileges.

create or replace function public.admin_list_properties()
returns table(id uuid,title text,city text,locality text,price numeric,status text,created_at timestamptz,contact_phone text)
language plpgsql security definer set search_path = '' as $$
begin
 if not exists(select 1 from public.admin_users where user_id=auth.uid()) then
  raise exception 'Not authorized';
 end if;
 return query select p.id,p.title,p.city,p.locality,p.price,p.status,p.created_at,p.contact_phone
 from public.properties p order by p.created_at desc limit 500;
end $$;
revoke all on function public.admin_list_properties() from public,anon;
grant execute on function public.admin_list_properties() to authenticated;

create or replace function public.admin_review_property(target_id uuid,new_status text)
returns void language plpgsql security definer set search_path = '' as $$
begin
 if not exists(select 1 from public.admin_users where user_id=auth.uid()) then
  raise exception 'Not authorized';
 end if;
 if new_status not in ('approved','rejected','pending') then
  raise exception 'Invalid status';
 end if;
 update public.properties set status=new_status where id=target_id;
 if not found then raise exception 'Property not found'; end if;
end $$;
revoke all on function public.admin_review_property(uuid,text) from public,anon;
grant execute on function public.admin_review_property(uuid,text) to authenticated;

-- IMPORTANT: after your own account has signed in, run this separately with YOUR email:
-- insert into public.admin_users(user_id)
-- select id from auth.users where email = 'YOUR_ADMIN_EMAIL@example.com'
-- on conflict (user_id) do nothing;
