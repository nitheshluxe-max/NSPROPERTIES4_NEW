-- Run in Supabase SQL Editor. Keep this schema separate from the legacy MySQL schema.
create extension if not exists pgcrypto;
create table if not exists public.site_admins (
 user_id uuid primary key references auth.users(id) on delete cascade,
 created_at timestamptz not null default now()
);
create table if not exists public.properties (
 id bigint generated always as identity primary key,
 title text not null,
 listing_type text not null check (listing_type in ('buy','rent','commercial','new-project')),
 category text not null,
 locality text not null,
 city text not null,
 address text not null,
 state text not null,
 pincode text not null,
 price numeric(15,2) not null check(price>0),
 area numeric(12,2) not null check(area>0),
 bhk integer not null default 0,
 bathrooms integer not null default 0,
 availability text not null default 'Ready to Move',
 description text not null,
 amenities jsonb not null default '[]'::jsonb,
 image_urls jsonb not null default '[]'::jsonb,
 contact_name text not null,
 contact_phone text not null,
 contact_email text not null,
 status text not null default 'pending' check(status in ('pending','approved','rejected')),
 created_at timestamptz not null default now(),
 approved_at timestamptz
);
create table if not exists public.enquiries (
 id bigint generated always as identity primary key,
 property_id bigint not null references public.properties(id) on delete cascade,
 name text not null,
 phone text not null,
 email text,
 enquiry_type text not null default 'Property Enquiry',
 message text,
 created_at timestamptz not null default now()
);
create index if not exists properties_status_idx on public.properties(status,created_at desc);
create index if not exists enquiries_created_idx on public.enquiries(created_at desc);
alter table public.site_admins enable row level security;
alter table public.properties enable row level security;
alter table public.enquiries enable row level security;
revoke all on public.site_admins,public.properties,public.enquiries from anon,authenticated;
grant select on public.properties to authenticated;\n-- Admins can read owner contact details; ordinary authenticated users are limited by row policies.
grant select,update on public.properties to authenticated;
grant select on public.enquiries to authenticated;
grant select on public.site_admins to authenticated;
create or replace function public.is_site_admin() returns boolean
language sql stable security definer set search_path='' as $$
 select exists(select 1 from public.site_admins where user_id=(select auth.uid()));
$$;
revoke all on function public.is_site_admin() from public;
grant execute on function public.is_site_admin() to authenticated;
drop policy if exists "approved properties public" on public.properties;
create policy "approved properties public" on public.properties for select to anon using (status='approved');
drop policy if exists "admin property select" on public.properties;
create policy "admin property select" on public.properties for select to authenticated using (public.is_site_admin() or status='approved');
drop policy if exists "admin property update" on public.properties;
create policy "admin property update" on public.properties for update to authenticated using(public.is_site_admin()) with check(public.is_site_admin());
drop policy if exists "admin enquiry select" on public.enquiries;
create policy "admin enquiry select" on public.enquiries for select to authenticated using(public.is_site_admin());
drop policy if exists "admin identity" on public.site_admins;
create policy "admin identity" on public.site_admins for select to authenticated using(user_id=(select auth.uid()));
-- Safe public projection: never expose property owner phone, email or full address.
create or replace view public.public_properties with (security_invoker=true) as
 select id,title,listing_type,category,locality,city,price,area,bhk,bathrooms,availability,description,amenities,image_urls,created_at
 from public.properties where status='approved';
