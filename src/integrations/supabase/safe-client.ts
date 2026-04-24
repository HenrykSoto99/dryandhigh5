// Resilient Supabase client wrapper.
// The auto-generated client.ts reads VITE_SUPABASE_URL / VITE_SUPABASE_PUBLISHABLE_KEY
// from import.meta.env. If those envs are missing at build time (e.g. on a deploy
// host that didn't load the project's .env), createClient throws
// "supabaseUrl is required." at module load and crashes the entire React app
// (blank page). This wrapper falls back to the project's known public values so
// the app always boots; auth/data calls will still fail loudly if envs are wrong,
// but the landing page renders.
import { createClient } from "@supabase/supabase-js";
import type { Database } from "./types";

const FALLBACK_URL = "https://pklpmvejnvyhwwpwqmoj.supabase.co";
const FALLBACK_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBrbHBtdmVqbnZ5aHd3cHdxbW9qIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM1MDQyMTksImV4cCI6MjA4OTA4MDIxOX0.gyAvSFw5J7O8TBqqBbLCAeaE-d2SeQWOQJByF6QITEU";

const env = (import.meta as unknown as { env?: Record<string, string | undefined> }).env ?? {};
const SUPABASE_URL = env.VITE_SUPABASE_URL || FALLBACK_URL;
const SUPABASE_PUBLISHABLE_KEY = env.VITE_SUPABASE_PUBLISHABLE_KEY || FALLBACK_ANON_KEY;

if (!env.VITE_SUPABASE_URL || !env.VITE_SUPABASE_PUBLISHABLE_KEY) {
  // eslint-disable-next-line no-console
  console.warn(
    "[supabase] VITE_SUPABASE_URL / VITE_SUPABASE_PUBLISHABLE_KEY missing at build time — falling back to public project defaults."
  );
}

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    storage: typeof window !== "undefined" ? window.localStorage : undefined,
    persistSession: true,
    autoRefreshToken: true,
  },
});
