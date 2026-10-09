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
  /** Which emails they want. All on unless they turn one off. */
  emails?: EmailPrefs;
};

export type EmailPrefs = {
  bookSent: boolean;
  bookArrived: boolean;
  nextInLine: boolean;
  friendRequest: boolean;
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
 * `note` and `rating` are the letter `fromFriend` tucks into the book as they
 * pass it on, the way the girls in the novel wrote letters with the pants.
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
  queue: ReadingQueueEntry[];
  handoffs: Handoff[];
};

export type RootTabParamList = {
  Home: undefined;
  Friends: undefined;
  Profile: undefined;
};

export type RootStackParamList = {
  Home: undefined;
  BookDetail: { bookId: string; bookTitle: string };
  AddBook: undefined;
};
