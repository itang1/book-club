/** A mutual friendship between two people in the club, by id. */
export type Friendship = [string, string];

export type FriendStatus = 'waiting' | 'reading' | 'done';

export type Friend = {
  id: string;
  name: string;
  city: string;
  state: string;
  address?: string;
  email?: string;
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
};

export type Letter = Pick<Handoff, 'note' | 'rating'>;

export type Book = {
  id: string;
  title: string;
  author: string;
  coverColor: string;
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
