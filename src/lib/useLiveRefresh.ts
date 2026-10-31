import * as React from 'react';
import { AppState, Platform } from 'react-native';

import { coalesce } from './coalesce';
import { supabase } from './supabase';

/** Realtime events this close together are one change. */
const REFRESH_SETTLE_MS = 400;
/** Without realtime, fetch every minute; with it, every fifth minute. */
const POLL_MS = 60_000;
const LIVE_POLL_EVERY = 5;

/**
 * Keep what's on screen current without anyone having to reload: call
 * `refresh` on realtime changes, coming back to the app or online, and on a
 * timer while open, never more than one at a time.
 */
export function useLiveRefresh(enabled: boolean, refresh: () => Promise<void>) {
  const fetchNow = React.useEffectEvent(refresh);

  React.useEffect(() => {
    if (!enabled) {
      return;
    }

    // One change arrives as several realtime events (a handoff, a queue row,
    // the book), so they're collapsed into one fetch.
    const fetcher = coalesce(() => fetchNow(), REFRESH_SETTLE_MS);
    const quietRefresh = () => fetcher.schedule();

    // While realtime is connected it brings changes as they happen, and the
    // timer only catches what it doesn't carry (profile edits, new members).
    let live = false;
    let sinceLastPoll = 0;
    const interval = setInterval(() => {
      sinceLastPoll += 1;
      if (!live || sinceLastPoll >= LIVE_POLL_EVERY) {
        sinceLastPoll = 0;
        quietRefresh();
      }
    }, POLL_MS);

    const channel = supabase
      ? supabase
          .channel('club-realtime')
          .on('postgres_changes', { event: '*', schema: 'public', table: 'handoffs' }, quietRefresh)
          .on(
            'postgres_changes',
            { event: '*', schema: 'public', table: 'reading_queue' },
            quietRefresh,
          )
          .on(
            'postgres_changes',
            { event: '*', schema: 'public', table: 'friendships' },
            quietRefresh,
          )
          .on('postgres_changes', { event: '*', schema: 'public', table: 'books' }, quietRefresh)
          .on('postgres_changes', { event: '*', schema: 'public', table: 'groups' }, quietRefresh)
          .subscribe((status) => {
            const wasLive = live;
            live = status === 'SUBSCRIBED';
            // Coming back from a dropped connection: catch up on what was missed.
            if (live && !wasLive) {
              quietRefresh();
            }
          })
      : null;
    const appState = AppState.addEventListener('change', (state) => {
      if (state === 'active') {
        quietRefresh();
      }
    });
    const onVisible = () => {
      if (typeof document !== 'undefined' && document.visibilityState === 'visible') {
        quietRefresh();
      }
    };
    if (Platform.OS === 'web' && typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', onVisible);
      // Back online: send what was waiting straight away.
      window.addEventListener('online', quietRefresh);
    }

    return () => {
      fetcher.cancel();
      clearInterval(interval);
      appState.remove();
      if (Platform.OS === 'web' && typeof document !== 'undefined') {
        document.removeEventListener('visibilitychange', onVisible);
        window.removeEventListener('online', quietRefresh);
      }
      if (channel && supabase) {
        supabase.removeChannel(channel);
      }
    };
  }, [enabled]);
}
