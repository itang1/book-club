/**
 * Saves that survive a weak connection. A change the app couldn't send
 * because the connection dropped (not one the database refused) waits here,
 * on the device, and goes when the connection is back, in the order it was
 * made. So "Pass it on" in a café with bad wifi still lands, even if the app
 * is closed and opened again in between.
 *
 * Only changes that are safe to send twice go through here: if the first try
 * reached the database but the answer got lost, the second must not make a
 * second handoff.
 */

/** A change, written down so it can be sent later (and survive a reload). */
export type OutboxOp =
  | {
      kind: 'passOn';
      handoffId: string;
      bookId: string;
      to: string;
      note: string | null;
      rating: number | null;
    }
  | { kind: 'markReceived'; bookId: string }
  | {
      kind: 'joinLine';
      entry: { book_id: string; friend_id: string; position: number; status: string };
    }
  | { kind: 'leaveLine'; bookId: string; friendId: string; readBefore: boolean };

export type OutboxEntry = { id: string; label: string; op: OutboxOp; queuedAt: string };

/** What sending one change came to. */
export type SendResult = { ok: true } | { ok: false; offline: boolean; reason: string };

export type OutboxStorage = {
  load: () => Promise<OutboxEntry[]>;
  save: (entries: OutboxEntry[]) => Promise<void>;
};

/** Messages a dropped connection produces in browsers and React Native. */
const OFFLINE =
  /failed to fetch|networkerror|network request failed|load failed|network error|fetch failed|the internet connection appears to be offline|timed? ?out/i;

export function looksOffline(reason: string): boolean {
  return OFFLINE.test(reason);
}

export type Outbox = ReturnType<typeof createOutbox>;

/**
 * The queue itself, apart from how a change is sent and where the queue is
 * kept, so it can be tested without a network or a device.
 */
export function createOutbox(
  send: (op: OutboxOp) => Promise<SendResult>,
  storage: OutboxStorage,
  hooks: {
    /** How many changes are waiting, whenever that changes. */
    onPending?: (count: number) => void;
    /** A queued change the database turned down when it finally arrived. */
    onRefused?: (entry: OutboxEntry, reason: string) => void;
    /** Everything queued has gone: time to reload what's on screen. */
    onDrained?: () => void;
  } = {},
) {
  let entries: OutboxEntry[] = [];
  let loaded: Promise<void> | null = null;
  let flushing: Promise<void> | null = null;
  let counter = 0;

  const ensureLoaded = () => {
    loaded ??= storage
      .load()
      .then((stored) => {
        // Anything queued before this started goes first.
        entries = [...stored, ...entries];
        hooks.onPending?.(entries.length);
      })
      .catch(() => {});
    return loaded;
  };

  const persist = async () => {
    hooks.onPending?.(entries.length);
    try {
      await storage.save(entries);
    } catch {
      // The queue still works in memory; it just won't survive a reload.
    }
  };

  /**
   * Send a change now, or queue it if the connection is down. Returns null
   * when it went or is waiting to go, or the database's reason for refusing.
   */
  async function submit(label: string, op: OutboxOp): Promise<string | null> {
    await ensureLoaded();
    // Keep order: never jump ahead of changes already waiting.
    if (entries.length === 0) {
      const result = await send(op);
      if (result.ok) {
        return null;
      }
      if (!result.offline) {
        return result.reason;
      }
    }
    counter += 1;
    entries.push({ id: `${Date.now()}-${counter}`, label, op, queuedAt: new Date().toISOString() });
    await persist();
    return null;
  }

  /** Try everything waiting, in order, stopping at the first sign of no connection. */
  function flush(): Promise<void> {
    flushing ??= (async () => {
      await ensureLoaded();
      let sent = false;
      while (entries.length > 0) {
        const [entry] = entries;
        const result = await send(entry.op);
        if (!result.ok && result.offline) {
          break;
        }
        entries = entries.slice(1);
        sent = true;
        if (!result.ok) {
          hooks.onRefused?.(entry, result.reason);
        }
        await persist();
      }
      if (sent && entries.length === 0) {
        hooks.onDrained?.();
      }
    })().finally(() => {
      flushing = null;
    });
    return flushing;
  }

  /** Signing out: what's waiting belongs to that account, so it goes. */
  async function clear() {
    await ensureLoaded();
    entries = [];
    await persist();
  }

  return {
    submit,
    flush,
    clear,
    pending: () => entries.length,
    load: ensureLoaded,
  };
}
