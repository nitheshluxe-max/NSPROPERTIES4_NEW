-- Run in Supabase SQL Editor after phase8_admin_edit_property.sql.
-- Preserve private seller contact data. Publish only non-sensitive property details.
create or replace view public.public_properties with (security_invoker=false) as
 select id,title,description,city,locality,purpose,property_type,price,area_sqft,
 case when publish_contact then contact_phone else null end as contact_phone,
 publish_contact,status,created_at,
 nullif(details->>'latitude','')::numeric as latitude,
 nullif(details->>'longitude','')::numeric as longitude,
 nullif(details->>'bedrooms','')::numeric as bedrooms,
 nullif(details->>'bathrooms','')::numeric as bathrooms,
 nullif(details->>'balconies','')::numeric as balconies,
 coalesce((details->>'featured')::boolean,false) as featured,
 coalesce((details->>'verified')::boolean,false) as verified
 from public.properties where status='approved';
alter view public.public_properties owner to postgres;
grant select on public.public_properties to anon,authenticated;
