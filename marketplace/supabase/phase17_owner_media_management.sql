-- Phase 17. Apply after phase16. Existing public photo URLs remain reachable if known;
-- this migration changes published metadata only after admin approval.
create table if not exists public.property_media_edits (
 id uuid primary key default gen_random_uuid(),
 property_id uuid not null references public.properties(id) on delete cascade,
 user_id uuid not null references auth.users(id),
 status text not null default 'uploading' check(status in ('uploading','pending','approved','rejected')),
 replace_photos boolean not null default false,
 photo_paths text[] not null default '{}',
 replace_brochure boolean not null default false,
 brochure_path text,
 replace_floor_plan boolean not null default false,
 floor_plan_path text,
 created_at timestamptz not null default now(),
 reviewed_at timestamptz
);
create unique index if not exists property_media_one_pending on public.property_media_edits(property_id) where status='pending';
create index if not exists property_media_owner_idx on public.property_media_edits(user_id,created_at desc);
alter table public.property_media_edits enable row level security;
revoke all on public.property_media_edits from anon,authenticated;
grant select on public.property_media_edits to authenticated;
create policy "Owners and admins view media edits" on public.property_media_edits for select to authenticated using (
 user_id=(select auth.uid()) or exists(select 1 from public.admin_users a where a.user_id=(select auth.uid()))
);
create or replace function public.owner_start_media_edit(target_id uuid)
returns uuid language plpgsql security definer set search_path='' as $$
declare new_id uuid;
begin
 if (select auth.uid()) is null or not exists(select 1 from public.properties p where p.id=target_id and p.user_id=(select auth.uid())) then raise exception 'Not your property'; end if;
 if exists(select 1 from public.property_media_edits where property_id=target_id and status='pending') then raise exception 'A media update is awaiting review'; end if;
 insert into public.property_media_edits(property_id,user_id) values(target_id,(select auth.uid())) returning id into new_id;
 return new_id;
end $$;
revoke all on function public.owner_start_media_edit(uuid) from public,anon;
grant execute on function public.owner_start_media_edit(uuid) to authenticated;
-- A draft is only writable through this RPC. Every object must have been uploaded
-- under the owner/property/request prefix into the expected bucket.
create or replace function public.owner_submit_media_edit(request_id uuid, replace_photos boolean, photo_paths text[], replace_brochure boolean, brochure_path text, replace_floor_plan boolean, floor_plan_path text)
returns void language plpgsql security definer set search_path='' as $$
declare r public.property_media_edits%rowtype; prefix text; path text;
begin
 select * into r from public.property_media_edits where id=request_id and user_id=(select auth.uid()) and status='uploading' for update;
 if not found then raise exception 'Upload draft not found'; end if;
 if not (replace_photos or replace_brochure or replace_floor_plan) then raise exception 'Select media to change'; end if;
 if exists(select 1 from public.property_media_edits where property_id=r.property_id and status='pending') then raise exception 'A media update is awaiting review'; end if;
 prefix:=r.user_id::text||'/'||r.property_id::text||'/'||r.id::text||'/';
 if array_length(photo_paths,1)>12 then raise exception 'Maximum 12 photos'; end if;
 if not replace_photos and coalesce(array_length(photo_paths,1),0)>0 then raise exception 'Unexpected photos'; end if;
 if replace_photos and coalesce(array_length(photo_paths,1),0)=0 then raise exception 'Select at least one photo'; end if;
 if (not replace_brochure and brochure_path is not null) or (not replace_floor_plan and floor_plan_path is not null) then raise exception 'Unexpected document'; end if;
 foreach path in array coalesce(photo_paths,'{}'::text[]) loop
   if path not like prefix||'photo-%' or path !~ '\.(jpg|jpeg|png|webp)$' or not exists(select 1 from storage.objects o where o.bucket_id='property-photos' and o.name=path) then raise exception 'Invalid staged photo'; end if;
 end loop;
 if replace_brochure and brochure_path is not null and (brochure_path not like prefix||'brochure-%' or brochure_path !~ '\.pdf$' or not exists(select 1 from storage.objects o where o.bucket_id='property-brochures' and o.name=brochure_path)) then raise exception 'Invalid staged brochure'; end if;
 if replace_floor_plan and floor_plan_path is not null and (floor_plan_path not like prefix||'floor-plan-%' or floor_plan_path !~ '\.pdf$' or not exists(select 1 from storage.objects o where o.bucket_id='property-brochures' and o.name=floor_plan_path)) then raise exception 'Invalid staged floor plan'; end if;
 update public.property_media_edits set status='pending',replace_photos=owner_submit_media_edit.replace_photos,photo_paths=coalesce(owner_submit_media_edit.photo_paths,'{}'::text[]),replace_brochure=owner_submit_media_edit.replace_brochure,brochure_path=owner_submit_media_edit.brochure_path,replace_floor_plan=owner_submit_media_edit.replace_floor_plan,floor_plan_path=owner_submit_media_edit.floor_plan_path where id=request_id;
