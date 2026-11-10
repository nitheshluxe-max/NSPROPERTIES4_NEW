-- Run in Supabase SQL Editor. Public contacts require explicit listing-level consent.
create extension if not exists pgcrypto;
create table if not exists public.properties (
 id uuid primary key default gen_random_uuid(),
 user_id uuid not null references auth.users(id) on delete cascade,
 title text not null check(length(title) between 5 and 120),
 description text,
 city text not null,
 locality text not null,
 purpose text not null check(purpose in ('sale','rent','lease')),
 property_type text not null check(property_type in ('apartment','house','plot','commercial','pg')),
 price numeric(14,2) not null check(price>0),
 area_sqft numeric(12,2) check(area_sqft>0),
 contact_phone text,
 publish_contact boolean not null default false,
 status text not null default 'pending' check(status in ('pending','approved','rejected')),
 created_at timestamptz not null default now()
);
create index if not exists properties_search_idx on public.properties(status,city,purpose,property_type,created_at desc);
alter table public.properties enable row level security;
-- Anonymous visitors may only read approved listings. Nonconsenting phone numbers
-- are not exposed through this public view.
create or replace view public.public_properties with (security_invoker=false) as
 select id,title,description,city,locality,purpose,property_type,price,area_sqft,
 case when publish_contact then contact_phone else null end as contact_phone,
 publish_contact,status,created_at from public.properties where status='approved';
-- Deny direct public table SELECT: expose only the sanitized view.
revoke all on public.properties from anon,authenticated;
grant select on public.public_properties to anon,authenticated;
grant insert on public.properties to authenticated;
drop policy if exists "Users insert own pending listings" on public.properties;
create policy "Users insert own pending listings" on public.properties for insert to authenticated
 with check(auth.uid()=user_id and status='pending');
-- View owner executes the approved-only projection; direct table reads remain revoked.
-- Admin review should use Supabase dashboard or a separately secured server function.
-- No client-side approval permissions are granted.
