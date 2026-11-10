# NS PROPERTIES 4 — Phase 2 setup

1. In Supabase SQL Editor, run `marketplace/supabase/phase2_admin_photos.sql`.
2. Sign in with the email address you want to use as admin, then run:
   ```sql
   insert into public.admin_users(user_id)
   select id from auth.users where email='YOUR_ADMIN_EMAIL@example.com'
   on conflict(user_id) do nothing;
   ```
   Confirm one row was inserted. Never put a service_role key in the website.
3. Authentication → URL Configuration → Redirect URLs: add
   `https://nitheshluxe-max.github.io/NSPROPERTIES4_NEW/marketplace/admin.html`
4. Merge the pull request, wait for GitHub Pages deployment, and visit
   `https://nitheshluxe-max.github.io/NSPROPERTIES4_NEW/marketplace/admin.html`.
5. Test a property upload with a JPEG/PNG/WebP image under 5 MB.
6. Admin signs in, approves it, then refresh the public marketplace.

**Security notes:** admin decisions are checked in database functions, not browser UI. Only the email mapped to `admin_users` has admin privileges. Storage bucket is public: uploaded files are accessible by direct URL even before listing approval. Do not upload private images. Storage upload is limited to property owners; there is no client-side delete/overwrite. The user may need to refresh after signing in to submit. Email links depend on Supabase email limits.
