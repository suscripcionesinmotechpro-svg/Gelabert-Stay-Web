import { createClient } from '@supabase/supabase-js';

// Access variables directly as static literals so Webpack/Next.js DefinePlugin can inline them at build time
const supabaseUrl = 
  (typeof process !== 'undefined' && process.env.VITE_SUPABASE_URL) ||
  (typeof process !== 'undefined' && process.env.NEXT_PUBLIC_SUPABASE_URL) ||
  '';

const supabaseAnonKey = 
  (typeof process !== 'undefined' && process.env.VITE_SUPABASE_ANON_KEY) ||
  (typeof process !== 'undefined' && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) ||
  '';

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    '[Supabase] Missing environment variables. ' +
    'Copy .env.local.example to .env.local and fill in your Supabase project URL and anon key.'
  );
}

const isBrowser = typeof window !== 'undefined';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    storage: isBrowser ? window.sessionStorage : undefined,
    autoRefreshToken: isBrowser,
    detectSessionInUrl: isBrowser
  }
});

