import { Platform } from 'react-native';
import type { Session } from '@supabase/supabase-js';

import { supabase } from './supabase';

/**
 * Sign-in by emailed link: no passwords to forget or leak. The link brings
 * you back to the page you asked from (invite query string included), where
 * the Supabase client finds the session in the URL.
 */
export async function emailSignInLink(email: string): Promise<string | null> {
  if (!supabase) {
    return 'Sign-in needs a Supabase project.';
  }

  const redirect =
    Platform.OS === 'web' && typeof window !== 'undefined'
      ? window.location.href.split('#')[0]
      : undefined;

  const { error } = await supabase.auth.signInWithOtp({
    email: email.trim(),
    options: { emailRedirectTo: redirect },
  });
  return error ? error.message : null;
}

export async function currentSession(): Promise<Session | null> {
  if (!supabase) {
    return null;
  }

  const { data } = await supabase.auth.getSession();
  return data.session;
}

export function onSessionChange(listener: (session: Session | null) => void): () => void {
  if (!supabase) {
    return () => {};
  }

  const { data } = supabase.auth.onAuthStateChange((_event, session) => listener(session));
  return () => data.subscription.unsubscribe();
}

/**
 * Link this account to its club profile: one already linked, or one waiting
 * to be claimed by this email (profile_claims). Null means no profile yet.
 */
export async function claimProfile(): Promise<string | null> {
  if (!supabase) {
    return null;
  }

  const { data, error } = await supabase.rpc('claim_profile');
  if (error) {
    console.warn('Supabase claim_profile failed:', error.message);
    return null;
  }

  return (data as string | null) ?? null;
}

export async function signOutEverywhere(): Promise<void> {
  await supabase?.auth.signOut();
}
