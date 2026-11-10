# NS PROPERTIES 4 React → Supabase migration

## Status: IN PROGRESS — NOT READY FOR PRODUCTION

The original React/TypeScript UI files have been copied from the source repository to preserve the appearance and component structure. The original Firebase context and admin logic are **not yet converted**, and the source's Firebase dependencies and configuration are intentionally retained as a reference. Do **not** deploy this React app over the working marketplace yet.

## Required backend migration
1. Replace `src/context/PropertyContext.tsx` Firestore CRUD and realtime listeners with Supabase queries, auth and subscriptions.
2. Map source property fields to the existing Supabase `properties` schema; expand SQL schema for features like amenities, coordinates, bedrooms, furnishing, featured, favorites, comparisons and leads.
3. Migrate `PostPropertyModal`, `EditPropertyModal`, and photo handling to Supabase Storage and `property_photos`.
4. Migrate admin login and console to Supabase authentication and server-enforced admin RPCs. Never use browser-only authorization.
5. Migrate inquiries, visitor statistics, and registration to tables with RLS and privacy safeguards.
6. Configure map API keys and validate Google Maps terms and quotas. Some original assets are not yet copied.
7. Add CI build, test, and GitHub Pages deploy only after Firebase imports are removed and TypeScript build succeeds.

## Local inspection (reference UI)
```bash
cd react-app
npm install
cp .env.supabase.example .env.local
npm run dev
```
This may require the original Firebase config and assets while the migration is unfinished; do not expect Supabase functionality yet.

## Deployment target
The Vite base is configured for `/NSPROPERTIES4_NEW/`. When ready, build with `npm run build` and publish `react-app/dist` via GitHub Actions. GitHub Pages cannot run Express or Node API handlers; those require separate hosting or Supabase Edge Functions.

## Existing live website
The existing `/marketplace/` Supabase HTML website remains the working deployment and is not modified by this branch.
