import * as React from 'react';
import { AppState, Platform } from 'react-native';
import type { Session } from '@supabase/supabase-js';

import type { Book, EmailPrefs, Friend, Friendship, Group, Handoff, Letter } from '../types';
import {
  acceptFriend as apiAcceptFriend,
  agreeToRules as apiAgreeToRules,
  createBook as apiCreateBook,
  createFriend as apiCreateFriend,
  createGroup as apiCreateGroup,
  fetchBookClubData,
  joinGroup as apiJoinGroup,
  joinLine as apiJoinLine,
  leaveGroup as apiLeaveGroup,
  leaveLine as apiLeaveLine,
  markReceived as apiMarkReceived,
  recordHandoff as apiRecordHandoff,
  removeFriendship as apiRemoveFriendship,
  requestFriend as apiRequestFriend,
  retireBook as apiRetireBook,
  unretireBook as apiUnretireBook,
  setCover,
  updateBookDetails as apiUpdateBookDetails,
  updateEmailPrefs as apiUpdateEmailPrefs,
  updateFriendRequestsFrom as apiUpdateFriendRequestsFrom,
  updateProfile as apiUpdateProfile,
  SaveError,
  BookClubData,
} from './bookClubService';
import { claimProfile, onSessionChange, signOutEverywhere } from './auth';
import { clearCachedClubData, loadCachedClubData, saveCachedClubData } from './cache';
import { findCoverUrl } from './covers';
import { hasFinished, holderId } from './bookState';
import { clearInviteFromUrl } from './invite';
import { supabase } from './supabase';
import type { NewProfile, SaveProblem } from './useBookClub';

function explain(reason: string): string {
  if (/schema cache|does not exist/i.test(reason)) {
    return `The app is a step ahead of the database (${reason}). Re-run supabase/schema.sql in the Supabase SQL editor to catch it up.`;
  }
  return reason;
}

