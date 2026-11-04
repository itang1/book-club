import * as React from 'react';
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
  leaveGroup,
  renameGroup,
  removeFromGroup,
  handOverGroup,
  resetInviteCode,
  setGroupPace,
  removeFriendship,
  requestFriend,
  retireBook,
  unretireBook,
  callHome,
  cancelCallHome,
  setCover,
  updateBookDetails,
  updateEmailPrefs,
  updateFriendRequestsFrom,
  updateProfile,
  SaveError,
} from './bookClubService';
import type { BookClubData } from './bookClubService';
import { claimProfile, deleteMyAccount, onSessionChange, signOutEverywhere } from './auth';
import { clearCachedClubData, loadCachedClubData, saveCachedClubData } from './cache';
import { findCoverUrl } from './covers';
import { hasFinished, holderId } from './bookState';
import { isDevMode } from './devMode';
import { clearInviteFromUrl } from './invite';
import { clearReaderId, loadReaderId, saveReaderId } from './identity';
import { isSupabaseConfigured } from './supabase';
import type { OutboxEntry, OutboxOp } from './outbox';
import { clubOutbox as outbox, listenToOutbox } from './clubOutbox';
import { withJoined, withLeft, withPassedOn, withReceived } from './journeyChanges';
import { useLiveRefresh } from './useLiveRefresh';
import { countMilestone } from './analytics';

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
  const [groups, setGroups] = React.useState<Group[]>(isSupabaseConfigured ? [] : demoData.groups);
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
  /** Changes made without a connection, waiting on the device to go. */
  const [pendingSaves, setPendingSaves] = React.useState(0);
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

  /** Like track(), for changes that can wait for a connection if there isn't one. */
  const trackOrQueue = (action: string, op: OutboxOp) => track(action, outbox.submit(action, op));

  const applyData = (data: BookClubData) => {
    // If an error occurred and we already have cached content on screen, keep it.
    if (data.error && books.length > 0) {
      setSaveProblem({ action: 'load the club', reason: explain(data.error) });
      return;
    }
    setBooks(data.books);
    setMembers(data.friends);
    setFriendships(data.friendships);
    setGroups(data.groups);
    if (data.error) {
      setSaveProblem({ action: 'load the club', reason: explain(data.error) });
    } else {
      saveCachedClubData(data);
    }
  }; // Effects (startup, the session listener, background refreshes) outlive the
  // render they were set up in; this lets them apply data with today's state.
  const applyDataFromEffect = React.useEffectEvent(applyData);

  // Changes waiting for a connection: how many, and what became of them.
  const onOutboxRefused = React.useEffectEvent((entry: OutboxEntry, reason: string) => {
    setSaveProblem({ action: entry.label, reason: explain(reason) });
    fetchBookClubData().then(applyData);
  });
  const onOutboxDrained = React.useEffectEvent(() => {
    fetchBookClubData().then(applyData);
  });
  React.useEffect(
    () =>
      listenToOutbox({
        pending: setPendingSaves,
        refused: (entry, reason) => onOutboxRefused(entry, reason),
        drained: () => onOutboxDrained(),
      }),
    [],
  );

  // Signed in (again): send whatever was left waiting, even from before a reload.
  React.useEffect(() => {
    if (session !== null && currentUserId !== null) {
      outbox.flush();
    }
  }, [session, currentUserId]);

  React.useEffect(() => {
    let active = true;

    // Demo data (no Supabase): who you are is a local choice, remembered on
    // this device. Dev mode drops you in as the first member.
    if (!usesAccounts) {
      Promise.all([loadReaderId(), fetchBookClubData()]).then(([saved, data]) => {
        if (!active) {
          return;
        }

        applyDataFromEffect(data);
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

    // Start with cached data so the shelf renders immediately.
    loadCachedClubData().then((cached) => {
      if (cached && active) {
        setBooks(cached.books);
        setMembers(cached.friends);
        setFriendships(cached.friendships);
        setGroups(cached.groups);
      }
    });

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
        clearCachedClubData();
        outbox.clear();
        applyDataFromEffect({ books: [], friends: [], friendships: [], groups: [] });
        setCurrentUserId(null);
        setLoaded(true);
        return;
      }

      const [claim, data] = await Promise.all([claimProfile(), fetchBookClubData()]);
      if (!active) {
        return;
      }

      applyDataFromEffect(data);
      setCurrentUserId(claim.personId);
      setLoaded(true);
    });

    return () => {
      active = false;
      stop();
    };
  }, []);

  const refresh = async () => {
    setRefreshing(true);
    applyData(await fetchBookClubData());
    setRefreshing(false);
  };

  /**
   * Keep what's on screen current without anyone having to reload: fetch
   * again on realtime changes, app focus, and on a timer while open.
   */
  const quietFetch = async () => {
    if (session !== null && currentUserId !== null) {
      // Send anything that was waiting for a connection before looking again.
      await outbox.flush();
      const data = await fetchBookClubData();
      // A failed background fetch shouldn't blank the screen or nag.
      if (!data.error) {
        applyDataFromEffect(data);
      }
    }
  };
  useLiveRefresh(usesAccounts, quietFetch);

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

    // The claim used the invite, so the join prompt shouldn't offer it again.
    clearInviteFromUrl();
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
        if (!reason) {
          countMilestone('book-lent');
        }
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
    updateBook(bookId, (candidate) => withJoined(candidate, me, position));
    trackOrQueue(`sign you up for ${book.title}`, {
      kind: 'joinLine',
      entry: { book_id: bookId, friend_id: me.id, position, status: 'waiting' },
    });
  };

  const handleLeaveLine = (bookId: string) => {
    const book = books.find((candidate) => candidate.id === bookId);
    if (!book || !currentUserId) {
      return;
    }

    const readBefore = hasFinished(book, currentUserId);
    updateBook(bookId, (candidate) => withLeft(candidate, currentUserId, readBefore));
    trackOrQueue(`take you out of the line for ${book.title}`, {
      kind: 'leaveLine',
      bookId,
      friendId: currentUserId,
      readBefore,
    });
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

    updateBook(bookId, (candidate) => withPassedOn(candidate, handoff));

    countMilestone('passed-on');
    trackOrQueue(`pass ${book.title} on`, {
      kind: 'passOn',
      handoffId: handoff.id,
      bookId,
      to: toFriend,
      note: handoff.note ?? null,
      rating: handoff.rating ?? null,
    });
  };

  /** "Got it": the book posted to you has arrived, here, now. */
  const handleMarkReceived = (bookId: string) => {
    const book = books.find((candidate) => candidate.id === bookId);
    const me = members.find((person) => person.id === currentUserId);
    if (!book || !me) {
      return;
    }

    const now = new Date().toISOString();
    updateBook(bookId, (candidate) => withReceived(candidate, me, now));
    trackOrQueue(`mark ${book.title} as arrived`, { kind: 'markReceived', bookId });
  };

  const handleUpdateEmailPrefs = (prefs: EmailPrefs) => {
    if (!currentUserId) {
      return;
    }

    setMembers((current) =>
      current.map((person) =>
        person.id === currentUserId ? { ...person, emails: prefs } : person,
      ),
    );
    track('save your email settings', updateEmailPrefs(currentUserId, prefs));
  };

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
        samePair(friendship, currentUserId, otherId)
          ? { ...friendship, status: 'accepted' }
          : friendship,
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
          countMilestone('joined-group');
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

  /** Change one group on screen now; the database has the last word on refresh. */
  const patchGroup = (groupId: string, change: (group: Group) => Group) =>
    setGroups((current) => current.map((group) => (group.id === groupId ? change(group) : group)));

  /** Save a group change, then load what the database made of it. */
  const trackGroup = (action: string, write: Promise<SaveError>) =>
    track(
      action,
      write.then((reason) => {
        if (!reason && usesAccounts) {
          fetchBookClubData().then(applyData);
        }
        return reason;
      }),
    );

  const handleRenameGroup = (groupId: string, name: string) => {
    const trimmed = name.trim();
    if (!trimmed) {
      return;
    }
    patchGroup(groupId, (group) => ({ ...group, name: trimmed }));
    trackGroup(`rename the group`, renameGroup(groupId, trimmed));
  };

  const handleRemoveFromGroup = (groupId: string, personId: string) => {
    patchGroup(groupId, (group) => ({
      ...group,
      memberIds: group.memberIds.filter((id) => id !== personId),
    }));
    trackGroup(`remove ${nameOf(personId)}`, removeFromGroup(groupId, personId));
  };

  const handleHandOverGroup = (groupId: string, personId: string) => {
    patchGroup(groupId, (group) => ({ ...group, adminId: personId }));
    trackGroup(`hand the group to ${nameOf(personId)}`, handOverGroup(groupId, personId));
  };

  const handleSetGroupPace = (groupId: string, weeks: number | null) => {
    patchGroup(groupId, (group) => ({ ...group, paceWeeks: weeks ?? undefined }));
    trackGroup('set the pace', setGroupPace(groupId, weeks));
  };

  /** The new code is made by the database; it arrives with the refresh. */
  const handleResetInviteLink = (groupId: string) => {
    trackGroup('reset the invite link', resetInviteCode(groupId));
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

    // Joining happens below, so the join prompt shouldn't offer it again.
    clearInviteFromUrl();
    setMembers((current) => [...current, person]);
    if (usesAccounts) {
      setCurrentUserId(person.id);
    } else {
      chooseReader(person.id);
    }

    const write = createFriend(person).then(async (reason) => {
      if (!reason) {
        countMilestone('signed-up');
      }
      if (reason || !inviteCode || !usesAccounts) {
        return reason;
      }

      const joined = await joinGroup(inviteCode);
      if (!joined) {
        countMilestone('joined-group');
        applyData(await fetchBookClubData());
      }
      return joined;
    });
    track('create your profile', write);
  };

  const handleUpdateBookDetails = (bookId: string, title: string, author: string) => {
    setBooks((current) =>
      current.map((item) =>
        item.id === bookId ? { ...item, title: title.trim(), author: author.trim() } : item,
      ),
    );
    track('update book details', updateBookDetails(bookId, title.trim(), author.trim()));
  };

  const handleRetireBook = (bookId: string) => {
    const book = books.find((candidate) => candidate.id === bookId);
    setBooks((current) =>
      current.map((item) =>
        item.id === bookId ? { ...item, archivedAt: new Date().toISOString() } : item,
      ),
    );
    track(`rest ${book?.title ?? 'book'}`, retireBook(bookId));
  };

  const handleUnretireBook = (bookId: string) => {
    const book = books.find((candidate) => candidate.id === bookId);
    setBooks((current) =>
      current.map((item) => (item.id === bookId ? { ...item, archivedAt: undefined } : item)),
    );
    track(`send ${book?.title ?? 'the book'} travelling again`, unretireBook(bookId));
  };

  const handleCallHome = (bookId: string, calling: boolean) => {
    const book = books.find((candidate) => candidate.id === bookId);
    setBooks((current) =>
      current.map((item) =>
        item.id === bookId
          ? { ...item, calledHomeAt: calling ? new Date().toISOString() : undefined }
          : item,
      ),
    );
    track(
      calling
        ? `call ${book?.title ?? 'the book'} home`
        : `let ${book?.title ?? 'the book'} keep travelling`,
      calling ? callHome(bookId) : cancelCallHome(bookId),
    );
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
    pendingSaves,
    dismissSaveProblem: () => setSaveProblem(null),
    refresh,
    chooseReader,
    claimExisting,
    agreeToRules: handleAgreeToRules,
    signOut,
    deleteAccount: deleteMyAccount,
    createProfile,
    requestFriend: handleRequestFriend,
    acceptFriend: handleAcceptFriend,
    removeFriend: handleRemoveFriend,
    createGroup: handleCreateGroup,
    joinGroup: handleJoinGroup,
    leaveGroup: handleLeaveGroup,
    renameGroup: handleRenameGroup,
    removeFromGroup: handleRemoveFromGroup,
    handOverGroup: handleHandOverGroup,
    resetInviteLink: handleResetInviteLink,
    setGroupPace: handleSetGroupPace,
    addBook: handleAddBook,
    changeCover: handleChangeCover,
    updateBookDetails: handleUpdateBookDetails,
    retireBook: handleRetireBook,
    unretireBook: handleUnretireBook,
    callHome: (bookId: string) => handleCallHome(bookId, true),
    cancelCallHome: (bookId: string) => handleCallHome(bookId, false),
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
