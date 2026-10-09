import { booksSeed, friends as mockFriends, friendshipsSeed, groupsSeed } from '../data/mockData';
import type {
  Book,
  Friend,
  FriendStatus,
  Friendship,
  Group,
  Handoff,
  ReadingQueueEntry,
} from '../types';
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
  gifted_by: string | null;
  group_id: string | null;
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
  place_city: string | null;
  place_region: string | null;
  received_at: string | null;
};

type FriendshipRow = {
  friend_a: string;
  friend_b: string;
  requested_by: string | null;
  status: Friendship['status'];
};

type GroupRow = {
  id: string;
  name: string;
  invite_code: string;
};

type MemberRow = {
  group_id: string;
  person_id: string;
};

export type BookClubData = {
  books: Book[];
  friends: Friend[];
  friendships: Friendship[];
  groups: Group[];
  /** Why loading failed, if it did. */
  error?: string;
};

export const demoData: BookClubData = {
  books: booksSeed,
  friends: mockFriends,
  friendships: friendshipsSeed,
  groups: groupsSeed,
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
  groups: [],
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
    placeCity: row.place_city ?? undefined,
    placeRegion: row.place_region ?? undefined,
    receivedAt: row.received_at ?? undefined,
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
      giftedBy: row.gifted_by ?? undefined,
      groupId: row.group_id ?? undefined,
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
    const [booksRes, friendsRes, queueRes, handoffsRes, friendshipsRes, groupsRes, membersRes] =
      await Promise.all([
      supabase.from('books').select('*').order('created_at', { ascending: false }),
      supabase.from('friends').select('*').order('name', { ascending: true }),
      supabase.from('reading_queue').select('*'),
      supabase.from('handoffs').select('*').order('happened_at', { ascending: true }),
      supabase.from('friendships').select('friend_a, friend_b, requested_by, status'),
      supabase.from('groups').select('id, name, invite_code').order('name'),
      supabase.from('group_members').select('group_id, person_id'),
    ]);

    const failure = [booksRes, friendsRes, queueRes, handoffsRes, groupsRes, membersRes].find(
      (res) => res.error,
    );
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
      friendships: friendshipRows.map(
        (row): Friendship => ({
          a: row.friend_a,
          b: row.friend_b,
          status: row.status,
          requestedBy: row.requested_by ?? row.friend_a,
        }),
      ),
      groups: ((groupsRes.data ?? []) as GroupRow[]).map((row) => ({
        id: row.id,
        name: row.name,
        inviteCode: row.invite_code,
        memberIds: ((membersRes.data ?? []) as MemberRow[])
          .filter((member) => member.group_id === row.id)
          .map((member) => member.person_id),
      })),
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
      p_gifted_by: book.giftedBy ?? null,
      p_group_id: book.groupId ?? null,
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

/** Run one write and turn its outcome into a SaveError. */
async function save(
  label: string,
  run: (client: NonNullable<typeof supabase>) => PromiseLike<{ error: { message: string } | null }>,
): Promise<SaveError> {
  if (!supabase) {
    return null;
  }

  try {
    const { error } = await run(supabase);
    if (error) {
      console.warn(`Supabase ${label} failed:`, error.message);
      return error.message;
    }
    return null;
  } catch (error) {
    console.warn(`${label} error:`, error);
    return describe(error);
  }
}

/** Record that you agreed to the Rules of the Books, and when. */
export const agreeToRules = (personId: string) =>
  save('agreeToRules', (db) =>
    db.from('friends').update({ agreed_rules_at: new Date().toISOString() }).eq('id', personId),
  );

/** Rows store each pair once, smaller id first (see schema.sql). */
const pairOf = (x: string, y: string) =>
  x < y ? { friend_a: x, friend_b: y } : { friend_a: y, friend_b: x };

/** Ask to be friends. It waits as "pending" until they accept. */
export const requestFriend = (me: string, them: string) =>
  save('requestFriend', (db) =>
    db.from('friendships').insert([{ ...pairOf(me, them), requested_by: me, status: 'pending' }]),
  );

export const acceptFriend = (me: string, them: string) =>
  save('acceptFriend', (db) =>
    db.from('friendships').update({ status: 'accepted' }).match(pairOf(me, them)),
  );

/** Decline, cancel or unfriend: the row just goes. Nobody is told. */
export const removeFriendship = (me: string, them: string) =>
  save('removeFriendship', (db) => db.from('friendships').delete().match(pairOf(me, them)));

export const createGroup = (id: string, name: string) =>
  save('createGroup', (db) => db.rpc('create_group', { p_group_id: id, p_name: name }));

export const joinGroup = (inviteCode: string) =>
  save('joinGroup', (db) => db.rpc('join_group', { p_invite_code: inviteCode }));

export const leaveGroup = (groupId: string) =>
  save('leaveGroup', (db) => db.rpc('leave_group', { p_group_id: groupId }));

/** The group behind an invite code, for "You're invited to …". */
export async function groupPreview(
  inviteCode: string,
): Promise<{ id: string; name: string; members: number } | null> {
  if (!supabase) {
    const group = groupsSeed.find((candidate) => candidate.inviteCode === inviteCode);
    return group ? { id: group.id, name: group.name, members: group.memberIds.length } : null;
  }

  const { data } = await supabase.rpc('group_preview', { p_invite_code: inviteCode });
  return (data as { id: string; name: string; members: number }[] | null)?.[0] ?? null;
}

/** People in the invited group who haven't signed in yet: "That's me". */
export async function unclaimedInGroup(
  inviteCode: string,
): Promise<{ id: string; name: string; city: string }[]> {
  if (!supabase) {
    return [];
  }

  const { data } = await supabase.rpc('unclaimed_in_group', { p_invite_code: inviteCode });
  return (data as { id: string; name: string; city: string }[] | null) ?? [];
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

/** "Got it": the book posted to you has arrived. */
export async function markReceived(bookId: string): Promise<SaveError> {
  if (!supabase) {
    return null;
  }

  try {
    const { error } = await supabase.rpc('mark_received', { p_book_id: bookId });
    if (error) {
      console.warn('Supabase mark_received failed:', error.message);
      return error.message;
    }

    return null;
  } catch (error) {
    console.warn('Mark received error:', error);
    return describe(error);
  }
}

/** Change your own name or city. Past stops keep the city they had. */
export async function updateProfile(person: Friend): Promise<SaveError> {
  if (!supabase) {
    return null;
  }

  try {
    const { error } = await supabase
      .from('friends')
      .update({ name: person.name, city: person.city, state: person.state })
      .eq('id', person.id);
    if (error) {
      console.warn('Supabase updateProfile failed:', error.message);
      return error.message;
    }

    return null;
  } catch (error) {
    console.warn('Update profile error:', error);
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
