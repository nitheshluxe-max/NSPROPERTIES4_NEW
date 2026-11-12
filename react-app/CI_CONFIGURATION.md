# CI / deployment configuration

The React app formerly depended on `firebase-applet-config.json`, which is absent from GitHub checkout. It now reads public Firebase web configuration from Vite environment variables.

Set the following variables in **GitHub repository Settings → Secrets and variables → Actions → Variables** and in your actual web deployment environment:

- `VITE_SUPABASE_URL` = `https://YOUR_PROJECT.supabase.co` (do **not** include `/rest/v1/`)
- `VITE_SUPABASE_ANON_KEY` = public Supabase publishable/anon key
- `VITE_FIREBASE_API_KEY` = Firebase Web API key
- `VITE_FIREBASE_AUTH_DOMAIN` = Firebase auth domain
- `VITE_FIREBASE_PROJECT_ID` = Firebase project ID
- `VITE_FIREBASE_STORAGE_BUCKET` = Firebase storage bucket, when used
- `VITE_FIREBASE_MESSAGING_SENDER_ID` = Firebase sender ID, when used
- `VITE_FIREBASE_APP_ID` = Firebase app ID
- `VITE_FIRESTORE_DATABASE_ID` = Firestore database ID or `(default)`

Vite embeds all `VITE_*` values into public client bundles. **Never** put Firebase service-account private keys, Supabase service-role keys, or other secrets in `VITE_*` variables.

For local development, create `react-app/.env.local` with the same public values. Do not commit that file. Firebase and Supabase are both still used by the app; passing TypeScript/build does **not** confirm live connectivity, security rules, or correctness of authentication.

The CI workflow uses Node 24.12.0, matching the Firebase dependencies' minimum runtime. React page routing and database migrations should be tested separately before merging.
