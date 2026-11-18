-- Apply after schema.sql and phase6. Owner edits are staged; approved listing stays live.
create table if not exists public.property_edit_requests (
 id uuid primary key default gen_random_uuid(),
 property_id uuid not null references public.properties(id) on delete cascade,
 user_id uuid not null references auth.users(id) on delete cascade,
 changes jsonb not null,
 status text not null default 'pending' check (status in ('pending','approved','rejected')),
 created_at timestamptz not null default now(),
 reviewed_at timestamptz
);
create unique index if not exists one_pending_property_edit on public.property_edit_requests(property_id) where status='pending';
create index if not exists property_edit_requests_user_idx on public.property_edit_requests(user_id,created_at desc);
alter table public.property_edit_requests enable row level security;
revoke all on public.property_edit_requests from anon,authenticated;
create or replace function public.owner_list_properties()
returns table(id uuid,title text,description text,city text,locality text,price numeric,area_sqft numeric,contact_phone text,publish_contact boolean,status text,created_at timestamptz,edit_pending boolean)
language sql security definer set search_path='' as $$
 select p.id,p.title,p.description,p.city,p.locality,p.price,p.area_sqft,p.contact_phone,p.publish_contact,p.status,p.created_at,
 exists(select 1 from public.property_edit_requests r where r.property_id=p.id and r.status='pending')
 from public.properties p where p.user_id=(select auth.uid()) order by p.created_at desc
$$;
revoke all on function public.owner_list_properties() from public,anon;
grant execute on function public.owner_list_properties() to authenticated;
create or replace function public.owner_request_property_edit(target_id uuid, changes jsonb)
returns uuid language plpgsql security definer set search_path='' as $$
declare request_id uuid;
begin
 if (select auth.uid()) is null or not exists(select 1 from public.properties p where p.id=target_id and p.user_id=(select auth.uid())) then
   raise exception 'Property not found or not owned by you';
 end if;
 if changes is null or jsonb_typeof(changes)<>'object' or changes='{}'::jsonb or
    exists(select 1 from jsonb_object_keys(changes) k where k not in ('title','description','city','locality','price','area_sqft','contact_phone','publish_contact')) then
   raise exception 'Invalid edit fields';
 end if;
 if changes ? 'title' and (jsonb_typeof(changes->'title')<>'string' or length(btrim(changes->>'title')) not between 5 and 120) then raise exception 'Title must be 5–120 characters'; end if;
 if changes ? 'city' and (jsonb_typeof(changes->'city')<>'string' or length(btrim(changes->>'city'))<1) then raise exception 'City required'; end if;
 if changes ? 'locality' and (jsonb_typeof(changes->'locality')<>'string' or length(btrim(changes->>'locality'))<1) then raise exception 'Locality required'; end if;
 if changes ? 'price' and (jsonb_typeof(changes->'price')<>'number' or (changes->>'price')::numeric<=0) then raise exception 'Price must be positive'; end if;
 if changes ? 'area_sqft' and (jsonb_typeof(changes->'area_sqft') not in ('number','null') or (changes->>'area_sqft')::numeric<=0) then raise exception 'Area must be positive'; end if;
 if changes ? 'publish_contact' and jsonb_typeof(changes->'publish_contact')<>'boolean' then raise exception 'Invalid contact visibility'; end if;
 if changes ? 'contact_phone' and jsonb_typeof(changes->'contact_phone') not in ('string','null') then raise exception 'Invalid phone'; end if;
 if changes ? 'description' and jsonb_typeof(changes->'description') not in ('string','null') then raise exception 'Invalid description'; end if;
 insert into public.property_edit_requests(property_id,user_id,changes) values(target_id,(select auth.uid()),changes) returning id into request_id;
 return request_id;
end $$;
revoke all on function public.owner_request_property_edit(uuid,jsonb) from public,anon;
grant execute on function public.owner_request_property_edit(uuid,jsonb) to authenticated;
create or replace function public.admin_list_property_edits()
returns table(id uuid,property_id uuid,property_title text,changes jsonb,created_at timestamptz)
language plpgsql security definer set search_path='' as $$
begin
 if not exists(select 1 from public.admin_users where user_id=(select auth.uid())) then raise exception 'Admin only'; end if;
 return query select r.id,r.property_id,p.title,r.changes,r.created_at from public.property_edit_requests r join public.properties p on p.id=r.property_id where r.status='pending' order by r.created_at;
end $$;
revoke all on function public.admin_list_property_edits() from public,anon;
grant execute on function public.admin_list_property_edits() to authenticated;
create or replace function public.admin_review_property_edit(request_id uuid, approve boolean)
returns void language plpgsql security definer set search_path='' as $$
declare r public.property_edit_requests%rowtype;
begin
 if not exists(select 1 from public.admin_users where user_id=(select auth.uid())) then raise exception 'Admin only'; end if;
 select * into r from public.property_edit_requests where id=request_id and status='pending' for update;
 if not found then raise exception 'Pending edit request not found'; end if;
 if approve then
   update public.properties p set
    title=coalesce(r.changes->>'title',p.title),
    description=case when r.changes ? 'description' then r.changes->>'description' else p.description end,
    city=coalesce(r.changes->>'city',p.city),
    locality=coalesce(r.changes->>'locality',p.locality),
    price=case when r.changes ? 'price' then (r.changes->>'price')::numeric else p.price end,
    area_sqft=case when r.changes ? 'area_sqft' then (r.changes->>'area_sqft')::numeric else p.area_sqft end,
    contact_phone=case when r.changes ? 'contact_phone' then r.changes->>'contact_phone' else p.contact_phone end,
    publish_contact=case when r.changes ? 'publish_contact' then (r.changes->>'publish_contact')::boolean else p.publish_contact end
   where p.id=r.property_id;
 end if;
 update public.property_edit_requests set status=case when approve then 'approved' else 'rejected' end,reviewed_at=now() where id=request_id;
end $$;
revoke all on function public.admin_review_property_edit(uuid,boolean) from public,anon;
grant execute on function public.admin_review_property_edit(uuid,boolean) to authenticated;
