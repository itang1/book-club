import * as React from 'react';

import type { Book, Friend, Friendship, Handoff, Letter } from '../types';
import {
  createBook,
  createFriend,
  createFriendship,
  demoData,
  fetchBookClubData,
  joinLine,
  leaveLine,
  recordHandoff,
  SaveError,
} from './bookClubService';
import { hasFinished, holderId } from './bookState';
import { isDevMode } from './devMode';
import { clearReaderId, loadReaderId, saveReaderId } from './identity';
import { isSupabaseConfigured } from './supabase';

export type NewProfile = { name: string; city: string; region: string };

export type SaveProblem = { action: string; reason: string };

/**
 * Turn the most likely failure into something you can act on. "Not in the
 * schema cache" means the app expects a table or column the database doesn't
 * have yet: the schema has moved on and schema.sql needs re-running.
 */
function explain(reason: string): string {
  if (/schema cache|does not exist/i.test(reason)) {
    return `The database is behind the app (${reason}). Re-run supabase/schema.sql in the Supabase SQL editor.`;
  }

  return reason;
}

/**
 * All of the club's state and every change to it, in one place. Screens get
 * data and callbacks from here and never talk to Supabase themselves.
 *
 * `members` is everyone in the club (the `friends` table); `friendships` is
 * who is friends with whom.
 */
