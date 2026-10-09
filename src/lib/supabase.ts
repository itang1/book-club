import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';

/**
 * The EXPO_PUBLIC_ prefix is required, not stylistic: Expo only inlines
 * variables with that prefix into the client bundle. A differently named
 * variable is simply absent at runtime, and the app falls back to mock data
 * with no error — so these names cannot be changed to match other projects.
 * (three-lines uses NEXT_PUBLIC_ for the same reason, on Next.js's side.)
 *
 * Values are trimmed because a key pasted from a dashboard often carries a
 * trailing newline, which would otherwise end up in an auth header.
 */
export const supabaseUrl = (process.env.EXPO_PUBLIC_SUPABASE_URL ?? '').trim();

/**
 * Accepts either key format: the current `sb_publishable_...` or a legacy
 * `anon` JWT (`eyJ...`). The variable keeps the ANON_KEY name to match the
 * rest of the Supabase ecosystem. Never a `sb_secret_...` or service-role
 * key — EXPO_PUBLIC_ values are compiled into the bundle and served to every
 * visitor, and those keys bypass row-level security.
 */
export const supabaseAnonKey = (process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '').trim();

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        // Sign-in links land back on the web app with the session in the
        // URL; this picks it up. Native would need a deep link instead.
        detectSessionInUrl: Platform.OS === 'web',
        // The browser's localStorage on web; AsyncStorage on a phone.
        storage: Platform.OS === 'web' ? undefined : AsyncStorage,
      },
    })
  : null;
