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
  status: Book['status'];
};

type QueueRow = {
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
  };
}

function fromHandoff(handoff: Handoff): HandoffRow {
  return {
    id: handoff.id,
    book_id: handoff.bookId,
    from_friend: handoff.fromFriend,
    to_friend: handoff.toFriend,
    happened_at: handoff.happenedAt,
  };
}

function fromBook(book: Book): BookRow {
  return {
    id: book.id,
    title: book.title,
    author: book.author,
    cover_color: book.coverColor,
    status: book.status,
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
      status: row.status,
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

export async function createBook(book: Book): Promise<void> {
  if (!supabase) {
    return;
  }

  try {
    const { error } = await supabase.from('books').insert([fromBook(book)]);
    if (error) {
      console.warn('Supabase createBook failed:', error.message);
      return;
    }

    const queue = queueRowsFor(book);
    if (queue.length > 0) {
      const { error: queueError } = await supabase.from('reading_queue').insert(queue);
      if (queueError) {
        console.warn('Supabase queue insert failed:', queueError.message);
      }
    }

    if (book.handoffs.length > 0) {
      const { error: handoffError } = await supabase
        .from('handoffs')
        .insert(book.handoffs.map(fromHandoff));
      if (handoffError) {
        console.warn('Supabase handoff insert failed:', handoffError.message);
      }
    }
  } catch (error) {
    console.warn('Create book error:', error);
  }
}

export async function createFriend(friend: Friend): Promise<void> {
  if (!supabase) {
    return;
  }

  try {
    const { error } = await supabase.from('friends').insert([fromFriend(friend)]);
    if (error) {
      console.warn('Supabase createFriend failed:', error.message);
    }
  } catch (error) {
    console.warn('Create friend error:', error);
  }
}

/**
 * Append one leg to a book's journey and move the queue statuses along with it.
 * The handoff row is the source of truth for location; the queue statuses are
 * a convenience for the UI.
 */
export async function recordHandoff(
  handoff: Handoff,
  bookStatus: Book['status'],
): Promise<void> {
  if (!supabase) {
    return;
  }

  try {
    const { error } = await supabase.from('handoffs').insert([fromHandoff(handoff)]);
    if (error) {
      console.warn('Supabase recordHandoff failed:', error.message);
      return;
    }

    await supabase
      .from('books')
      .update({ status: bookStatus })
      .eq('id', handoff.bookId);

    if (handoff.fromFriend) {
      await supabase
        .from('reading_queue')
        .update({ status: 'done' })
        .eq('book_id', handoff.bookId)
        .eq('friend_id', handoff.fromFriend);
    }

    await supabase
      .from('reading_queue')
      .update({ status: 'reading' })
      .eq('book_id', handoff.bookId)
      .eq('friend_id', handoff.toFriend);
  } catch (error) {
    console.warn('Record handoff error:', error);
  }
}
