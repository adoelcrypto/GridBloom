/**
 * GridBloom - Supabase Client Initialization
 * Gracefully degrades to local/offline mode when credentials are missing or unavailable.
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';

const env = (typeof import.meta !== 'undefined' && (import.meta as any).env) ? (import.meta as any).env : {};
export const SUPABASE_URL: string | undefined = env.VITE_SUPABASE_URL;
export const SUPABASE_KEY: string | undefined = env.VITE_SUPABASE_PUBLISHABLE_KEY;

export function isSupabaseConfigured(): boolean {
  return Boolean(
    SUPABASE_URL &&
    SUPABASE_URL.trim() !== '' &&
    !SUPABASE_URL.includes('MY_SUPABASE') &&
    SUPABASE_KEY &&
    SUPABASE_KEY.trim() !== '' &&
    !SUPABASE_KEY.includes('MY_KEY')
  );
}

let supabaseInstance: SupabaseClient | null = null;

export function getSupabaseClient(): SupabaseClient | null {
  if (!isSupabaseConfigured()) {
    return null;
  }
  if (!supabaseInstance && SUPABASE_URL && SUPABASE_KEY) {
    try {
      supabaseInstance = createClient(SUPABASE_URL, SUPABASE_KEY, {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: false,
        },
      });
    } catch (e) {
      console.warn('Failed to initialize Supabase client:', e);
      return null;
    }
  }
  return supabaseInstance;
}
