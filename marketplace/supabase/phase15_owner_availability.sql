-- Phase 15: Owner availability status via admin-reviewed changes. Run after phase14.
-- Recreates owner RPC to add availability and extends staged edit validation.
-- Replace owner request function to permit coordinates inside the existing private details JSON.
create or replace function public.owner_request_property_edit(target_id uuid, changes jsonb)
returns uuid language plpgsql security definer set search_path='' as $$
declare request_id uuid;
begin
 if (select auth.uid()) is null or not exists(select 1 from public.properties p where p.id=target_id and p.user_id=(select auth.uid())) then
   raise exception 'Property not found or not owned by you';
 end if;
 if changes is null or jsonb_typeof(changes)<>'object' or changes='{}'::jsonb or
    exists(select 1 from jsonb_object_keys(changes) k where k not in ('title','description','city','locality','price','area_sqft','contact_phone','publish_contact','latitude','longitude','availability')) then
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
 if changes ? 'availability' and (jsonb_typeof(changes->'availability')<>'string' or changes->>'availability' not in ('available','sold','rented','unavailable')) then raise exception 'Invalid availability'; end if;
 if (changes ? 'latitude') <> (changes ? 'longitude') then raise exception 'Latitude and longitude must be updated together'; end if;
 if changes ? 'latitude' and (jsonb_typeof(changes->'latitude')<>'number' or (changes->>'latitude')::numeric not between -90 and 90 or jsonb_typeof(changes->'longitude')<>'number' or (changes->>'longitude')::numeric not between -180 and 180) then raise exception 'Invalid map coordinates'; end if;
 insert into public.property_edit_requests(property_id,user_id,changes) values(target_id,(select auth.uid()),changes) returning id into request_id;
 return request_id;
end $$;
revoke all on function public.owner_request_property_edit(uuid,jsonb) from public,anon;
grant execute on function public.owner_request_property_edit(uuid,jsonb) to authenticated;

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
    publish_contact=case when r.changes ? 'publish_contact' then (r.changes->>'publish_contact')::boolean else p.publish_contact end,
    details=coalesce(p.details,'{}'::jsonb) || (case when r.changes ? 'latitude' then jsonb_build_object('latitude',r.changes->'latitude','longitude',r.changes->'longitude') else '{}'::jsonb end) || (case when r.changes ? 'availability' then jsonb_build_object('availability',r.changes->'availability') else '{}'::jsonb end)
   where p.id=r.property_id;
 end if;
 update public.property_edit_requests set status=case when approve then 'approved' else 'rejected' end,reviewed_at=now() where id=request_id;
end $$;
revoke all on function public.admin_review_property_edit(uuid,boolean) from public,anon;
grant execute on function public.admin_review_property_edit(uuid,boolean) to authenticated;

-- Return map pin from the same private details stored by the posting form.
-- DROP is required when changing the RETURNS TABLE signature; this function is owner-scoped.
drop function if exists public.owner_list_properties();
create function public.owner_list_properties()
returns table(id uuid,title text,description text,city text,locality text,price numeric,area_sqft numeric,contact_phone text,publish_contact boolean,status text,created_at timestamptz,edit_pending boolean,latitude numeric,longitude numeric,availability text)
language sql security definer set search_path='' as $$
 select p.id,p.title,p.description,p.city,p.locality,p.price,p.area_sqft,p.contact_phone,p.publish_contact,p.status,p.created_at,
 exists(select 1 from public.property_edit_requests r where r.property_id=p.id and r.status='pending'),
 case when (p.details->>'latitude') ~ '^[-+]?[0-9]+(\.[0-9]+)?$' then (p.details->>'latitude')::numeric else null end,
 case when (p.details->>'longitude') ~ '^[-+]?[0-9]+(\.[0-9]+)?
 from public.properties p where p.user_id=(select auth.uid()) order by p.created_at desc;
$$;
revoke all on function public.owner_list_properties() from public,anon;
grant execute on function public.owner_list_properties() to authenticated;
 then (p.details->>'longitude')::numeric else null end,
 coalesce(p.details->>'availability','available')
 from public.properties p where p.user_id=(select auth.uid()) order by p.created_at desc;
$$;
revoke all on function public.owner_list_properties() from public,anon;
grant execute on function public.owner_list_properties() to authenticated;
