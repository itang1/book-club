import * as React from 'react';

import { supabase } from './supabase';

export type ReportReason = 'unkind' | 'kept_book' | 'fake' | 'other';

export const REPORT_REASONS: { value: ReportReason; label: string }[] = [
  { value: 'unkind', label: 'Unkind or makes me feel unsafe' },
  { value: 'kept_book', label: "Kept a book or won't pass it on" },
  { value: 'fake', label: 'Fake or spam profile' },
  { value: 'other', label: 'Something else' },
];

export type Blocks = {
  blockedIds: string[];
  block: (personId: string) => Promise<string | null>;
  unblock: (personId: string) => Promise<string | null>;
  report: (personId: string, reason: ReportReason, details: string) => Promise<string | null>;
};

/**
 * Who you've blocked, and reporting someone. Only you see your blocks; the
 * database enforces what they stop (friend requests and shelf asks, both
 * ways). In the demo it all lives in memory and reports go nowhere.
 */
export function useBlocks(currentUserId: string | null): Blocks {
  const [blockedIds, setBlockedIds] = React.useState<string[]>([]);

  const load = React.useCallback(async () => {
    if (!supabase || !currentUserId) {
      return;
    }
    const { data } = await supabase.from('blocks').select('blocked');
    setBlockedIds(((data ?? []) as { blocked: string }[]).map((row) => row.blocked));
  }, [currentUserId]);

  React.useEffect(() => {
    // Fetch on sign-in; state is set once the answer arrives.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
  }, [load]);

  const call = async (fn: string, args: Record<string, unknown>) => {
    if (!supabase) {
      return null;
    }
    const { error } = await supabase.rpc(fn, args);
    return error ? error.message : null;
  };

  const block = async (personId: string) => {
    setBlockedIds((current) => (current.includes(personId) ? current : [...current, personId]));
    const problem = await call('block_person', { p_person_id: personId });
    await load();
    return problem;
  };

  const unblock = async (personId: string) => {
    setBlockedIds((current) => current.filter((id) => id !== personId));
    const problem = await call('unblock_person', { p_person_id: personId });
    await load();
    return problem;
  };

  const report = (personId: string, reason: ReportReason, details: string) =>
    call('report_person', { p_person_id: personId, p_reason: reason, p_details: details });

  return { blockedIds, block, unblock, report };
}
