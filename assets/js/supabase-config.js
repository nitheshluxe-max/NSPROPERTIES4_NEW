// Supabase Dashboard > Project Settings > API. The legacy anon JWT key is safe to expose with RLS enabled.
// Never put a service_role or secret key in a public GitHub repository.
window.NS_SUPABASE_CONFIG = {
 url: "https://YOUR_PROJECT.supabase.co",
 anonKey: "YOUR_SUPABASE_PUBLISHABLE_OR_ANON_KEY"
};
