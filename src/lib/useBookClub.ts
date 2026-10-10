import * as React from 'react';
import { AppState, Platform } from 'react-native';
import type { Session } from '@supabase/supabase-js';

import type { Book, EmailPrefs, Friend, Friendship, Group, Handoff, Letter } from '../types';
import {
  acceptFriend,
  agreeToRules,
  createBook,
  createFriend,
  createGroup,
  demoData,
  fetchBookClubData,
  joinGroup,
  joinLine,
  leaveGroup,
  leaveLine,
  removeFriendship,
  requestFriend,
  setCover,
  markReceived,
  recordHandoff,
  updateEmailPrefs,
  updateFriendRequestsFrom,
  updateProfile,
  SaveError,
} from './bookClubService';
import type { BookClubData } from './bookClubService';
import { claimProfile, onSessionChange, signOutEverywhere } from './auth';
import { findCoverUrl } from './covers';
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
    return `The app is a step ahead of the database (${reason}). Re-run supabase/schema.sql in the Supabase SQL editor to catch it up.`;
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
/** Real accounts whenever there's a backend; local make-believe otherwise. */
const usesAccounts = isSupabaseConfigured;

export function useBookClub() {
  // With a backend, start empty rather than flashing the demo group first.
  const [books, setBooks] = React.useState<Book[]>(isSupabaseConfigured ? [] : demoData.books);
  const [members, setMembers] = React.useState<Friend[]>(
    isSupabaseConfigured ? [] : demoData.friends,
  );
  const [friendships, setFriendships] = React.useState<Friendship[]>(
    isSupabaseConfigured ? [] : demoData.friendships,
  );
  const [groups, setGroups] = React.useState<Group[]>(
    isSupabaseConfigured ? [] : demoData.groups,
  );
  const [currentUserId, setCurrentUserId] = React.useState<string | null>(null);
  const [loaded, setLoaded] = React.useState(false);
  const [refreshing, setRefreshing] = React.useState(false);
  /** The signed-in account, when the club runs on Supabase. */
  const [session, setSession] = React.useState<Session | null>(null);

  /**
   * Writes are optimistic. If one doesn't reach the database, say which one
   * and why, rather than let the screen and the stored data quietly disagree.
   */
  const [saveProblem, setSaveProblem] = React.useState<SaveProblem | null>(null);
  const track = (action: string, write: Promise<SaveError>) => {
    write.then((reason) => {
      if (reason) {
        setSaveProblem({ action, reason: explain(reason) });
        // The screen already shows the change; reload so it shows what was
        // actually saved instead.
        fetchBookClubData().then(applyData);
      }
    });
  };

  const applyData = (data: BookClubData) => {
    setBooks(data.books);
    setMembers(data.friends);
    setFriendships(data.friendships);
    setGroups(data.groups);
    if (data.error) {
      setSaveProblem({ action: 'load the club', reason: explain(data.error) });
    }
  };

  React.useEffect(() => {
    let active = true;

    // Demo data (no Supabase): who you are is a local choice, remembered on
    // this device. Dev mode drops you in as the first member.
    if (!usesAccounts) {
      Promise.all([loadReaderId(), fetchBookClubData()]).then(([saved, data]) => {
        if (!active) {
          return;
        }

        applyData(data);
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
    }

    // Supabase: who you are is whoever is signed in. The listener fires once
    // straight away with the stored session, then on every sign-in/out.
    // Token refreshes keep the same user, so they don't trigger a reload.
    let lastUserId: string | null | undefined;
    const stop = onSessionChange(async (next) => {
      const userId = next?.user.id ?? null;
      if (!active || userId === lastUserId) {
        return;
      }
      lastUserId = userId;
      setSession(next);

      if (!next) {
        applyData({ books: [], friends: [], friendships: [], groups: [] });
        setCurrentUserId(null);
        setLoaded(true);
        return;
      }

      const [claim, data] = await Promise.all([claimProfile(), fetchBookClubData()]);
      if (!active) {
        return;
      }

      applyData(data);
      setCurrentUserId(claim.personId);
      setLoaded(true);
    });

    return () => {
      active = false;
      stop();
    };
  }, []);

  /** Pull to refresh: other people's handoffs only arrive on a fetch. */
  const refresh = async () => {
    setRefreshing(true);
    applyData(await fetchBookClubData());
    setRefreshing(false);
  };

  /**
   * Keep what's on screen current without anyone having to reload: fetch
   * again whenever the app comes back into view (switching back to the tab
   * or app), and every minute while it's open. Other people's handoffs,
   * new members and new groups only arrive on a fetch. Quiet: no spinner.
   */
  const signedInRef = React.useRef(false);
  signedInRef.current = usesAccounts ? session !== null && currentUserId !== null : false;
  React.useEffect(() => {
    if (!usesAccounts) {
      return;
    }

    const quietRefresh = () => {
      if (signedInRef.current) {
        fetchBookClubData().then((data) => {
          // A failed background fetch shouldn't blank the screen or nag.
          if (!data.error) {
            applyData(data);
          }
        });
      }
    };

    const interval = setInterval(quietRefresh, 60_000);
    const appState = AppState.addEventListener('change', (state) => {
      if (state === 'active') {
        quietRefresh();
      }
    });
    const onVisible = () => {
      if (typeof document !== 'undefined' && document.visibilityState === 'visible') {
        quietRefresh();
      }
    };
    if (Platform.OS === 'web' && typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', onVisible);
    }

    return () => {
      clearInterval(interval);
      appState.remove();
      if (Platform.OS === 'web' && typeof document !== 'undefined') {
        document.removeEventListener('visibilitychange', onVisible);
      }
    };
  }, []);

  /** Demo mode only: become someone else (the dev bar). */
  const chooseReader = (personId: string) => {
    setCurrentUserId(personId);
    saveReaderId(personId);
  };

  /**
   * "That's me": someone already in the club takes their profile. With real
   * accounts the database links it to this account (refused if someone else
   * got there first); on demo data it's a local choice.
   */
  const claimExisting = async (personId: string, inviteCode: string | null) => {
    if (!usesAccounts) {
      chooseReader(personId);
      return;
    }

    const claim = await claimProfile(personId, inviteCode ?? undefined);
    if (claim.error || !claim.personId) {
      setSaveProblem({ action: 'claim that profile', reason: claim.error ?? 'Unknown error' });
      return;
    }

    // They can see their club now; load it.
    applyData(await fetchBookClubData());
    setCurrentUserId(claim.personId);
  };

  /** "I agree" on the Rules of the Books, once per person. */
  const handleAgreeToRules = () => {
    if (!currentUserId) {
      return;
    }

    const at = new Date().toISOString();
    setMembers((current) =>
      current.map((person) =>
        person.id === currentUserId ? { ...person, agreedRulesAt: at } : person,
      ),
    );
    track('save that you agreed to the rules', agreeToRules(currentUserId));
  };

  /** Signs out of the account, or in demo mode forgets the local choice. */
  const signOut = () => {
    if (usesAccounts) {
      signOutEverywhere();
      return;
    }

    setCurrentUserId(null);
    clearReaderId();
  };

  const updateBook = (bookId: string, change: (book: Book) => Book) => {
    setBooks((currentBooks) =>
      currentBooks.map((candidate) => (candidate.id === bookId ? change(candidate) : candidate)),
    );
  };

  const handleAddBook = (book: Book) => {
    setBooks((currentBooks) => [book, ...currentBooks]);
    // Lend straight away; find the cover alongside and add it once both
    // are done, so a slow lookup never holds up lending.
    const cover = findCoverUrl(book.title, book.author);
    track(
      `add ${book.title}`,
      createBook(book).then(async (reason) => {
        const url = await cover;
        if (reason || !url) {
          return reason;
        }
        updateBook(book.id, (candidate) => ({ ...candidate, coverUrl: url }));
        return setCover(book.id, url);
      }),
    );
  };

  /** Owner only: find a cover now, or go back to the colour swatch. */
  const handleChangeCover = async (bookId: string, mode: 'find' | 'clear') => {
    const book = books.find((candidate) => candidate.id === bookId);
    if (!book) {
      return;
    }

    const url = mode === 'find' ? await findCoverUrl(book.title, book.author) : null;
    if (mode === 'find' && !url) {
      setSaveProblem({
        action: `find a cover for ${book.title}`,
        reason: 'The colour swatch stays for now; try again once Open Library adds this cover.',
      });
      return;
    }

    updateBook(bookId, (candidate) => ({ ...candidate, coverUrl: url ?? undefined }));
    track(mode === 'find' ? 'add the cover' : 'remove the cover', setCover(bookId, url));
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
    const recipient = members.find((person) => person.id === toFriend);
    const now = new Date().toISOString();
    // Sent, not yet received: it's in the post until they tap Got it.
    const handoff: Handoff = {
      id: `handoff-${Date.now()}`,
      bookId,
      fromFriend,
      toFriend,
      happenedAt: now,
      note: letter.note?.trim() || undefined,
      rating: letter.rating,
      placeCity: recipient?.city,
      placeRegion: recipient?.state,
    };

    updateBook(bookId, (candidate) => ({
      ...candidate,
      // Passing it on means you had it, even if you never tapped Got it.
      handoffs: [
        ...candidate.handoffs.map((leg) =>
          leg.toFriend === fromFriend && !leg.receivedAt ? { ...leg, receivedAt: now } : leg,
        ),
        handoff,
      ],
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

  /** "Got it": the book posted to you has arrived, here, now. */
  const handleMarkReceived = (bookId: string) => {
    const book = books.find((candidate) => candidate.id === bookId);
    const me = members.find((person) => person.id === currentUserId);
    if (!book || !me) {
      return;
    }

    const now = new Date().toISOString();
    updateBook(bookId, (candidate) => ({
      ...candidate,
      handoffs: candidate.handoffs.map((leg) =>
        leg.toFriend === me.id && !leg.receivedAt
          ? { ...leg, receivedAt: now, placeCity: me.city, placeRegion: me.state }
          : leg,
      ),
    }));
    track(`mark ${book.title} as arrived`, markReceived(bookId));
  };

  /** Which emails you get. */
  const handleUpdateEmailPrefs = (prefs: EmailPrefs) => {
    if (!currentUserId) {
      return;
    }

    setMembers((current) =>
      current.map((person) => (person.id === currentUserId ? { ...person, emails: prefs } : person)),
    );
    track('save your email settings', updateEmailPrefs(currentUserId, prefs));
  };

  /** Take friend requests from groupmates, or from nobody. */
  const handleUpdateFriendRequestsFrom = (value: 'groups' | 'nobody') => {
    if (!currentUserId) {
      return;
    }

    setMembers((current) =>
      current.map((person) =>
        person.id === currentUserId ? { ...person, friendRequestsFrom: value } : person,
      ),
    );
    track('save who can send you requests', updateFriendRequestsFrom(currentUserId, value));
  };

  /** Edit your own name or city. Past stops keep the city they were read in. */
  const handleUpdateProfile = (changes: Pick<Friend, 'name' | 'city' | 'state'>) => {
    const me = members.find((person) => person.id === currentUserId);
    if (!me) {
      return;
    }

    const updated = { ...me, ...changes };
    setMembers((current) => current.map((person) => (person.id === me.id ? updated : person)));
    // The line and the cards read names and cities off each book's queue.
    setBooks((current) =>
      current.map((book) => ({
        ...book,
        queue: book.queue.map((entry) => (entry.id === me.id ? { ...entry, ...changes } : entry)),
      })),
    );
    track('save your profile', updateProfile(updated));
  };

  const nameOf = (personId: string) =>
    members.find((person) => person.id === personId)?.name.split(' ')[0] ?? 'them';
  const samePair = (friendship: Friendship, x: string, y: string) =>
    (friendship.a === x && friendship.b === y) || (friendship.a === y && friendship.b === x);

  /** Ask to be friends; it's pending until they accept. */
  const handleRequestFriend = (otherId: string) => {
    if (!currentUserId || otherId === currentUserId) {
      return;
    }

    const [a, b] = currentUserId < otherId ? [currentUserId, otherId] : [otherId, currentUserId];
    setFriendships((current) => [
      ...current,
      { a, b, status: 'pending', requestedBy: currentUserId },
    ]);
    track(`ask ${nameOf(otherId)} to be friends`, requestFriend(currentUserId, otherId));
  };

  const handleAcceptFriend = (otherId: string) => {
    if (!currentUserId) {
      return;
    }

    setFriendships((current) =>
      current.map((friendship) =>
        samePair(friendship, currentUserId, otherId) ? { ...friendship, status: 'accepted' } : friendship,
      ),
    );
    track(`accept ${nameOf(otherId)}`, acceptFriend(currentUserId, otherId));
  };

  /** Decline a request, cancel yours, or unfriend: all the same, all silent. */
  const handleRemoveFriend = (otherId: string) => {
    if (!currentUserId) {
      return;
    }

    setFriendships((current) =>
      current.filter((friendship) => !samePair(friendship, currentUserId, otherId)),
    );
    track(`update things with ${nameOf(otherId)}`, removeFriendship(currentUserId, otherId));
  };

  /** Start a group with you in it. */
  const handleCreateGroup = (name: string): string | null => {
    if (!currentUserId || !name.trim()) {
      return null;
    }

    const id = `group-${Date.now()}`;
    setGroups((current) => [
      ...current,
      // The real invite code is made by the database; it arrives on refresh.
      { id, name: name.trim(), inviteCode: '', memberIds: [currentUserId] },
    ]);
    track(
      `start ${name.trim()}`,
      createGroup(id, name.trim()).then((reason) => {
        if (!reason) {
          fetchBookClubData().then(applyData);
        }
        return reason;
      }),
    );
    return id;
  };

  /** Join from an invite link, then load what the group can now see. */
  const handleJoinGroup = (inviteCode: string) => {
    if (!usesAccounts) {
      return;
    }

    track(
      'join the group',
      joinGroup(inviteCode).then((reason) => {
        if (!reason) {
          fetchBookClubData().then(applyData);
        }
        return reason;
      }),
    );
  };

  const handleLeaveGroup = (groupId: string) => {
    if (!currentUserId) {
      return;
    }

    const name = groups.find((group) => group.id === groupId)?.name ?? 'the group';
    setGroups((current) => current.filter((group) => group.id !== groupId));
    track(
      `leave ${name}`,
      leaveGroup(groupId).then((reason) => {
        fetchBookClubData().then(applyData);
        return reason;
      }),
    );
  };

  /**
   * Someone new joins: their own profile, made by them and tied to their
   * account. If they came from an invite link, they join that group too.
   */
  const createProfile = (profile: NewProfile, inviteCode: string | null) => {
    const person: Friend = {
      id: `friend-${Date.now()}`,
      name: profile.name.trim(),
      city: profile.city.trim(),
      state: profile.region.trim() || '—',
      userId: session?.user.id,
    };

    setMembers((current) => [...current, person]);
    if (usesAccounts) {
      setCurrentUserId(person.id);
    } else {
      chooseReader(person.id);
    }

    const write = createFriend(person).then(async (reason) => {
      if (reason || !inviteCode || !usesAccounts) {
        return reason;
      }

      const joined = await joinGroup(inviteCode);
      if (!joined) {
        applyData(await fetchBookClubData());
      }
      return joined;
    });
    track('create your profile', write);
  };

  return {
    usesAccounts,
    signedIn: session !== null,
    email: session?.user.email ?? null,
    loaded,
    refreshing,
    books,
    members,
    friendships,
    groups,
    currentUserId,
    saveProblem,
    dismissSaveProblem: () => setSaveProblem(null),
    refresh,
    chooseReader,
    claimExisting,
    agreeToRules: handleAgreeToRules,
    signOut,
    createProfile,
    requestFriend: handleRequestFriend,
    acceptFriend: handleAcceptFriend,
    removeFriend: handleRemoveFriend,
    createGroup: handleCreateGroup,
    joinGroup: handleJoinGroup,
    leaveGroup: handleLeaveGroup,
    addBook: handleAddBook,
    changeCover: handleChangeCover,
    joinLine: handleJoinLine,
    markReceived: handleMarkReceived,
    updateProfile: handleUpdateProfile,
    updateEmailPrefs: handleUpdateEmailPrefs,
    updateFriendRequestsFrom: handleUpdateFriendRequestsFrom,
    leaveLine: handleLeaveLine,
    handOff: handleHandOff,
  };
}

export type BookClub = ReturnType<typeof useBookClub>;
