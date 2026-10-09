import { booksSeed, friends as mockFriends } from '../data/mockData';
import type { Book, Friend, FriendStatus, Handoff, ReadingQueueEntry } from '../types';
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
  address: string | null;
  email: string | null;
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

export type BookClubData = {
  books: Book[];
  friends: Friend[];
};

const fallback: BookClubData = {
  books: booksSeed,
  friends: mockFriends,
};

function toFriend(row: FriendRow): Friend {
  return {
    id: row.id,
    name: row.name,
    city: row.city,
    state: row.state,
    address: row.address ?? undefined,
    email: row.email ?? undefined,
  };
}

function fromFriend(friend: Friend): FriendRow {
  return {
    id: friend.id,
    name: friend.name,
    city: friend.city,
    state: friend.state,
    address: friend.address ?? null,
    email: friend.email ?? null,
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

function fromHandoff(handoff: Handoff): HandoffRow {
  return {
    id: handoff.id,
    book_id: handoff.bookId,
    from_friend: handoff.fromFriend,
    to_friend: handoff.toFriend,
    happened_at: handoff.happenedAt,
    note: handoff.note ?? null,
    rating: handoff.rating ?? null,
  };
}

function fromBook(book: Book): BookRow {
  return {
    id: book.id,
    title: book.title,
    author: book.author,
    cover_color: book.coverColor,
  };
}

function queueRowsFor(book: Book): QueueRow[] {
  return book.queue.map((entry) => ({
    book_id: book.id,
    friend_id: entry.id,
    position: entry.position,
    status: entry.status,
  }));
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
    return fallback;
  }

  try {
    const [booksRes, friendsRes, queueRes, handoffsRes] = await Promise.all([
      supabase.from('books').select('*').order('created_at', { ascending: false }),
      supabase.from('friends').select('*').order('name', { ascending: true }),
      supabase.from('reading_queue').select('*'),
      supabase.from('handoffs').select('*').order('happened_at', { ascending: true }),
    ]);

    const failure = [booksRes, friendsRes, queueRes, handoffsRes].find((res) => res.error);
    if (failure?.error) {
      console.warn('Supabase fetch failed, using mock data:', failure.error.message);
      return fallback;
    }

    const friendRows = (friendsRes.data ?? []) as FriendRow[];

    return {
      books: assembleBooks(
        (booksRes.data ?? []) as BookRow[],
        friendRows,
        (queueRes.data ?? []) as QueueRow[],
        (handoffsRes.data ?? []) as HandoffRow[],
      ),
      friends: friendRows.map(toFriend),
    };
  } catch (error) {
    console.warn('Book club fetch error, using mock data:', error);
    return fallback;
  }
}

/**
 * Writes are optimistic: the screen updates first, then these run. Each one
 * resolves to whether it reached the database, so the app can say so instead
 * of quietly drifting from what's stored. With no backend configured there is
 * nothing to fail, so they resolve true.
 */

export async function createBook(book: Book): Promise<boolean> {
  if (!supabase) {
    return true;
  }

  try {
    const { error } = await supabase.from('books').insert([fromBook(book)]);
    if (error) {
      console.warn('Supabase createBook failed:', error.message);
      return false;
    }

    const queue = queueRowsFor(book);
    if (queue.length > 0) {
      const { error: queueError } = await supabase.from('reading_queue').insert(queue);
      if (queueError) {
        console.warn('Supabase queue insert failed:', queueError.message);
        return false;
      }
    }

    if (book.handoffs.length > 0) {
      const { error: handoffError } = await supabase
        .from('handoffs')
        .insert(book.handoffs.map(fromHandoff));
      if (handoffError) {
        console.warn('Supabase handoff insert failed:', handoffError.message);
        return false;
      }
    }

    return true;
  } catch (error) {
    console.warn('Create book error:', error);
    return false;
  }
}

export async function createFriend(friend: Friend): Promise<boolean> {
  if (!supabase) {
    return true;
  }

  try {
    const { error } = await supabase.from('friends').insert([fromFriend(friend)]);
    if (error) {
      console.warn('Supabase createFriend failed:', error.message);
      return false;
    }

    return true;
  } catch (error) {
    console.warn('Create friend error:', error);
    return false;
  }
}

/**
 * Sign someone up for a book, at the back of the line. An upsert, because a
 * past reader signing up again reuses their row: it goes back to "waiting"
 * with a new position. Their earlier read is still in the handoff log.
 */
export async function joinLine(entry: QueueRow): Promise<boolean> {
  if (!supabase) {
    return true;
  }

  try {
    const { error } = await supabase
      .from('reading_queue')
      .upsert([entry], { onConflict: 'book_id,friend_id' });
    if (error) {
      console.warn('Supabase joinLine failed:', error.message);
      return false;
    }

    return true;
  } catch (error) {
    console.warn('Join line error:', error);
    return false;
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
): Promise<boolean> {
  if (!supabase) {
    return true;
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
      return false;
    }

    return true;
  } catch (error) {
    console.warn('Leave line error:', error);
    return false;
  }
}

/**
 * Append one leg to a book's journey and move the queue statuses along with it.
 * The handoff row is the source of truth for location; the queue statuses are
 * a convenience for the UI.
 *
 * Only a *waiting* recipient becomes "reading": a copy going home to an owner
 * who already read it leaves their "done" alone.
 */
export async function recordHandoff(handoff: Handoff): Promise<boolean> {
  if (!supabase) {
    return true;
  }

  try {
    const { error } = await supabase.from('handoffs').insert([fromHandoff(handoff)]);
    if (error) {
      console.warn('Supabase recordHandoff failed:', error.message);
      return false;
    }

    if (handoff.fromFriend) {
      const { error: fromError } = await supabase
        .from('reading_queue')
        .update({ status: 'done' })
        .eq('book_id', handoff.bookId)
        .eq('friend_id', handoff.fromFriend);
      if (fromError) {
        console.warn('Supabase queue update failed:', fromError.message);
        return false;
      }
    }

    const { error: toError } = await supabase
      .from('reading_queue')
      .update({ status: 'reading' })
      .eq('book_id', handoff.bookId)
      .eq('friend_id', handoff.toFriend)
      .eq('status', 'waiting');
    if (toError) {
      console.warn('Supabase queue update failed:', toError.message);
      return false;
    }

    return true;
  } catch (error) {
    console.warn('Record handoff error:', error);
    return false;
  }
}
