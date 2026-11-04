import { isSupabaseConfigured } from './supabase';
import { useLocalDemoClub } from './useLocalDemoClub';
import { useSupabaseClub } from './useSupabaseClub';

export type NewProfile = { name: string; city: string; region: string };
export type SaveProblem = { action: string; reason: string };

/**
 * Unified hook for the club: delegates cleanly to either `useSupabaseClub`
 * (production Supabase backend with realtime subscriptions and optimistic rollbacks)
 * or `useLocalDemoClub` (local demo mode with fast in-memory switching).
 */
export function useBookClub() {
  const localClub = useLocalDemoClub();
  const supabaseClub = useSupabaseClub();

  return isSupabaseConfigured ? supabaseClub : localClub;
}

export type BookClub = ReturnType<typeof useBookClub>;