end $$;
revoke all on function public.owner_submit_media_edit(uuid,boolean,text[],boolean,text,boolean,text) from public,anon;
grant execute on function public.owner_submit_media_edit(uuid,boolean,text[],boolean,text,boolean,text) to authenticated;
create or replace function public.admin_review_media_edit(request_id uuid, approve boolean)
returns void language plpgsql security definer set search_path='' as $$
declare r public.property_media_edits%rowtype; path text; n int:=0;
begin
 if not exists(select 1 from public.admin_users where user_id=(select auth.uid())) then raise exception 'Admin only'; end if;
 select * into r from public.property_media_edits where id=request_id and status='pending' for update;
 if not found then raise exception 'Pending media edit not found'; end if;
 if approve then
  if r.replace_photos then
    delete from public.property_photos where property_id=r.property_id;
    foreach path in array r.photo_paths loop
      insert into public.property_photos(property_id,storage_path,sort_order) values(r.property_id,path,n);
      n:=n+1;
    end loop;
  end if;
  if r.replace_brochure then
    delete from public.property_brochures where property_id=r.property_id;
    delete from public.property_documents where property_id=r.property_id and document_type='brochure';
    if r.brochure_path is not null then insert into public.property_documents(property_id,storage_path,file_name,document_type) values(r.property_id,r.brochure_path,'Updated brochure.pdf','brochure'); end if;
  end if;
  if r.replace_floor_plan then
    delete from public.property_documents where property_id=r.property_id and document_type='floor-plan';
    if r.floor_plan_path is not null then insert into public.property_documents(property_id,storage_path,file_name,document_type) values(r.property_id,r.floor_plan_path,'Updated floor plan.pdf','floor-plan'); end if;
  end if;
 end if;
 update public.property_media_edits set status=case when approve then 'approved' else 'rejected' end,reviewed_at=now() where id=request_id;
end $$;
revoke all on function public.admin_review_media_edit(uuid,boolean) from public,anon;
grant execute on function public.admin_review_media_edit(uuid,boolean) to authenticated;
-- Staged PDFs are private and accessible only to their owner/admin until published.
drop policy if exists "Phase17 staged document upload" on storage.objects;
create policy "Phase17 staged document upload" on storage.objects for insert to authenticated with check (
 bucket_id='property-brochures' and exists (
 select 1 from public.property_media_edits e where e.status='uploading' and e.user_id=(select auth.uid())
 and name like e.user_id::text||'/'||e.property_id::text||'/'||e.id::text||'/%'
 )
);
drop policy if exists "Phase17 staged document read" on storage.objects;
create policy "Phase17 staged document read" on storage.objects for select to authenticated using (
 bucket_id='property-brochures' and exists (
 select 1 from public.property_media_edits e where e.status in ('uploading','pending') and
 name like e.user_id::text||'/'||e.property_id::text||'/'||e.id::text||'/%'
 and (e.user_id=(select auth.uid()) or exists(select 1 from public.admin_users a where a.user_id=(select auth.uid())))
 )
);
-- Prevent bypassing moderation by inserting photo metadata for approved properties.
drop policy if exists "Owners add photos to own property" on public.property_photos;
create policy "Owners add photos to own property" on public.property_photos for insert to authenticated with check (
 exists(select 1 from public.properties p where p.id=property_id and p.user_id=(select auth.uid()) and p.status='pending')
 and storage_path like (select auth.uid())::text||'/'||property_id::text||'/%'
);
-- Published files are not physically deleted during review. Schedule an admin-only
-- cleanup of superseded and abandoned storage objects after a retention period.
