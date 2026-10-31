import type { NavigatorScreenParams } from '@react-navigation/native';

/**
 * A friendship between two people, stored once per pair (a < b). It starts
 * "pending" from whoever asked and becomes "accepted" when the other says
 * yes. Declining, cancelling and unfriending all just remove it.
 */
export type Friendship = {
  a: string;
  b: string;
  status: 'pending' | 'accepted';
  requestedBy: string;
};

/**
 * A circle books are lent within. Every book belongs to one, and only its
 * members can see it. You join by invite link (the code is in the link).
 */
export type Group = {
  id: string;
  name: string;
  inviteCode: string;
  memberIds: string[];
  /**
   * The sample club: everyone's in it to look around, nobody can act in it,
   * and real members can't see each other through it.
   */
  isSample?: boolean;
  /**
   * Who runs the group (rename, remove members, hand over, reset the link):
   * whoever started it, or after they leave, its longest-standing member.
   */
  adminId?: string;
};

export type FriendStatus = 'waiting' | 'reading' | 'done';

export type Friend = {
  id: string;
  name: string;
  city: string;
  state: string;
  /** The Supabase Auth account this person signs in with, once linked. */
  userId?: string;
  /** When they agreed to the Rules of the Books; unset until they do. */
  agreedRulesAt?: string;
  /** Which emails they want. All off until they turn one on. */
  emails?: EmailPrefs;
  /** Who can send them friend requests: groupmates (default) or nobody. */
  friendRequestsFrom?: 'groups' | 'nobody';
};

export type EmailPrefs = {
  newBook: boolean;
  bookSent: boolean;
  bookArrived: boolean;
  nextInLine: boolean;
  friendRequest: boolean;
  reminders: boolean;
};

/**
 * A friend's place in one book's reading queue. Reading status lives here, on
 * the (book, friend) edge, rather than on the friend: the same person can be
 * reading one copy while waiting on another.
 *
 * Nobody is added automatically. An entry exists because that person signed
 * up for the book, and `position` is their sign-up order.
 */
export type ReadingQueueEntry = Friend & {
  position: number;
  status: FriendStatus;
};

/**
 * One leg of a book's journey. Append-only: handoffs are never edited, and a
 * book's current location is derived from the most recent one.
 * `fromFriend` is null for the handoff that put the book into circulation.
 *
 * `note` and `rating` are what `fromFriend` says about the book in the app as
 * they pass it on. They are not the letter: that is handwritten and travels in
 * the package, the way the girls in the novel wrote letters with the pants.
 * Both optional, and as permanent as the leg itself.
 */
export type Handoff = {
  id: string;
  bookId: string;
  fromFriend: string | null;
  toFriend: string;
  happenedAt: string;
  note?: string;
  /** 1–5 whole stars. */
  rating?: number;
  /**
   * Where the book was read on this leg, recorded when it arrived. Kept on
   * the leg so a reader who moves later doesn't move their past stops.
   */
  placeCity?: string;
  placeRegion?: string;
  /** When the recipient said "Got it". Unset while it's in the post. */
  receivedAt?: string;
};

export type Letter = Pick<Handoff, 'note' | 'rating'>;

export type Book = {
  id: string;
  title: string;
  author: string;
  coverColor: string;
  /** Who gave the owner this copy, if it was a gift. Any name, member or not. */
  giftedBy?: string;
  /** The group it's lent within. */
  groupId?: string;
  /** A cover image from Open Library; without one, the colour swatch. */
  coverUrl?: string;
  /** When the owner rested this copy from circulation. */
  archivedAt?: string;
  /** The owner has asked for it back: it goes home next, and the line waits. */
  calledHomeAt?: string;
  queue: ReadingQueueEntry[];
  handoffs: Handoff[];
};

export type RootTabParamList = {
  Home: NavigatorScreenParams<RootStackParamList> | undefined;
  Shelf: NavigatorScreenParams<ShelfStackParamList> | undefined;
  Friends: NavigatorScreenParams<FriendsStackParamList> | undefined;
  Profile: undefined;
};

export type FriendsStackParamList = {
  FriendsHome: undefined;
  Group: { groupId: string };
};

export type RootStackParamList = {
  Home: undefined;
  /** bookTitle is a nicety when navigating in-app; a link carries only the id. */
  BookDetail: { bookId: string; bookTitle?: string };
  AddBook: undefined;
};

/** A book someone owns, on their shelf. Not in circulation until lent to a group. */
export type ShelfBook = {
  id: string;
  ownerId: string;
  title: string;
  author: string;
  coverColor: string;
  /** The circulating book made from this one, once it has been lent. */
  lentBookId: string | null;
};

export type ShelfRequest = {
  id: string;
  shelfBookId: string;
  requesterId: string;
  status: 'pending' | 'accepted' | 'declined';
};

/** What the scanner thinks it saw; nothing is saved until the person confirms it. */
export type ScannedBook = { title: string; author: string };

export type ShelfStackParamList = {
  ShelfHome: undefined;
  PersonShelf: { personId: string };
};

/** A book a group would like to read that nobody in it owns yet. */
export type Wish = {
  id: string;
  groupId: string;
  title: string;
  author: string;
  suggestedBy: string | null;
  /** Everyone who said "I'd read that", the suggester usually included. */
  voters: string[];
};
