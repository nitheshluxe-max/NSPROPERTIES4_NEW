# React + Supabase conversion progress

## Implemented in development branch
- Approved-only public property loading from `public_properties` with `property_photos` image URLs.
- Public listing refresh subscription (requires Realtime publication to receive database events; initial load works without it).
- React property posting now writes pending records to Supabase; login is required.
- Admin status updates use secured `admin_review_property` RPC.
- Supabase OTP admin sign-in dialog and admin membership verification.
- Admin routes no longer grant admin access automatically.

## NOT production ready
- Firestore remains in `PropertyContext.tsx` for inquiries, lead registration, visitor analytics, editing, deletion, and featured property operations. These require replacement and secure SQL/RLS.
- Admin property list still needs a full Supabase data adapter and React wiring.
- The source form uses image URLs and browser-upload logic that have not yet been fully migrated to Supabase Storage.
- React `Property` type contains more fields than the existing SQL schema. Advanced fields require a schema migration; otherwise they are not persisted.
- Existing seed/localStorage initial state can briefly appear before Supabase loads; eliminate before launch.
- Original binary images and map configuration are not fully migrated.
- No production build, tests, or GitHub Pages deployment validation has been performed.
- Existing Supabase SQL policies and admin membership must be applied in your Supabase project; committing code does not execute SQL.

## Safety
Do not merge or deploy until all Firestore writes are removed and the build passes. The existing live marketplace remains unchanged.

## Deployment after completion
1. Apply the reviewed SQL migrations and admin membership in Supabase SQL Editor.
2. Configure `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` (public key only).
3. Build/test `react-app`, then deploy `dist` via GitHub Actions to GitHub Pages.
4. Verify login, posting, moderation, photo uploads, inquiries, map, and mobile layouts.