grant select (id,title,listing_type,category,locality,city,price,area,bhk,bathrooms,availability,description,amenities,image_urls,created_at,status) on public.properties to anon;
grant select on public.public_properties to anon,authenticated;
-- Anonymous users cannot directly insert into tables. Validated SECURITY DEFINER functions accept submissions.
create or replace function public.submit_property(payload jsonb) returns bigint
language plpgsql security definer set search_path='' as $$
declare v_id bigint; v_type text;
begin
 if payload is null or jsonb_typeof(payload)<>'object' then raise exception 'Invalid submission'; end if;
 v_type:=case payload->>'listingType' when 'Sell' then 'buy' when 'Rent' then 'rent' when 'Lease' then 'rent' else null end;
 if v_type is null or length(trim(coalesce(payload->>'title',''))) not between 3 and 120
 or length(trim(coalesce(payload->>'description',''))) not between 10 and 2000
 or length(trim(coalesce(payload->>'address',''))) not between 3 and 500
 or length(trim(coalesce(payload->>'locality',''))) not between 2 and 120
 or length(trim(coalesce(payload->>'city',''))) not between 2 and 120
 or length(trim(coalesce(payload->>'state',''))) not between 2 and 100
 or length(trim(coalesce(payload->>'propertyType',''))) not between 2 and 80
 or coalesce(payload->>'pincode','') !~ '^[0-9]{6}$'
 or coalesce(payload->>'contactPhone','') !~ '^[0-9]{10}$'
 or length(trim(coalesce(payload->>'contactName',''))) not between 2 and 120
 or length(coalesce(payload->>'contactEmail',''))>254
 or coalesce(payload->>'contactEmail','') !~ '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$'
 or coalesce(payload->>'price','') !~ '^[0-9]{1,13}(\.[0-9]{1,2})?$'
 or coalesce(payload->>'area','') !~ '^[0-9]{1,9}(\.[0-9]{1,2})?$'
 or (payload->>'price')::numeric<=0 or (payload->>'area')::numeric<=0
 or coalesce(payload->>'bhk','') !~ '^(|Not applicable|[1-9][0-9]* BHK|5\+ BHK)$'
 or coalesce(payload->>'bathrooms','0') !~ '^[0-9]{0,2}$'
 or jsonb_typeof(coalesce(payload->'amenities','[]'::jsonb))<>'array'
 or jsonb_array_length(coalesce(payload->'amenities','[]'::jsonb))>40
 then raise exception 'Please check the property details'; end if;
 insert into public.properties(title,listing_type,category,locality,city,address,state,pincode,price,area,bhk,bathrooms,availability,description,amenities,contact_name,contact_phone,contact_email)
 values(trim(payload->>'title'),v_type,case
 when payload->>'propertyType'='Apartment / Flat' then 'apartment'
 when payload->>'propertyType'='Independent House' then 'independent house'
 when payload->>'propertyType'='Villa' then 'villa'
 when payload->>'propertyType' in ('Residential Plot') then 'plot'
 when payload->>'propertyType' in ('Office Space','Shop / Retail Space','Warehouse') then 'commercial'
 else lower(trim(payload->>'propertyType')) end,trim(payload->>'locality'),trim(payload->>'city'),trim(payload->>'address'),trim(payload->>'state'),payload->>'pincode',(payload->>'price')::numeric,(payload->>'area')::numeric,
 case when payload->>'bhk' like '5+%' then 5 else coalesce(nullif(substring(payload->>'bhk' from '^[0-9]+'),'')::integer,0) end,
 coalesce(nullif(payload->>'bathrooms','')::integer,0),
 left(coalesce(payload->>'availability','Ready to Move'),80),trim(payload->>'description'),coalesce(payload->'amenities','[]'::jsonb),
 trim(payload->>'contactName'),payload->>'contactPhone',trim(payload->>'contactEmail'))
 returning id into v_id;
 return v_id;
end; $$;
create or replace function public.submit_enquiry(payload jsonb) returns bigint
language plpgsql security definer set search_path='' as $$
declare v_id bigint; v_property bigint;
begin
 if payload is null or jsonb_typeof(payload)<>'object'
 or coalesce(payload->>'propertyId','') !~ '^[0-9]{1,18}$'
 or length(trim(coalesce(payload->>'name',''))) not between 2 and 120
 or coalesce(payload->>'phone','') !~ '^[0-9]{10}$'
 or length(coalesce(payload->>'email',''))>254
 or (coalesce(payload->>'email','')<>'' and payload->>'email' !~ '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$')
 or length(coalesce(payload->>'message',''))>2000
 then raise exception 'Invalid enquiry'; end if;
 v_property:=(payload->>'propertyId')::bigint;
 if not exists(select 1 from public.properties where id=v_property and status='approved') then raise exception 'Property unavailable'; end if;
 insert into public.enquiries(property_id,name,phone,email,enquiry_type,message)
 values(v_property,trim(payload->>'name'),payload->>'phone',nullif(payload->>'email',''),left(coalesce(payload->>'type','Property Enquiry'),60),coalesce(payload->>'message',''))
 returning id into v_id;
 return v_id;
end; $$;
revoke all on function public.submit_property(jsonb),public.submit_enquiry(jsonb) from public;
grant execute on function public.submit_property(jsonb),public.submit_enquiry(jsonb) to anon,authenticated;
-- After creating a Supabase Auth user, assign admin role manually:
-- insert into public.site_admins(user_id) values ('YOUR-AUTH-USER-UUID');
-- Use a strong password and enable MFA for admin accounts.