export function useBookClub() {
  // With a backend, start empty rather than flashing the demo group first.
  const [books, setBooks] = React.useState<Book[]>(isSupabaseConfigured ? [] : demoData.books);
  const [members, setMembers] = React.useState<Friend[]>(
    isSupabaseConfigured ? [] : demoData.friends,
  );
  const [friendships, setFriendships] = React.useState<Friendship[]>(
    isSupabaseConfigured ? [] : demoData.friendships,
  );
  const [currentUserId, setCurrentUserId] = React.useState<string | null>(null);
  const [loaded, setLoaded] = React.useState(false);
  const [refreshing, setRefreshing] = React.useState(false);

  const applyData = (data: Awaited<ReturnType<typeof fetchBookClubData>>) => {
    setBooks(data.books);
    setMembers(data.friends);
    setFriendships(data.friendships);
  };

  React.useEffect(() => {
    let active = true;

    Promise.all([loadReaderId(), fetchBookClubData()]).then(([saved, data]) => {
      if (!active) {
        return;
      }

      applyData(data);
      // A remembered reader who's still in the club picks up where they left
      // off. Otherwise: dev mode drops you in as the first member; everyone
      // else gets the welcome screen.
      if (saved && data.friends.some((person) => person.id === saved)) {
        setCurrentUserId(saved);
      } else if (isDevMode) {
        setCurrentUserId(data.friends[0]?.id ?? null);
      }
      setLoaded(true);
    });

    return () => {
      active = false;
    };
  }, []);

  /** Pull to refresh: other people's handoffs only arrive on a fetch. */
  const refresh = async () => {
    setRefreshing(true);
    applyData(await fetchBookClubData());
    setRefreshing(false);
  };

  const chooseReader = (personId: string) => {
    setCurrentUserId(personId);
    saveReaderId(personId);
  };

  /** Dev mode only: forget who's reading, to test the welcome screen. */
  const signOut = () => {
    setCurrentUserId(null);
    clearReaderId();
  };

  /**
   * Writes are optimistic. If one doesn't reach the database, say which one
   * and why, rather than let the screen and the stored data quietly disagree.
   */
  const [saveProblem, setSaveProblem] = React.useState<SaveProblem | null>(null);
  const track = (action: string, write: Promise<SaveError>) => {
    write.then((reason) => {
      if (reason) {
        setSaveProblem({ action, reason: explain(reason) });
      }
    });
  };

  const updateBook = (bookId: string, change: (book: Book) => Book) => {
    setBooks((currentBooks) =>
      currentBooks.map((candidate) => (candidate.id === bookId ? change(candidate) : candidate)),
    );
  };

  const handleAddBook = (book: Book) => {
    setBooks((currentBooks) => [book, ...currentBooks]);
    track(`add ${book.title}`, createBook(book));
  };

  /**
   * Sign the current reader up for a book, at the back of the line. Someone
   * who has read it before can sign up again: their queue entry is reused,
   * back to "waiting" with a fresh position.
   */
  const handleJoinLine = (bookId: string) => {
    const book = books.find((candidate) => candidate.id === bookId);
    const me = members.find((person) => person.id === currentUserId);
    if (!book || !me || holderId(book) === me.id) {
      return;
    }

    const existing = book.queue.find((entry) => entry.id === me.id);
    if (existing && existing.status !== 'done') {
      return;
    }

    const position = Math.max(-1, ...book.queue.map((entry) => entry.position)) + 1;
    updateBook(bookId, (candidate) => ({
      ...candidate,
      queue: [
        ...candidate.queue.filter((entry) => entry.id !== me.id),
        { ...me, position, status: 'waiting' },
      ],
    }));
    track(
      `sign you up for ${book.title}`,
      joinLine({ book_id: bookId, friend_id: me.id, position, status: 'waiting' }),
    );
  };

  const handleLeaveLine = (bookId: string) => {
    const book = books.find((candidate) => candidate.id === bookId);
    if (!book || !currentUserId) {
      return;
    }

    const readBefore = hasFinished(book, currentUserId);
    updateBook(bookId, (candidate) => ({
      ...candidate,
      queue: candidate.queue.flatMap((entry) => {
        if (entry.id !== currentUserId || entry.status !== 'waiting') {
          return [entry];
        }
        return readBefore ? [{ ...entry, status: 'done' as const }] : [];
      }),
    }));
    track(
      `take you out of the line for ${book.title}`,
      leaveLine(bookId, currentUserId, readBefore),
    );
  };

  /**
   * Append a leg to the book's journey: either to whoever is next in line, or
   * home to its owner. History is never rewritten: the new handoff becomes the
   * newest entry, and location follows from it.
   */
  const handleHandOff = (bookId: string, toFriend: string, letter: Letter) => {
    const book = books.find((candidate) => candidate.id === bookId);
    if (!book) {
      return;
    }

    const fromFriend = holderId(book);
    const handoff: Handoff = {
      id: `handoff-${Date.now()}`,
      bookId,
      fromFriend,
      toFriend,
      happenedAt: new Date().toISOString(),
      note: letter.note?.trim() || undefined,
      rating: letter.rating,
    };

    updateBook(bookId, (candidate) => ({
      ...candidate,
      handoffs: [...candidate.handoffs, handoff],
      queue: candidate.queue.map((entry) => {
        if (entry.id === fromFriend) {
          return { ...entry, status: 'done' as const };
        }
        // An owner getting their copy back has already read it.
        if (entry.id === toFriend && entry.status === 'waiting') {
          return { ...entry, status: 'reading' as const };
        }
        return entry;
      }),
    }));

    track(`pass ${book.title} on`, recordHandoff(handoff));
  };

  const addFriend = (otherId: string) => {
    if (!currentUserId || otherId === currentUserId) {
      return;
    }

    const pair: Friendship = [currentUserId, otherId];
    const name = members.find((person) => person.id === otherId)?.name ?? 'them';
    setFriendships((current) => [...current, pair]);
    track(`add ${name} as a friend`, createFriendship(pair));
  };

  /**
   * Someone new joins the club: their own profile, made by them. Stands in
   * for account creation until sign-in exists. If they came from an invite,
   * they start out friends with whoever sent it.
   */
  const createProfile = (profile: NewProfile, invitedBy: string | null) => {
    const person: Friend = {
      id: `friend-${Date.now()}`,
      name: profile.name.trim(),
      city: profile.city.trim(),
      state: profile.region.trim() || '—',
    };

    setMembers((current) => [...current, person]);
    chooseReader(person.id);

    const write = createFriend(person).then((reason) => {
      if (reason || !invitedBy || !members.some((member) => member.id === invitedBy)) {
        return reason;
      }

      const pair: Friendship = [person.id, invitedBy];
      setFriendships((current) => [...current, pair]);
      return createFriendship(pair);
    });
    track('create your profile', write);
  };

  return {
    loaded,
    refreshing,
    books,
    members,
    friendships,
    currentUserId,
    saveProblem,
    dismissSaveProblem: () => setSaveProblem(null),
    refresh,
    chooseReader,
    signOut,
    createProfile,
    addFriend,
    addBook: handleAddBook,
    joinLine: handleJoinLine,
    leaveLine: handleLeaveLine,
    handOff: handleHandOff,
  };
}

export type BookClub = ReturnType<typeof useBookClub>;