export function useSupabaseClub() {
  const [books, setBooks] = React.useState<Book[]>([]);
  const [members, setMembers] = React.useState<Friend[]>([]);
  const [friendships, setFriendships] = React.useState<Friendship[]>([]);
  const [groups, setGroups] = React.useState<Group[]>([]);
  const [currentUserId, setCurrentUserId] = React.useState<string | null>(null);
  const [loaded, setLoaded] = React.useState(false);
  const [refreshing, setRefreshing] = React.useState(false);
  const [session, setSession] = React.useState<Session | null>(null);
  const [saveProblem, setSaveProblem] = React.useState<SaveProblem | null>(null);

  const applyData = React.useCallback(
    (data: BookClubData) => {
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
    },
    [books.length],
  );

  React.useEffect(() => {
    let active = true;

    loadCachedClubData().then((cached) => {
      if (cached && active) {
        setBooks(cached.books);
        setMembers(cached.friends);
        setFriendships(cached.friendships);
        setGroups(cached.groups);
      }
    });

    let lastUserId: string | null | undefined;
    const stop = onSessionChange(async (next) => {
      const userId = next?.user.id ?? null;
      if (!active || userId === lastUserId) return;
      lastUserId = userId;
      setSession(next);

      if (!next) {
        clearCachedClubData();
        applyData({ books: [], friends: [], friendships: [], groups: [] });
        setCurrentUserId(null);
        setLoaded(true);
        return;
      }

      const [claim, data] = await Promise.all([claimProfile(), fetchBookClubData()]);
      if (!active) return;

      applyData(data);
      setCurrentUserId(claim.personId);
      setLoaded(true);
    });

    return () => {
      active = false;
      stop();
    };
  }, [applyData]);

  const refresh = async () => {
    setRefreshing(true);
    applyData(await fetchBookClubData());
    setRefreshing(false);
  };

  const signedInRef = React.useRef(false);
  signedInRef.current = session !== null && currentUserId !== null;

  React.useEffect(() => {
    const quietRefresh = () => {
      if (signedInRef.current) {
        fetchBookClubData().then((data) => {
          if (!data.error) {
            applyData(data);
          }
        });
      }
    };

    const channel = supabase
      ? supabase
          .channel('club-realtime')
          .on('postgres_changes', { event: '*', schema: 'public', table: 'handoffs' }, quietRefresh)
          .on('postgres_changes', { event: '*', schema: 'public', table: 'reading_queue' }, quietRefresh)
          .on('postgres_changes', { event: '*', schema: 'public', table: 'friendships' }, quietRefresh)
          .on('postgres_changes', { event: '*', schema: 'public', table: 'books' }, quietRefresh)
          .on('postgres_changes', { event: '*', schema: 'public', table: 'groups' }, quietRefresh)
          .subscribe()
      : null;

    const interval = setInterval(quietRefresh, 60_000);
    const appState = AppState.addEventListener('change', (state) => {
      if (state === 'active') quietRefresh();
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
      if (channel && supabase) {
        supabase.removeChannel(channel);
      }
    };
  }, [applyData]);

  const track = (action: string, write: Promise<SaveError>, onRollback?: () => void) => {
    write.then((reason) => {
      if (reason) {
        setSaveProblem({ action, reason: explain(reason) });
        if (onRollback) {
          onRollback();
        } else {
          fetchBookClubData().then(applyData);
        }
      }
    });
  };

  const claimExisting = async (personId: string, inviteCode: string | null) => {
    const claim = await claimProfile(personId, inviteCode ?? undefined);
    if (claim.error || !claim.personId) {
      setSaveProblem({ action: 'claim that profile', reason: claim.error ?? 'Unknown error' });
      return;
    }
    clearInviteFromUrl();
    applyData(await fetchBookClubData());
    setCurrentUserId(claim.personId);
  };

  const agreeToRules = () => {
    if (!currentUserId) return;
    const at = new Date().toISOString();
    setMembers((current) =>
      current.map((person) =>
        person.id === currentUserId ? { ...person, agreedRulesAt: at } : person,
      ),
    );
    track('save that you agreed to the rules', apiAgreeToRules(currentUserId));
  };

  const signOut = () => {
    signOutEverywhere();
  };

  const updateBook = (bookId: string, change: (book: Book) => Book) => {
    setBooks((current) =>
      current.map((candidate) => (candidate.id === bookId ? change(candidate) : candidate)),
    );
  };

  const addBook = (book: Book) => {
    const snapshot = books;
    setBooks((current) => [book, ...current]);

    const cover = findCoverUrl(book.title, book.author);
    track(
      `add ${book.title}`,
      apiCreateBook(book).then(async (reason) => {
        const url = await cover;
        if (reason || !url) return reason;
        updateBook(book.id, (candidate) => ({ ...candidate, coverUrl: url }));
        return setCover(book.id, url);
      }),
      () => setBooks(snapshot),
    );
  };

  const changeCover = async (bookId: string, mode: 'find' | 'clear') => {
    const book = books.find((candidate) => candidate.id === bookId);
    if (!book) return;

    const url = mode === 'find' ? await findCoverUrl(book.title, book.author) : null;
    if (mode === 'find' && !url) {
      setSaveProblem({
        action: `find a cover for ${book.title}`,
        reason: 'The colour swatch stays for now; try again once Open Library adds this cover.',
      });
      return;
    }

    const snapshot = books;
    updateBook(bookId, (candidate) => ({ ...candidate, coverUrl: url ?? undefined }));
    track(
      mode === 'find' ? 'add the cover' : 'remove the cover',
      setCover(bookId, url),
      () => setBooks(snapshot),
    );
  };

  const joinLine = (bookId: string) => {
    const book = books.find((candidate) => candidate.id === bookId);
    const me = members.find((person) => person.id === currentUserId);
    if (!book || !me || holderId(book) === me.id) return;

    const existing = book.queue.find((entry) => entry.id === me.id);
    if (existing && existing.status !== 'done') return;

    const position = Math.max(-1, ...book.queue.map((entry) => entry.position)) + 1;
    const snapshot = books;

    updateBook(bookId, (candidate) => ({
      ...candidate,
      queue: [
        ...candidate.queue.filter((entry) => entry.id !== me.id),
        { ...me, position, status: 'waiting' },
      ],
    }));

    track(
      `sign you up for ${book.title}`,
      apiJoinLine({ book_id: bookId, friend_id: me.id, position, status: 'waiting' }),
      () => setBooks(snapshot),
    );
  };

  const leaveLine = (bookId: string) => {
    const book = books.find((candidate) => candidate.id === bookId);
    if (!book || !currentUserId) return;

    const readBefore = hasFinished(book, currentUserId);
    const snapshot = books;

    updateBook(bookId, (candidate) => ({
      ...candidate,
      queue: candidate.queue.flatMap((entry) => {
        if (entry.id !== currentUserId || entry.status !== 'waiting') return [entry];
        return readBefore ? [{ ...entry, status: 'done' as const }] : [];
      }),
    }));

    track(
      `take you out of the line for ${book.title}`,
      apiLeaveLine(bookId, currentUserId, readBefore),
      () => setBooks(snapshot),
    );
  };

  /**
   * Optimistic Handoff: appends the handoff leg immediately, rolling back
   * to previous state if the network request fails.
   */
  const handOff = (bookId: string, toFriend: string, letter: Letter) => {
    const book = books.find((candidate) => candidate.id === bookId);
    if (!book) return;

    const fromFriend = holderId(book);
    const recipient = members.find((person) => person.id === toFriend);
    const now = new Date().toISOString();

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

    const snapshot = books;

    updateBook(bookId, (candidate) => ({
      ...candidate,
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
        if (entry.id === toFriend && entry.status === 'waiting') {
          return { ...entry, status: 'reading' as const };
        }
        return entry;
      }),
    }));

    track(`pass ${book.title} on`, apiRecordHandoff(handoff), () => {
      setBooks(snapshot);
    });
  };

  /**
   * Optimistic Mark Received: stamps the handoff as arrived immediately,
   * rolling back if the network request fails.
   */
  const markReceived = (bookId: string) => {
    const book = books.find((candidate) => candidate.id === bookId);
    const me = members.find((person) => person.id === currentUserId);
    if (!book || !me) return;

    const now = new Date().toISOString();
    const snapshot = books;

    updateBook(bookId, (candidate) => ({
      ...candidate,
      handoffs: candidate.handoffs.map((leg) =>
        leg.toFriend === me.id && !leg.receivedAt
          ? { ...leg, receivedAt: now, placeCity: me.city, placeRegion: me.state }
          : leg,
      ),
    }));

    track(`mark ${book.title} as arrived`, apiMarkReceived(bookId), () => {
      setBooks(snapshot);
    });
  };

  const requestFriend = (toPersonId: string) => {
    if (!currentUserId || currentUserId === toPersonId) return;
    const [a, b] = currentUserId < toPersonId ? [currentUserId, toPersonId] : [toPersonId, currentUserId];
    const snapshot = friendships;

    setFriendships((current) => [
      ...current.filter((item) => !(item.a === a && item.b === b)),
      { a, b, status: 'pending', requestedBy: currentUserId },
    ]);

    track('send a friend request', apiRequestFriend(currentUserId, toPersonId), () =>
      setFriendships(snapshot),
    );
  };

  const acceptFriend = (otherPersonId: string) => {
    if (!currentUserId) return;
    const [a, b] = currentUserId < otherPersonId ? [currentUserId, otherPersonId] : [otherPersonId, currentUserId];
    const snapshot = friendships;

    setFriendships((current) =>
      current.map((item) => (item.a === a && item.b === b ? { ...item, status: 'accepted' as const } : item)),
    );

    track('accept friend request', apiAcceptFriend(currentUserId, otherPersonId), () =>
      setFriendships(snapshot),
    );
  };

  const removeFriend = (otherPersonId: string) => {
    if (!currentUserId) return;
    const [a, b] = currentUserId < otherPersonId ? [currentUserId, otherPersonId] : [otherPersonId, currentUserId];
    const snapshot = friendships;

    setFriendships((current) => current.filter((item) => !(item.a === a && item.b === b)));
    track('unfriend', apiRemoveFriendship(currentUserId, otherPersonId), () => setFriendships(snapshot));
  };

  const createGroup = (name: string): string | null => {
    if (!currentUserId) return null;
    const id = `group-${Date.now()}`;
    const newGroup: Group = {
      id,
      name: name.trim(),
      inviteCode: `inv-${Date.now()}`,
      memberIds: [currentUserId],
    };
    const snapshot = groups;
    setGroups((current) => [...current, newGroup]);
    track(`start the group "${name.trim()}"`, apiCreateGroup(id, name.trim()), () =>
      setGroups(snapshot),
    );
    return id;
  };

  const joinGroup = async (inviteCode: string): Promise<string | null> => {
    const err = await apiJoinGroup(inviteCode);
    if (err) {
      setSaveProblem({ action: 'join the group', reason: err });
      return null;
    }
    const fresh = await fetchBookClubData();
    applyData(fresh);
    const found = fresh.groups.find(
      (g) => g.inviteCode.toLowerCase() === inviteCode.trim().toLowerCase(),
    );
    return found?.id ?? null;
  };

  const leaveGroup = (groupId: string) => {
    if (!currentUserId) return;
    const snapshot = groups;
    setGroups((current) =>
      current.map((group) =>
        group.id === groupId
          ? { ...group, memberIds: group.memberIds.filter((id) => id !== currentUserId) }
          : group,
      ),
    );
    track('leave group', apiLeaveGroup(groupId), () => setGroups(snapshot));
  };

  const createProfile = async (profile: NewProfile, inviteCode?: string | null): Promise<boolean> => {
    const personId = `friend-${Date.now()}`;
    const newFriend: Friend = {
      id: personId,
      name: profile.name.trim(),
      city: profile.city.trim(),
      state: profile.region.trim(),
      userId: session?.user.id,
      agreedRulesAt: new Date().toISOString(),
    };
    setMembers((current) => [...current, newFriend]);
    setCurrentUserId(personId);

    const write = apiCreateFriend(newFriend).then(async (reason) => {
      if (reason) return reason;
      if (inviteCode) {
        await apiJoinGroup(inviteCode);
      }
      applyData(await fetchBookClubData());
      return null;
    });
    track('create your profile', write);
    return true;
  };

  const updateProfile = (changes: Pick<Friend, 'name' | 'city' | 'state'>) => {
    if (!currentUserId) return;
    const current = members.find((person) => person.id === currentUserId);
    if (!current) return;

    const updated = { ...current, ...changes };
    const snapshot = members;
    setMembers((people) =>
      people.map((person) => (person.id === currentUserId ? updated : person)),
    );
    track('update your profile', apiUpdateProfile(updated), () => setMembers(snapshot));
  };

  const updateEmailPrefs = (prefs: EmailPrefs) => {
    if (!currentUserId) return;
    const snapshot = members;
    setMembers((current) =>
      current.map((person) => (person.id === currentUserId ? { ...person, emails: prefs } : person)),
    );
    track('save your email settings', apiUpdateEmailPrefs(currentUserId, prefs), () =>
      setMembers(snapshot),
    );
  };

  const updateFriendRequestsFrom = (value: 'groups' | 'nobody') => {
    if (!currentUserId) return;
    const snapshot = members;
    setMembers((current) =>
      current.map((person) => (person.id === currentUserId ? { ...person, friendRequestsFrom: value } : person)),
    );
    track(
      'save who can send you requests',
      apiUpdateFriendRequestsFrom(currentUserId, value),
      () => setMembers(snapshot),
    );
  };

  const updateBookDetails = (bookId: string, title: string, author: string) => {
    const snapshot = books;
    updateBook(bookId, (item) => ({ ...item, title: title.trim(), author: author.trim() }));
    track(
      'update book details',
      apiUpdateBookDetails(bookId, title.trim(), author.trim()),
      () => setBooks(snapshot),
    );
  };

  const retireBook = (bookId: string) => {
    const book = books.find((candidate) => candidate.id === bookId);
    const snapshot = books;
    updateBook(bookId, (item) => ({ ...item, archivedAt: new Date().toISOString() }));
    track(`rest ${book?.title ?? 'book'}`, apiRetireBook(bookId), () => setBooks(snapshot));
  };

  const unretireBook = (bookId: string) => {
    const book = books.find((candidate) => candidate.id === bookId);
    const snapshot = books;
    updateBook(bookId, (item) => ({ ...item, archivedAt: undefined }));
    track(
      `send ${book?.title ?? 'the book'} travelling again`,
      apiUnretireBook(bookId),
      () => setBooks(snapshot),
    );
  };

  return {
    usesAccounts: true,
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
    chooseReader: () => {},
    claimExisting,
    agreeToRules,
    signOut,
    createProfile,
    requestFriend,
    acceptFriend,
    removeFriend,
    createGroup,
    joinGroup,
    leaveGroup,
    addBook,
    changeCover,
    updateBookDetails,
    retireBook,
    unretireBook,
    joinLine,
    markReceived,
    updateProfile,
    updateEmailPrefs,
    updateFriendRequestsFrom,
    leaveLine,
    handOff,
  };
}
