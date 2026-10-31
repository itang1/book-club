import AsyncStorage from '@react-native-async-storage/async-storage';

import { sendOutboxOp } from './bookClubService';
import { createOutbox, OutboxEntry } from './outbox';

const OUTBOX_KEY = 'book-club:outbox-v1';

type Listener = {
  pending: (count: number) => void;
  refused: (entry: OutboxEntry, reason: string) => void;
  drained: () => void;
};

let listener: Listener | null = null;

/** The app's one outbox, kept on the device (see outbox.ts). */
export const clubOutbox = createOutbox(
  sendOutboxOp,
  {
    load: async () => {
      const raw = await AsyncStorage.getItem(OUTBOX_KEY);
      return raw ? (JSON.parse(raw) as OutboxEntry[]) : [];
    },
    save: async (entries) => {
      await AsyncStorage.setItem(OUTBOX_KEY, JSON.stringify(entries));
    },
  },
  {
    onPending: (count) => listener?.pending(count),
    onRefused: (entry, reason) => listener?.refused(entry, reason),
    onDrained: () => listener?.drained(),
  },
);

/** Hear what the outbox does; returns how to stop listening. */
export function listenToOutbox(next: Listener): () => void {
  listener = next;
  next.pending(clubOutbox.pending());
  return () => {
    if (listener === next) {
      listener = null;
    }
  };
}
