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
 */
export type ReadingQueueEntry = Friend & {
  position: number;
  status: FriendStatus;
};

/**
 * One leg of a book's journey. Append-only: handoffs are never edited, and a
 * book's current location is derived from the most recent one.
 * `fromFriend` is null for the handoff that put the book into circulation.
 */
export type Handoff = {
  id: string;
  bookId: string;
  fromFriend: string | null;
  toFriend: string;
  happenedAt: string;
};

export type BookStatus = 'in-transit' | 'reading' | 'returned' | 'annotated';

export type Book = {
  id: string;
  title: string;
  author: string;
  coverColor: string;
  status: BookStatus;
  queue: ReadingQueueEntry[];
  handoffs: Handoff[];
};

export type RootTabParamList = {
  Home: undefined;
  Friends: undefined;
  AddBook: undefined;
  Profile: undefined;
};

export type RootStackParamList = {
  Home: undefined;
  BookDetail: { bookId: string; bookTitle: string };
};
