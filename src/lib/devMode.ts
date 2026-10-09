import { isSupabaseConfigured } from './supabase';

/**
 * Dev mode: a bar at the top of the app for becoming anyone in the club, so
 * you can test a handoff from both ends.
 *
 * It only exists on the demo data (`npm run demo`, no Supabase). Against a
 * real database you are whoever is signed in, full stop: switching people
 * there would mean acting as them, which the database rightly refuses.
 *
 * On by default under the dev server; EXPO_PUBLIC_DEV_MODE=true turns it on
 * in an exported demo build.
 */
export const isDevMode =
  !isSupabaseConfigured && (__DEV__ || process.env.EXPO_PUBLIC_DEV_MODE === 'true');
