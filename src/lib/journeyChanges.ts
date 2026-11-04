import type { Book, Friend, Handoff } from '../types';
import { copyOwnerId } from './bookState';

/**
 * What each journey change does to a book, on screen, before the database
 * answers. Pure, so the rules are tested here rather than inside the hook;
 * the database (pass_on(), mark_received() and the queue rules) has the last
 * word on the next refresh.
 */

/** Sign up at the back of the line, reusing a past reader's place. */
export function withJoined(book: Book, me: Friend, position: number): Book {
  return {
    ...book,
    queue: [
      ...book.queue.filter((entry) => entry.id !== me.id),
      { ...me, position, status: 'waiting' },
    ],
  };
}

/** Leave the line: gone if you never had it, back to "done" if you did. */
export function withLeft(book: Book, meId: string, readBefore: boolean): Book {
  return {
    ...book,
    queue: book.queue.flatMap((entry) => {
      if (entry.id !== meId || entry.status !== 'waiting') {
        return [entry];
      }
      return readBefore ? [{ ...entry, status: 'done' as const }] : [];
    }),
  };
}

/** Pass it on: a new leg, newest, in the post until "Got it". */
export function withPassedOn(book: Book, handoff: Handoff): Book {
  const { fromFriend, toFriend, happenedAt: now } = handoff;
  return {
    ...book,
    // Going home answers a call home.
    calledHomeAt: toFriend === copyOwnerId(book) ? undefined : book.calledHomeAt,
    // Passing it on means you had it, even if you never tapped Got it.
    handoffs: [
      ...book.handoffs.map((leg) =>
        leg.toFriend === fromFriend && !leg.receivedAt ? { ...leg, receivedAt: now } : leg,
      ),
      handoff,
    ],
    queue: book.queue.map((entry) => {
      if (entry.id === fromFriend) {
        return { ...entry, status: 'done' as const };
      }
      // An owner getting their copy back has already read it.
      if (entry.id === toFriend && entry.status === 'waiting') {
        return { ...entry, status: 'reading' as const };
      }
      return entry;
    }),
  };
}

/** "Got it": arrived here, now, read in this reader's city. */
export function withReceived(book: Book, me: Friend, now: string): Book {
  return {
    ...book,
    handoffs: book.handoffs.map((leg) =>
      leg.toFriend === me.id && !leg.receivedAt
        ? { ...leg, receivedAt: now, placeCity: me.city, placeRegion: me.state }
        : leg,
    ),
  };
}
