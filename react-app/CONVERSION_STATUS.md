# React + Supabase conversion progress

The original React visual components are in `react-app/src`. The Firebase-based PropertyContext and admin logic are **not yet migrated**. The project must not be deployed as a working Supabase app.

## Completed in this branch
- Added a typed Supabase property repository for approved listings, image URLs, email OTP, new pending listings, image uploads and admin review RPCs.
- Repository uses the **existing** Supabase schema and Phase 2 admin/photo SQL from the marketplace.
- Repository operations are not yet wired into the original React UI.

## Required before deploying
- Replace Firebase state subscriptions, mutations, and authentication in `src/context/PropertyContext.tsx`.
- Add Supabase schema/RLS for favorites, inquiries, leads, visitor tracking, maps, and advanced property fields; do not use permissive public write policies.
- Convert AdminConsole and its login to Supabase auth and admin RPCs.
- Migrate image assets and validate map API configuration.
- Run TypeScript, production build, and end-to-end checks. Only then add a GitHub Pages deploy workflow.

## Supabase requirements
Run `marketplace/supabase/schema.sql` and `marketplace/supabase/phase2_admin_photos.sql` (from earlier work), register the admin user, and use only the project base URL and publishable key.
