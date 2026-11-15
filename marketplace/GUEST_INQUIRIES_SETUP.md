# Secure guest buyer inquiries — deployment checklist

This feature requires **both** a Supabase SQL migration and a deployed Edge Function. A GitHub/Vercel deploy alone does not install either.

1. In the **correct production Supabase project**, run `marketplace/supabase/phase12_guest_inquiries.sql` after phase3. Existing inquiries are preserved; `user_id` becomes nullable for guest leads.
2. Create a free **Cloudflare Turnstile** widget for your production domain (`nsproperties4.com`, plus any actual Vercel domain you use). Copy the **site key** and **secret key**.
3. In Supabase **Edge Functions**, deploy the function from `marketplace/supabase/functions/submit-guest-inquiry/index.ts` as `submit-guest-inquiry` with **Verify JWT disabled**. CLI equivalent from the repository root: `supabase functions deploy submit-guest-inquiry --no-verify-jwt --project-ref YOUR_PROJECT_REF --workdir marketplace/supabase` (verify your CLI workdir support; alternatively place function in a conventional `supabase/functions` folder before deploying).
4. Configure Edge Function secrets: `TURNSTILE_SECRET_KEY`, `GUEST_INQUIRY_HASH_SECRET` (long random string), `ALLOWED_ORIGINS` (comma-separated **exact** origins, e.g. `https://nsproperties4.com,https://www.nsproperties4.com`). Supabase provides `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` in hosted functions. **Never** put service-role or Turnstile secret in Vercel public Vite variables.
5. In Vercel project Environment Variables add `VITE_TURNSTILE_SITE_KEY` (public Turnstile site key), for Production (and Preview if preview domain configured in Turnstile/ALLOWED_ORIGINS). Redeploy the website.
6. Test **logged out**: approved property → Connect with Seller → Request Call / Book Site Visit → solve CAPTCHA → submit. Success must only appear after the Edge Function returns a saved inquiry ID.
7. Verify in Supabase SQL Editor:
   `select id, property_id, user_id, user_name, inquiry_type, status, created_at from public.property_inquiries order by created_at desc limit 10;`
   Guest records have `user_id IS NULL`. Admin CRM loads them through `admin_list_inquiries()`.
8. Check Edge Function logs if submissions fail. Errors are displayed in the contact form. Missing/invalid captcha, disallowed origin, incorrect property status, and rate limiting all reject submission.

Security: no anonymous direct insert policy is created. Turnstile is verified server-side with hostname binding, the service-only atomic limiter permits 5 attempts/hour per salted IP hash, and only approved property IDs are accepted. This does **not** guarantee all spam is blocked. Session/IP hashing is used for abuse prevention; privacy notices should disclose processing of inquiry contact details and anti-spam metadata. Periodically purge old rate-limit rows according to your retention policy.

Existing older guest submissions that never reached Supabase cannot be recovered.
