import { Platform } from 'react-native';

import { supabase } from './supabase';

/**
 * Error monitoring: report crashes to the database (report_error in
 * schema.sql), where a daily check (.github/workflows/errors.yml) alerts the
 * owner. Only the message, stack and screen: never book contents or notes.
 * Without Supabase (the demo) errors go to the console only.
 */

const sent = new Set<string>();

export function reportError(error: unknown, screen?: string): void {
  const err = error instanceof Error ? error : new Error(String(error));
  console.error(err);
  // Once per message per session: a loop shouldn't send the same thing twice.
  if (!supabase || sent.has(err.message)) return;
  sent.add(err.message);
  const web = Platform.OS === 'web' && typeof window !== 'undefined';
  supabase
    .rpc('report_error', {
      p_message: `${err.name}: ${err.message}`,
      p_stack: err.stack ?? null,
      p_screen: screen ?? null,
      p_url: web ? window.location.href : null,
      p_user_agent: web ? navigator.userAgent : `${Platform.OS} ${Platform.Version}`,
    })
    .then(
      () => undefined,
      () => undefined, // Reporting must never cause an error of its own.
    );
}

/** Catch what React's error boundary can't: async failures and global errors. */
export function startMonitoring(): void {
  if (Platform.OS === 'web' && typeof window !== 'undefined') {
    window.addEventListener('error', (event) => reportError(event.error ?? event.message));
    window.addEventListener('unhandledrejection', (event) => reportError(event.reason));
    return;
  }
  const errorUtils = (
    globalThis as {
      ErrorUtils?: {
        getGlobalHandler: () => (error: unknown, fatal?: boolean) => void;
        setGlobalHandler: (handler: (error: unknown, fatal?: boolean) => void) => void;
      };
    }
  ).ErrorUtils;
  if (errorUtils) {
    const previous = errorUtils.getGlobalHandler();
    errorUtils.setGlobalHandler((error, fatal) => {
      reportError(error);
      previous(error, fatal);
    });
  }
}
