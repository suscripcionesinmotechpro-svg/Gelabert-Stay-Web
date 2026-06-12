import { createClient } from '@supabase/supabase-js';

let supabaseUrl = 
  (typeof process !== 'undefined' && process.env.VITE_SUPABASE_URL) ||
  (typeof process !== 'undefined' && process.env.NEXT_PUBLIC_SUPABASE_URL) ||
  'https://aumqjpqngmhpbwytpets.supabase.co';

if (!supabaseUrl || supabaseUrl === 'undefined' || supabaseUrl === 'null' || !supabaseUrl.startsWith('http')) {
  supabaseUrl = 'https://aumqjpqngmhpbwytpets.supabase.co';
}

let supabaseAnonKey = 
  (typeof process !== 'undefined' && process.env.VITE_SUPABASE_ANON_KEY) ||
  (typeof process !== 'undefined' && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF1bXFqcHFuZ21ocGJ3eXRwZXRzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMxODgyNjMsImV4cCI6MjA4ODc2NDI2M30.OHi4bRiyFUv2lBHu3wb1IKchj2qF6rZ354uhCQeeAlU';

if (!supabaseAnonKey || supabaseAnonKey === 'undefined' || supabaseAnonKey === 'null' || supabaseAnonKey.length < 10) {
  supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF1bXFqcHFuZ21ocGJ3eXRwZXRzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMxODgyNjMsImV4cCI6MjA4ODc2NDI2M30.OHi4bRiyFUv2lBHu3wb1IKchj2qF6rZ354uhCQeeAlU';
}

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

