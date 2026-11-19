-- Phase 18: curated Gold/Silver property presentation, admin controlled.
-- Tier indicates editorial placement only; it does not certify title, legal status or trustworthiness.
create table if not exists public.property_highlights (
 property_id uuid primary key references public.properties(id) on delete cascade,
 tier text not null check (tier in ('gold','silver')),
 updated_at timestamptz not null default now(),
 updated_by uuid references auth.users(id)
);
alter table public.property_highlights enable row level security;
revoke all on public.property_highlights from anon,authenticated;
-- Only approved property highlights are publicly visible, without curator identity.
create or replace view public.public_property_highlights with (security_invoker=false) as
 select h.property_id,h.tier from public.property_highlights h
 join public.properties p on p.id=h.property_id
 where p.status='approved';
alter view public.public_property_highlights owner to postgres;
grant select on public.public_property_highlights to anon,authenticated;
create or replace function public.admin_list_property_highlights()
returns table(property_id uuid,tier text)
language plpgsql security definer set search_path='' as $$
begin
 if not exists(select 1 from public.admin_users a where a.user_id=(select auth.uid())) then raise exception 'Admin only'; end if;
 return query select h.property_id,h.tier from public.property_highlights h;
end $$;
revoke all on function public.admin_list_property_highlights() from public,anon;
grant execute on function public.admin_list_property_highlights() to authenticated;
create or replace function public.admin_set_property_highlight(target_id uuid,new_tier text)
returns void language plpgsql security definer set search_path='' as $$
begin
 if not exists(select 1 from public.admin_users a where a.user_id=(select auth.uid())) then raise exception 'Admin only'; end if;
 if new_tier is not null and new_tier not in ('gold','silver') then raise exception 'Invalid tier'; end if;
 if not exists(select 1 from public.properties p where p.id=target_id and p.status='approved') then raise exception 'Only approved listings can be highlighted'; end if;
 if new_tier is null then delete from public.property_highlights where property_id=target_id;
 else
 insert into public.property_highlights(property_id,tier,updated_at,updated_by)
 values(target_id,new_tier,now(),(select auth.uid()))
 on conflict(property_id) do update set tier=excluded.tier,updated_at=now(),updated_by=excluded.updated_by;
 end if;
end $$;
revoke all on function public.admin_set_property_highlight(uuid,text) from public,anon;
grant execute on function public.admin_set_property_highlight(uuid,text) to authenticated;
