# React main-site migration — controlled GitHub Pages release

This branch does NOT change the live root `index.html`, GitHub Pages settings, or the existing `main` branch. It prepares the React app as the eventual GitHub Pages homepage.

## What's integrated
- Existing React property browser, filters, map, comparison and admin components are preserved.
- A **Free Marketplace** link in the React navigation opens `#free-marketplace`.
- The free marketplace reads approved listings from the existing Supabase `public_properties` view, and submits new listings to `properties` with status `pending`.
- Phone numbers are shown only where the owner opted in to public contact. No payment/paywall logic is added.
- A locally bundled logo, GitHub Pages canonical URLs and the Vite project base path are configured.

**Important:** This is an integration of the marketplace's basic listing/search/posting flow into React, not a migration of the existing Firestore records. Existing React features still use Firestore; marketplace data lives in Supabase. These are separate collections, not yet one unified catalog. The React marketplace does not yet provide image upload, which remains available in the standalone marketplace.

## Preview and validation (safe)
1. Review the pull request and the **React Pages preview and controlled release** Actions check.
2. Download the `react-pages-preview` build artifact from the Actions run and test it using a local HTTP server at the same project base path. The preview artifact is NOT a deployed preview URL.
3. Ensure Actions **Variables** include valid public `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `VITE_FIREBASE_API_KEY`, `VITE_FIREBASE_PROJECT_ID`, `VITE_FIREBASE_APP_ID`, etc. See `CI_CONFIGURATION.md`.
4. Run the marketplace SQL migrations already present in `marketplace/supabase/` and verify the `public_properties` view and insert RLS. Confirm the marketplace is using the **same** Supabase project as the React app.
5. Test the free marketplace anonymously, then email sign-in, pending submission, admin approval, public listing visibility and contact consent.
6. Test React's Firestore-backed listing/admin features and Google Maps independently. CI compilation does not prove these services work.
7. Check mobile layouts and test that existing public listings and links remain reachable.

## Switch the GitHub Pages homepage (ONLY after approval)
1. Merge the PR into `main` after review. **Merging does not deploy the React site**.
2. In repository **Settings → Pages → Build and deployment → Source**, choose **GitHub Actions**. This is a deliberate production switch; do it only when ready.
3. Open **Actions → React Pages preview and controlled release → Run workflow** on the **main** branch. This is the only trigger that deploys React.
4. Visit `https://nitheshluxe-max.github.io/NSPROPERTIES4_NEW/` and verify all flows.
5. Set Supabase Auth redirect allowlist to `https://nitheshluxe-max.github.io/NSPROPERTIES4_NEW/**`.

## Rollback
Revert Pages **Source** to the previous **Deploy from a branch** setting (usually `main` / `/ (root)`) to restore the original root `index.html`. Do not delete the original root site files until the React replacement is stable.

## Security
All `VITE_*` variables are embedded into the browser bundle; they must contain public keys only. Never expose Supabase service-role or Firebase service-account credentials. Supabase RLS and Firebase security rules—not React UI checks—must enforce access. Public phone sharing requires explicit consent.
