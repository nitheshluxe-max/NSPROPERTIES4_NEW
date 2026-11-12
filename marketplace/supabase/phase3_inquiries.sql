-- Run AFTER schema.sql and phase2_admin_photos.sql in Supabase SQL Editor.
-- An inquiry is stored only for an approved listing and a signed-in user.
create table if not exists public.property_inquiries (
 id uuid primary key default gen_random_uuid(),
 property_id uuid not null references public.properties(id) on delete cascade,
 user_id uuid not null references auth.users(id) on delete cascade,
 user_name text not null check (char_length(trim(user_name)) between 2 and 120),
 user_phone text not null check (char_length(user_phone) between 8 and 20),
 user_email text,
 inquiry_type text not null check (inquiry_type in ('callback','site_visit','whatsapp','price_sheet')),
 scheduled_date text,
 message text not null default '',
 status text not null default 'new' check (status in ('new','contacted','visit_scheduled','closed')),
 created_at timestamptz not null default now()
);
create index if not exists property_inquiries_created_idx on public.property_inquiries(created_at desc);
alter table public.property_inquiries enable row level security;
revoke all on public.property_inquiries from anon, authenticated;
grant insert,select on public.property_inquiries to authenticated;

drop policy if exists "Signed-in users create own approved property inquiries" on public.property_inquiries;
create policy "Signed-in users create own approved property inquiries"
on public.property_inquiries for insert to authenticated
with check (
 user_id = (select auth.uid()) and
 exists (
  select 1 from public.public_properties p
  where p.id = property_id and p.status = 'approved'
 )
);

drop policy if exists "Users read own inquiries" on public.property_inquiries;
create policy "Users read own inquiries"
on public.property_inquiries for select to authenticated
using (user_id = (select auth.uid()));

create or replace function public.admin_list_inquiries()
returns setof public.property_inquiries
language plpgsql security definer set search_path = ''
as $$
begin
 if not exists (select 1 from public.admin_users where user_id=auth.uid()) then
  raise exception 'Not authorized';
 end if;
 return query select * from public.property_inquiries order by created_at desc limit 500;
end $$;
revoke all on function public.admin_list_inquiries() from public,anon;
grant execute on function public.admin_list_inquiries() to authenticated;

create or replace function public.admin_set_inquiry_status(target_id uuid, new_status text)
returns void language plpgsql security definer set search_path = ''
as $$
begin
 if not exists (select 1 from public.admin_users where user_id=auth.uid()) then
  raise exception 'Not authorized';
 end if;
 if new_status not in ('new','contacted','visit_scheduled','closed') then
  raise exception 'Invalid status';
 end if;
 update public.property_inquiries set status = new_status where id = target_id;
 if not found then raise exception 'Inquiry not found'; end if;
end $$;
revoke all on function public.admin_set_inquiry_status(uuid,text) from public,anon;
grant execute on function public.admin_set_inquiry_status(uuid,text) to authenticated;
