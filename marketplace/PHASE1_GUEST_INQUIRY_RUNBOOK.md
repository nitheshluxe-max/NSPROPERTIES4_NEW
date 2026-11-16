# Phase 1 — Guest inquiry reliability and CRM verification

This branch includes the corrected CORS preflight handler from PR #43 and a clearer frontend network failure message.

## Required manual deployment (GitHub/Vercel do not deploy Edge Functions)

1. Supabase Dashboard → Edge Functions → `submit-guest-inquiry` → Code: replace `index.ts` with `marketplace/supabase/functions/submit-guest-inquiry/index.ts` from **this branch**, then deploy.
2. Settings → **Verify JWT with legacy secret: OFF**.
3. Edge Function Secrets: `ALLOWED_ORIGINS=https://nsproperties4.com,https://www.nsproperties4.com`, `TURNSTILE_SECRET_KEY`, `GUEST_INQUIRY_HASH_SECRET`. Never put private secrets in `VITE_*`.
4. Confirm Vercel production has `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `VITE_TURNSTILE_SITE_KEY`. Redeploy the frontend only if its environment variables changed.
5. Run the **read-only** checks below in the correct Supabase project. Apply `phase12_guest_inquiries.sql` only if prerequisites are missing, after reviewing schema and taking a backup.

```sql
select to_regclass('public.property_inquiries') as inquiries,
       to_regclass('public.guest_inquiry_limits') as rate_limits,
       to_regprocedure('public.consume_guest_inquiry_limit(text,integer)') as limiter;
select column_name, is_nullable from information_schema.columns
where table_schema='public' and table_name='property_inquiries' and column_name='user_id';
select count(*) as total_inquiries from public.property_inquiries;
```

## End-to-end acceptance test

1. In Chrome DevTools → Network, submit a new inquiry from `https://www.nsproperties4.com`. Turnstile must show success.
2. Confirm the `OPTIONS` request to `/functions/v1/submit-guest-inquiry` returns 2xx with `access-control-allow-origin: https://www.nsproperties4.com` and `access-control-allow-headers` covering `authorization, x-client-info, apikey, content-type`.
3. Confirm `POST` returns HTTP 201 with a nonempty `id`.
4. Confirm that ID exists in `public.property_inquiries` using SQL:
   `select id, property_id, status, created_at from public.property_inquiries order by created_at desc limit 10;`
5. Log into `#admin`, open Buyer Leads & Visits, and verify the same inquiry appears (admin data refreshes periodically).
6. Test invalid Turnstile, invalid property, missing fields and an unauthorized origin; none may create a record.

## Failure triage

- OPTIONS 403: compare request `Origin` to the exact `ALLOWED_ORIGINS` secret, including `www`; check Edge Function logs for `Guest inquiry rejected origin`.
- OPTIONS 401: verify legacy JWT verification is OFF.
- OPTIONS 2xx, POST 403: check Turnstile site key/secret pair and hostname.
- POST 404: check approved property ID/status.
- POST 503: check Edge Function secrets and Phase 12 RPC.
- POST 500: inspect sanitized Edge Function logs and database constraints. Do not log buyer phone/email or secret values.
- No OPTIONS/POST: check frontend Supabase project URL and browser extensions.

## Rollback

Frontend: revert this PR through GitHub/Vercel. Edge Function: redeploy the previously known working version from the Supabase dashboard. Do not roll back Phase 12 by dropping inquiry tables or data. No production database migration is executed by this PR.
