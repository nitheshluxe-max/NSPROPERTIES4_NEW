# NS PROPERTIES 4 — GitHub Pages + Supabase
This version replaces browser PHP calls with Supabase REST RPC calls. No PHP server is needed.

## Setup (required)
1. Create a Supabase project at https://supabase.com/dashboard .
2. Open **SQL Editor** and run `supabase/schema.sql`.
3. In Supabase Project Settings / API, copy the project URL and **legacy anon JWT key**.
4. Edit `assets/js/supabase-config.js` and replace the two placeholders. **NEVER use a service_role or secret key in the website.**
5. In Supabase Authentication > Users, create an admin email/password user. Copy its UUID.
6. In SQL Editor, run: `insert into public.site_admins(user_id) values ('YOUR-AUTH-USER-UUID');`
7. Deploy this branch through GitHub Pages (merge after review). Visit `admin/index.html` to sign in.
8. Submit a property, approve it in admin, verify it appears publicly, and submit a test enquiry.

## Important limitations
- Photos remain browser-only previews. No photos are uploaded or stored. Approved listings display a placeholder until secure media uploads are implemented.
- Sample properties are displayed only before Supabase is configured; once configured, the database is authoritative.
- Anonymous property and enquiry submission uses SQL functions. Direct anonymous table insert/update is blocked by RLS.
- Public submission endpoints need abuse controls (CAPTCHA, rate limits / Edge Functions) before real traffic.
- Only authenticated users explicitly listed in `site_admins` can view private enquiries or approve listings.
- Admin uses browser sessionStorage; sign out on shared computers.
- The old PHP/MySQL files remain in the repo for reference but are not used by the GitHub Pages frontend.
- Existing sample listings are not automatically imported into Supabase.
