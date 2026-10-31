import type { Book } from '../types';
import { friendNameIn } from './bookState';

/** Something that just happened to a copy, for the Lately list on Home. */
export type LatelyEvent = {
  id: string;
  bookId: string;
  title: string;
  at: string;
  /** "Phoebe sent", "Rachel got", "Nate lent": who did it, and what. */
  who: string;
  verb: 'lent' | 'sent' | 'got';
  /** Who it was sent to, for "sent". */
  to?: string;
};

/**
 * The newest lends, sends and arrivals across the copies you can see. Only
 * who and where: notes and stars stay sealed in the book until you've read it.
 */
export function lately(books: Book[], limit = 6): LatelyEvent[] {
  const first = (book: Book, id: string) => friendNameIn(book, id).split(' ')[0];
  const events: LatelyEvent[] = [];

  for (const book of books) {
    if (book.archivedAt) continue;
    for (const leg of book.handoffs) {
      const base = { bookId: book.id, title: book.title };
      if (!leg.fromFriend) {
        events.push({ ...base, id: `${leg.id}:lent`, at: leg.happenedAt, who: first(book, leg.toFriend), verb: 'lent' });
        continue;
      }
      events.push({
        ...base,
        id: `${leg.id}:sent`,
        at: leg.happenedAt,
        who: first(book, leg.fromFriend),
        verb: 'sent',
        to: first(book, leg.toFriend),
      });
      // Tapping Got it the moment it's sent is a hand-to-hand pass: one event, not two.
      if (leg.receivedAt && leg.receivedAt !== leg.happenedAt) {
        events.push({ ...base, id: `${leg.id}:got`, at: leg.receivedAt, who: first(book, leg.toFriend), verb: 'got' });
      }
    }
  }

  return events.sort((a, b) => Date.parse(b.at) - Date.parse(a.at)).slice(0, limit);
}
