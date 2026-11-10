# NS PROPERTIES 4 — Free Marketplace (Phase 1)
Independent implementation; no scraping or copying other marketplaces.

## Setup
1. In Supabase SQL Editor run `supabase/schema.sql`.
2. In Supabase Auth > URL Configuration add your deployed GitHub Pages URL to allowed redirects.
3. Enable email OTP / magic-link sign-in in Supabase Auth.
4. Copy `config.example.js` to `config.js`, set Supabase URL and **public** anon key.
5. Deploy `marketplace/` as a static site (or test locally using a local HTTP server). GitHub Pages project URL may use `/marketplace/` under the existing site.
6. Approve pending listings using the Supabase dashboard, not by exposing elevated keys in JavaScript.

## Current scope
Responsive browse/search, direct consent-based contacts, free submissions with email login, pending moderation, PostgreSQL schema and RLS.
Not yet included: image uploads, advanced maps, agent dashboards, automated verification, admin UI, analytics, payments (intentionally none).

## Security notes
Never commit service-role keys. Public contact numbers are accessible to all visitors when owners opt in. Add abuse throttling, CAPTCHA, consent/terms and phone verification before production launch.
