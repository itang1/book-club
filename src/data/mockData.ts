import type { Book, Friend } from '../types';

const daysAgo = (days: number): string =>
  new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();

export const friends: Friend[] = [
  { id: 'friend-1', name: 'Maya', city: 'Seattle', state: 'WA', email: 'maya@example.com' },
  { id: 'friend-2', name: 'Leah', city: 'Austin', state: 'TX', email: 'leah@example.com' },
  { id: 'friend-3', name: 'Priya', city: 'Boston', state: 'MA', email: 'priya@example.com' },
  { id: 'friend-4', name: 'Nina', city: 'Chicago', state: 'IL', email: 'nina@example.com' },
  { id: 'friend-5', name: 'Rina', city: 'New York', state: 'NY', email: 'rina@example.com' },
];

const byId = (id: string): Friend => {
  const friend = friends.find((candidate) => candidate.id === id);
  if (!friend) {
    throw new Error(`Unknown seed friend: ${id}`);
  }

  return friend;
};

export const booksSeed: Book[] = [
  {
    id: 'book-1',
    title: 'The Secret Life of Bees',
    author: 'Sue Monk Kidd',
    coverColor: '#d9a77d',
    status: 'reading',
    queue: [
      { ...byId('friend-1'), position: 0, status: 'done' },
      { ...byId('friend-2'), position: 1, status: 'reading' },
      { ...byId('friend-3'), position: 2, status: 'waiting' },
      { ...byId('friend-4'), position: 3, status: 'waiting' },
    ],
    handoffs: [
      {
        id: 'handoff-1a',
        bookId: 'book-1',
        fromFriend: null,
        toFriend: 'friend-1',
        happenedAt: daysAgo(41),
      },
      {
        id: 'handoff-1b',
        bookId: 'book-1',
        fromFriend: 'friend-1',
        toFriend: 'friend-2',
        happenedAt: daysAgo(12),
      },
    ],
  },
  {
    id: 'book-2',
    title: 'Tomorrow, and Tomorrow, and Tomorrow',
    author: 'Gabrielle Zevin',
    coverColor: '#b4b8a9',
    status: 'in-transit',
    queue: [
      { ...byId('friend-5'), position: 0, status: 'done' },
      { ...byId('friend-1'), position: 1, status: 'waiting' },
      { ...byId('friend-2'), position: 2, status: 'waiting' },
    ],
    handoffs: [
      {
        id: 'handoff-2a',
        bookId: 'book-2',
        fromFriend: null,
        toFriend: 'friend-5',
        happenedAt: daysAgo(63),
      },
      {
        id: 'handoff-2b',
        bookId: 'book-2',
        fromFriend: 'friend-5',
        toFriend: 'friend-1',
        happenedAt: daysAgo(0.2),
      },
    ],
  },
  {
    id: 'book-3',
    title: 'Circe',
    author: 'Madeline Miller',
    coverColor: '#c7a6b5',
    status: 'annotated',
    queue: [
      { ...byId('friend-3'), position: 0, status: 'done' },
      { ...byId('friend-5'), position: 1, status: 'done' },
      { ...byId('friend-4'), position: 2, status: 'reading' },
    ],
    handoffs: [
      {
        id: 'handoff-3a',
        bookId: 'book-3',
        fromFriend: null,
        toFriend: 'friend-3',
        happenedAt: daysAgo(94),
      },
      {
        id: 'handoff-3b',
        bookId: 'book-3',
        fromFriend: 'friend-3',
        toFriend: 'friend-5',
        happenedAt: daysAgo(38),
      },
      {
        id: 'handoff-3c',
        bookId: 'book-3',
        fromFriend: 'friend-5',
        toFriend: 'friend-4',
        happenedAt: daysAgo(7),
      },
    ],
  },
  {
    id: 'book-4',
    title: 'Piranesi',
    author: 'Susanna Clarke',
    coverColor: '#93a7a5',
    status: 'returned',
    queue: [
      { ...byId('friend-2'), position: 0, status: 'done' },
      { ...byId('friend-4'), position: 1, status: 'done' },
      { ...byId('friend-1'), position: 2, status: 'done' },
    ],
    handoffs: [
      {
        id: 'handoff-4a',
        bookId: 'book-4',
        fromFriend: null,
        toFriend: 'friend-2',
        happenedAt: daysAgo(121),
      },
      {
        id: 'handoff-4b',
        bookId: 'book-4',
        fromFriend: 'friend-2',
        toFriend: 'friend-4',
        happenedAt: daysAgo(88),
      },
      {
        id: 'handoff-4c',
        bookId: 'book-4',
        fromFriend: 'friend-4',
        toFriend: 'friend-1',
        happenedAt: daysAgo(59),
      },
    ],
  },
];
