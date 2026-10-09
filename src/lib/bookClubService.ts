import { booksSeed, friends as mockFriends, friendshipsSeed } from '../data/mockData';
import type { Book, Friend, FriendStatus, Friendship, Handoff, ReadingQueueEntry } from '../types';
import { supabase } from './supabase';

/**
 * Supabase returns snake_case columns; the app speaks camelCase. Every row
 * crosses that boundary through an explicit mapper below — casting a raw row
 * to `Book` compiles but lies, and the mismatch only surfaces at runtime.
 */

type FriendRow = {
  id: string;
  name: string;
  city: string;
  state: string;
  user_id: string | null;
  agreed_rules_at: string | null;
};

type BookRow = {
  id: string;
  title: string;
  author: string;
  cover_color: string;
};

export type QueueRow = {
  book_id: string;
  friend_id: string;
  position: number;
  status: FriendStatus;
};

type HandoffRow = {
  id: string;
  book_id: string;
  from_friend: string | null;
  to_friend: string;
  happened_at: string;
  note: string | null;
  rating: number | null;
};

type FriendshipRow = {
  friend_a: string;
  friend_b: string;
};

export type BookClubData = {
  books: Book[];
  friends: Friend[];
  friendships: Friendship[];
  /** Why loading failed, if it did. */
  error?: string;
};

export const demoData: BookClubData = {
  books: booksSeed,
  friends: mockFriends,
  friendships: friendshipsSeed,
};

/**
 * With a backend, a failed load is reported, never papered over with the
 * demo group: showing fictional people to a signed-in member would be worse
 * than showing nothing.
 */
const empty = (error: string): BookClubData => ({
  books: [],
  friends: [],
  friendships: [],
  error,
});

function toFriend(row: FriendRow): Friend {
  return {
    id: row.id,
    name: row.name,
    city: row.city,
    state: row.state,
    userId: row.user_id ?? undefined,
    agreedRulesAt: row.agreed_rules_at ?? undefined,
  };
}

function fromFriend(friend: Friend): FriendRow {
  return {
    id: friend.id,
    name: friend.name,
    city: friend.city,
    state: friend.state,
    user_id: friend.userId ?? null,
    agreed_rules_at: friend.agreedRulesAt ?? null,
  };
}

function toHandoff(row: HandoffRow): Handoff {
  return {
    id: row.id,
    bookId: row.book_id,
    fromFriend: row.from_friend,
    toFriend: row.to_friend,
    happenedAt: row.happened_at,
    note: row.note ?? undefined,
    rating: row.rating ?? undefined,
  };
}

/**
 * Stitch the four tables into the shape the screens expect. A queue row whose
 * friend has been deleted is dropped rather than rendered as a blank reader.
 */
function assembleBooks(
  bookRows: BookRow[],
  friendRows: FriendRow[],
  queueRows: QueueRow[],
  handoffRows: HandoffRow[],
): Book[] {
  const friendsById = new Map(friendRows.map((row) => [row.id, toFriend(row)]));

  return bookRows.map((row) => {
    const queue = queueRows
      .filter((entry) => entry.book_id === row.id)
      .sort((a, b) => a.position - b.position)
      .flatMap<ReadingQueueEntry>((entry) => {
        const friend = friendsById.get(entry.friend_id);
        if (!friend) {
          return [];
        }

        return [{ ...friend, position: entry.position, status: entry.status }];
      });

    return {
      id: row.id,
      title: row.title,
      author: row.author,
      coverColor: row.cover_color,
      queue,
      handoffs: handoffRows
        .filter((entry) => entry.book_id === row.id)
        .map(toHandoff),
    };
  });
}

export async function fetchBookClubData(): Promise<BookClubData> {
  if (!supabase) {
    return demoData;
  }

  try {
    const [booksRes, friendsRes, queueRes, handoffsRes, friendshipsRes] = await Promise.all([
      supabase.from('books').select('*').order('created_at', { ascending: false }),
      supabase.from('friends').select('*').order('name', { ascending: true }),
      supabase.from('reading_queue').select('*'),
      supabase.from('handoffs').select('*').order('happened_at', { ascending: true }),
      supabase.from('friendships').select('friend_a, friend_b'),
    ]);

    const failure = [booksRes, friendsRes, queueRes, handoffsRes].find((res) => res.error);
    if (failure?.error) {
      console.warn('Supabase fetch failed:', failure.error.message);
      return empty(failure.error.message);
    }

    const friendRows = (friendsRes.data ?? []) as FriendRow[];

    // Not fatal: a database from before friendships existed still loads, and
    // everyone just starts with no friends until schema.sql is re-run.
    if (friendshipsRes.error) {
      console.warn('Supabase friendships fetch failed:', friendshipsRes.error.message);
    }
    const friendshipRows = friendshipsRes.error
      ? []
      : ((friendshipsRes.data ?? []) as FriendshipRow[]);

    return {
      books: assembleBooks(
        (booksRes.data ?? []) as BookRow[],
        friendRows,
        (queueRes.data ?? []) as QueueRow[],
        (handoffsRes.data ?? []) as HandoffRow[],
      ),
      friends: friendRows.map(toFriend),
      friendships: friendshipRows.map((row): Friendship => [row.friend_a, row.friend_b]),
    };
  } catch (error) {
    console.warn('Book club fetch error:', error);
    return empty(describe(error));
  }
}

