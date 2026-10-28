import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Retrieve environment variables with fallback
const envUrl = (
  typeof import.meta !== 'undefined' && import.meta.env?.VITE_SUPABASE_URL
    ? import.meta.env.VITE_SUPABASE_URL
    : typeof process !== 'undefined' && process.env?.VITE_SUPABASE_URL
    ? process.env.VITE_SUPABASE_URL
    : ''
) as string;

const envAnonKey = (
  typeof import.meta !== 'undefined' && import.meta.env?.VITE_SUPABASE_ANON_KEY
    ? import.meta.env.VITE_SUPABASE_ANON_KEY
    : typeof process !== 'undefined' && process.env?.VITE_SUPABASE_ANON_KEY
    ? process.env.VITE_SUPABASE_ANON_KEY
    : ''
) as string;

/**
 * Checks if the configured URL and Anon Key are valid real credentials
 */
export const isSupabaseConfigured = (): boolean => {
  if (!envUrl || !envAnonKey) return false;
  if (
    envUrl.includes('your-project') ||
    envUrl.includes('placeholder') ||
    envAnonKey.includes('placeholder') ||
    envAnonKey.includes('your-anon-key')
  ) {
    return false;
  }
  try {
    const url = new URL(envUrl);
    return Boolean(url.protocol && url.host);
  } catch {
    return false;
  }
};

let clientInstance: SupabaseClient | null = null;

if (isSupabaseConfigured()) {
  try {
    const url = new URL(envUrl);
    console.log(`[LearnAI Supabase] Initializing client for project: ${url.hostname}`);
    clientInstance = createClient(envUrl.trim(), envAnonKey.trim(), {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        storage: typeof window !== 'undefined' ? window.localStorage : undefined,
      },
    });
  } catch (err) {
    console.warn('[LearnAI Supabase] Failed to initialize Supabase client:', err);
    clientInstance = null;
  }
}

export const supabase = clientInstance;

export interface SupabaseConnectionStatus {
  isConfigured: boolean;
  connected: boolean;
  url: string;
  error?: string;
  checkedAt: string;
}

/**
 * Test connectivity to the configured Supabase instance
 */
export async function testSupabaseConnection(): Promise<SupabaseConnectionStatus> {
  const timestamp = new Date().toISOString();
  if (!isSupabaseConfigured() || !supabase) {
    return {
      isConfigured: false,
      connected: false,
      url: envUrl || '(not configured)',
      error: 'Supabase URL or Anon Key is missing. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your environment.',
      checkedAt: timestamp,
    };
  }

  try {
    // Attempt a light ping by querying learnai_users
    const { error } = await supabase.from('learnai_users').select('user_id', { head: true, count: 'exact' });
    if (error && error.code !== 'PGRST116') {
      // If table doesn't exist yet, it's connected to Supabase but needs schema migration
      if (error.code === '42P01') {
        return {
          isConfigured: true,
          connected: true,
          url: envUrl,
          error: 'Connected to Supabase! The "learnai_users" table was not found yet. Please run the provided SQL setup script in Supabase SQL Editor.',
          checkedAt: timestamp,
        };
      }
      return {
        isConfigured: true,
        connected: false,
        url: envUrl,
        error: `Supabase returned error: ${error.message} (${error.code || 'unknown'})`,
        checkedAt: timestamp,
      };
    }

    return {
      isConfigured: true,
      connected: true,
      url: envUrl,
      checkedAt: timestamp,
    };
  } catch (err: any) {
    return {
      isConfigured: true,
      connected: false,
      url: envUrl,
      error: err?.message || 'Network error reaching Supabase host.',
      checkedAt: timestamp,
    };
  }
}
