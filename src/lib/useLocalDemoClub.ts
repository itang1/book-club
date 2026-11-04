import * as React from 'react';
import type { Book, EmailPrefs, Friend, Friendship, Group, Handoff, Letter } from '../types';
import { demoData } from './bookClubService';
import { hasFinished, holderId } from './bookState';
import { clearReaderId, loadReaderId, saveReaderId } from './identity';
import { isDevMode } from './devMode';
import type { NewProfile, SaveProblem } from './useBookClub';

/**
 * Local state for demo mode: no backend or sign-in needed.
 * State updates are kept in memory and the selected reader is stored locally.
 */
export function useLocalDemoClub() {
  const [books, setBooks] = React.useState<Book[]>(demoData.books);
  const [members, setMembers] = React.useState<Friend[]>(demoData.friends);
  const [friendships, setFriendships] = React.useState<Friendship[]>(demoData.friendships);
  const [groups, setGroups] = React.useState<Group[]>(demoData.groups);
  const [currentUserId, setCurrentUserId] = React.useState<string | null>(null);
  const [loaded, setLoaded] = React.useState(false);
  const [saveProblem, setSaveProblem] = React.useState<SaveProblem | null>(null);

  React.useEffect(() => {
    let active = true;
    loadReaderId().then((saved) => {
      if (!active) return;
      if (saved && members.some((person) => person.id === saved)) {
        setCurrentUserId(saved);
      } else if (isDevMode && members.length > 0) {
        setCurrentUserId(members[0].id);
      }
      setLoaded(true);
    });
    return () => {
      active = false;
    };
  }, [members]);

  const chooseReader = (personId: string) => {
    setCurrentUserId(personId);
    saveReaderId(personId);
  };

  const claimExisting = async (personId: string) => {
    chooseReader(personId);
  };

  const agreeToRules = () => {
    if (!currentUserId) return;
    const at = new Date().toISOString();
    setMembers((current) =>
      current.map((person) =>
        person.id === currentUserId ? { ...person, agreedRulesAt: at } : person,
      ),
    );
  };

  const signOut = () => {
    setCurrentUserId(null);
    clearReaderId();
  };

  const updateBook = (bookId: string, change: (book: Book) => Book) => {
    setBooks((current) =>
      current.map((candidate) => (candidate.id === bookId ? change(candidate) : candidate)),
    );
  };

  const addBook = (book: Book) => {
    setBooks((current) => [book, ...current]);
  };

  const changeCover = async (bookId: string, mode: 'find' | 'clear') => {
    updateBook(bookId, (candidate) => ({
      ...candidate,
      coverUrl: mode === 'find' ? candidate.coverUrl : undefined,
    }));
  };

  const updateBookDetails = (bookId: string, title: string, author: string) => {
    updateBook(bookId, (candidate) => ({
      ...candidate,
      title: title.trim(),
      author: author.trim(),
    }));
  };

  const retireBook = (bookId: string) => {
    updateBook(bookId, (candidate) => ({
      ...candidate,
      archivedAt: new Date().toISOString(),
    }));
  };

  const unretireBook = (bookId: string) => {
    updateBook(bookId, (candidate) => ({
      ...candidate,
      archivedAt: undefined,
    }));
  };

  const joinLine = (bookId: string) => {
    const book = books.find((candidate) => candidate.id === bookId);
    const me = members.find((person) => person.id === currentUserId);
    if (!book || !me || holderId(book) === me.id) return;

    const existing = book.queue.find((entry) => entry.id === me.id);
    if (existing && existing.status !== 'done') return;

    const position = Math.max(-1, ...book.queue.map((entry) => entry.position)) + 1;
    updateBook(bookId, (candidate) => ({
      ...candidate,
      queue: [
        ...candidate.queue.filter((entry) => entry.id !== me.id),
        { ...me, position, status: 'waiting' },
      ],
    }));
  };

  const leaveLine = (bookId: string) => {
    if (!currentUserId) return;
    const book = books.find((candidate) => candidate.id === bookId);
    if (!book) return;

    const readBefore = hasFinished(book, currentUserId);
    updateBook(bookId, (candidate) => ({
      ...candidate,
      queue: candidate.queue.flatMap((entry) => {
        if (entry.id !== currentUserId || entry.status !== 'waiting') return [entry];
        return readBefore ? [{ ...entry, status: 'done' as const }] : [];
      }),
    }));
  };

  const handOff = (bookId: string, toFriend: string, letter: Letter) => {
    const book = books.find((candidate) => candidate.id === bookId);
    if (!book) return;

    const fromFriend = holderId(book);
    const recipient = members.find((person) => person.id === toFriend);
    const now = new Date().toISOString();

    const newHandoff: Handoff = {
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
      handoffs: [
        ...candidate.handoffs.map((leg) =>
          leg.toFriend === fromFriend && !leg.receivedAt ? { ...leg, receivedAt: now } : leg,
        ),
        newHandoff,
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
  };

  const markReceived = (bookId: string) => {
    const me = members.find((person) => person.id === currentUserId);
    if (!me) return;
    const now = new Date().toISOString();

    updateBook(bookId, (candidate) => ({
      ...candidate,
      handoffs: candidate.handoffs.map((leg) =>
        leg.toFriend === me.id && !leg.receivedAt
          ? { ...leg, receivedAt: now, placeCity: me.city, placeRegion: me.state }
          : leg,
      ),
    }));
  };

  const requestFriend = (toPersonId: string) => {
    if (!currentUserId || currentUserId === toPersonId) return;
    const [a, b] = currentUserId < toPersonId ? [currentUserId, toPersonId] : [toPersonId, currentUserId];
    setFriendships((current) => [
      ...current.filter((item) => !(item.a === a && item.b === b)),
      { a, b, status: 'pending', requestedBy: currentUserId },
    ]);
  };

  const acceptFriend = (otherPersonId: string) => {
    if (!currentUserId) return;
    const [a, b] = currentUserId < otherPersonId ? [currentUserId, otherPersonId] : [otherPersonId, currentUserId];
    setFriendships((current) =>
      current.map((item) => (item.a === a && item.b === b ? { ...item, status: 'accepted' as const } : item)),
    );
  };

  const removeFriend = (otherPersonId: string) => {
    if (!currentUserId) return;
    const [a, b] = currentUserId < otherPersonId ? [currentUserId, otherPersonId] : [otherPersonId, currentUserId];
    setFriendships((current) => current.filter((item) => !(item.a === a && item.b === b)));
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
    setGroups((current) => [...current, newGroup]);
    return id;
  };

  const joinGroup = async (inviteCode: string): Promise<string | null> => {
    const match = groups.find((group) => group.inviteCode.toLowerCase() === inviteCode.trim().toLowerCase());
    if (!match || !currentUserId) return null;
    setGroups((current) =>
      current.map((group) =>
        group.id === match.id
          ? { ...group, memberIds: Array.from(new Set([...group.memberIds, currentUserId])) }
          : group,
      ),
    );
    return match.id;
  };

  const leaveGroup = (groupId: string) => {
    if (!currentUserId) return;
    setGroups((current) =>
      current.map((group) =>
        group.id === groupId
          ? { ...group, memberIds: group.memberIds.filter((id) => id !== currentUserId) }
          : group,
      ),
    );
  };

  const createProfile = async (profile: NewProfile): Promise<boolean> => {
    const id = `friend-${Date.now()}`;
    const newFriend: Friend = {
      id,
      name: profile.name.trim(),
      city: profile.city.trim(),
      state: profile.region.trim(),
    };
    setMembers((current) => [...current, newFriend]);
    setCurrentUserId(id);
    saveReaderId(id);
    return true;
  };

  const updateProfile = (changes: Pick<Friend, 'name' | 'city' | 'state'>) => {
    if (!currentUserId) return;
    setMembers((current) =>
      current.map((person) =>
        person.id === currentUserId ? { ...person, ...changes } : person,
      ),
    );
  };

  const updateEmailPrefs = (prefs: EmailPrefs) => {
    if (!currentUserId) return;
    setMembers((current) =>
      current.map((person) => (person.id === currentUserId ? { ...person, emails: prefs } : person)),
    );
  };

  const updateFriendRequestsFrom = (value: 'groups' | 'nobody') => {
    if (!currentUserId) return;
    setMembers((current) =>
      current.map((person) => (person.id === currentUserId ? { ...person, friendRequestsFrom: value } : person)),
    );
  };

  return {
    usesAccounts: false,
    signedIn: false,
    email: null,
    loaded,
    refreshing: false,
    books,
    members,
    friendships,
    groups,
    currentUserId,
    saveProblem,
    dismissSaveProblem: () => setSaveProblem(null),
    refresh: async () => {},
    chooseReader,
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