/**
 * Writes are optimistic: the screen updates first, then these run. Each one
 * resolves to null when it reached the database, or to the reason it didn't,
 * so the app can say what went wrong instead of quietly drifting from what's
 * stored. With no backend configured there is nothing to fail.
 */
export type SaveError = string | null;

function describe(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

/**
 * Put a new copy into circulation with its owner (you) holding it. One
 * database call, lend_book(), which writes the book, the owner's place in
 * line and the first leg together, and checks you're signed in as the owner.
 */
export async function createBook(book: Book): Promise<SaveError> {
  if (!supabase) {
    return null;
  }

  const firstLeg = book.handoffs[0];
  if (!firstLeg) {
    return 'A new book needs its first leg.';
  }

  try {
    const { error } = await supabase.rpc('lend_book', {
      p_book_id: book.id,
      p_title: book.title,
      p_author: book.author,
      p_cover_color: book.coverColor,
      p_handoff_id: firstLeg.id,
    });
    if (error) {
      console.warn('Supabase lend_book failed:', error.message);
      return error.message;
    }

    return null;
  } catch (error) {
    console.warn('Lend book error:', error);
    return describe(error);
  }
}

export async function createFriend(friend: Friend): Promise<SaveError> {
  if (!supabase) {
    return null;
  }

  try {
    const { error } = await supabase.from('friends').insert([fromFriend(friend)]);
    if (error) {
      console.warn('Supabase createFriend failed:', error.message);
      return error.message;
    }

    return null;
  } catch (error) {
    console.warn('Create friend error:', error);
    return describe(error);
  }
}

/** Befriend two people, both ways. Stored smaller id first; see schema.sql. */
/** Record that you agreed to the Rules of the Books, and when. */
export async function agreeToRules(personId: string): Promise<SaveError> {
  if (!supabase) {
    return null;
  }

  try {
    const { error } = await supabase
      .from('friends')
      .update({ agreed_rules_at: new Date().toISOString() })
      .eq('id', personId);
    if (error) {
      console.warn('Supabase agreeToRules failed:', error.message);
      return error.message;
    }

    return null;
  } catch (error) {
    console.warn('Agree to rules error:', error);
    return describe(error);
  }
}

export async function createFriendship([a, b]: Friendship): Promise<SaveError> {
  if (!supabase) {
    return null;
  }

  try {
    const row: FriendshipRow = a < b ? { friend_a: a, friend_b: b } : { friend_a: b, friend_b: a };
    const { error } = await supabase
      .from('friendships')
      // DO NOTHING on conflict: needs only the insert grant, and befriending
      // someone twice is harmless.
      .upsert([row], { ignoreDuplicates: true });
    if (error) {
      console.warn('Supabase createFriendship failed:', error.message);
      return error.message;
    }

    return null;
  } catch (error) {
    console.warn('Create friendship error:', error);
    return describe(error);
  }
}

/**
 * Sign someone up for a book, at the back of the line. An upsert, because a
 * past reader signing up again reuses their row: it goes back to "waiting"
 * with a new position. Their earlier read is still in the handoff log.
 */
export async function joinLine(entry: QueueRow): Promise<SaveError> {
  if (!supabase) {
    return null;
  }

  try {
    const { error } = await supabase
      .from('reading_queue')
      .upsert([entry], { onConflict: 'book_id,friend_id' });
    if (error) {
      console.warn('Supabase joinLine failed:', error.message);
      return error.message;
    }

    return null;
  } catch (error) {
    console.warn('Join line error:', error);
    return describe(error);
  }
}

/**
 * Take back a sign-up. Someone who never had the book is removed outright;
 * someone who signed up for a second read goes back to "done", keeping their
 * row so their name stays attached to the history.
 */
export async function leaveLine(
  bookId: string,
  friendId: string,
  readBefore: boolean,
): Promise<SaveError> {
  if (!supabase) {
    return null;
  }

  try {
    const query = supabase.from('reading_queue');
    const { error } = await (readBefore
      ? query.update({ status: 'done' })
      : query.delete()
    )
      .eq('book_id', bookId)
      .eq('friend_id', friendId)
      .eq('status', 'waiting');
    if (error) {
      console.warn('Supabase leaveLine failed:', error.message);
      return error.message;
    }

    return null;
  } catch (error) {
    console.warn('Leave line error:', error);
    return describe(error);
  }
}

/**
 * Append one leg to a book's journey: pass_on() in the database checks that
 * you're the one holding it and that the recipient is in line (or is the
 * owner), then writes the leg and moves both queue statuses together.
 */
export async function recordHandoff(handoff: Handoff): Promise<SaveError> {
  if (!supabase) {
    return null;
  }

  try {
    const { error } = await supabase.rpc('pass_on', {
      p_handoff_id: handoff.id,
      p_book_id: handoff.bookId,
      p_to: handoff.toFriend,
      p_note: handoff.note ?? null,
      p_rating: handoff.rating ?? null,
    });
    if (error) {
      console.warn('Supabase pass_on failed:', error.message);
      return error.message;
    }

    return null;
  } catch (error) {
    console.warn('Pass on error:', error);
    return describe(error);
  }
}
