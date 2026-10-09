import type { Book, Friend, Friendship, Group } from '../types';

/**
 * Fictional demo group: the four girls from The Sisterhood of the Traveling
 * Pants, in the places they spend the first book's summer. Kept fictional on
 * purpose — this file ships in the client bundle and the repo is public.
 */

const daysAgo = (days: number): string =>
  new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();

export const friends: Friend[] = [
  {
    id: 'friend-lena',
    name: 'Lena Kaligaris',
    city: 'Santorini',
    state: 'Greece',
  },
  {
    id: 'friend-tibby',
    name: 'Tibby Rollins',
    city: 'Bethesda',
    state: 'MD',
  },
  {
    id: 'friend-carmen',
    name: 'Carmen Lowell',
    city: 'Charleston',
    state: 'SC',
  },
  {
    id: 'friend-bridget',
    name: 'Bridget Vreeland',
    city: 'Baja California',
    state: 'Mexico',
  },
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
    title: 'Pride and Prejudice',
    author: 'Jane Austen',
    coverColor: '#c89366',
    queue: [
      { ...byId('friend-carmen'), position: 0, status: 'done' },
      { ...byId('friend-lena'), position: 1, status: 'reading' },
      { ...byId('friend-tibby'), position: 2, status: 'waiting' },
      { ...byId('friend-bridget'), position: 3, status: 'waiting' },
    ],
    handoffs: [
      {
        id: 'handoff-1a',
        bookId: 'book-1',
        fromFriend: null,
        toFriend: 'friend-carmen',
        happenedAt: daysAgo(41),
      },
      {
        id: 'handoff-1b',
        bookId: 'book-1',
        fromFriend: 'friend-carmen',
        toFriend: 'friend-lena',
        happenedAt: daysAgo(12),
        rating: 5,
        note: "Read it somewhere sunny. You'll work out which of us is which by chapter three.",
      },
    ],
  },
  {
    id: 'book-2',
    title: 'A Room with a View',
    author: 'E. M. Forster',
    coverColor: '#c7a6b5',
    queue: [
      { ...byId('friend-lena'), position: 0, status: 'done' },
      { ...byId('friend-bridget'), position: 1, status: 'reading' },
      { ...byId('friend-tibby'), position: 2, status: 'waiting' },
    ],
    handoffs: [
      {
        id: 'handoff-2a',
        bookId: 'book-2',
        fromFriend: null,
        toFriend: 'friend-lena',
        happenedAt: daysAgo(63),
      },
      {
        id: 'handoff-2b',
        bookId: 'book-2',
        fromFriend: 'friend-lena',
        toFriend: 'friend-bridget',
        happenedAt: daysAgo(0.2),
        rating: 3,
        note: "Slow to start, then it's all sunlight. Lucy is so frustrating and so right.",
      },
    ],
  },
  {
    id: 'book-3',
    title: 'Little Women',
    author: 'Louisa May Alcott',
    giftedBy: 'Grandma',
    coverColor: '#a8927d',
    queue: [
      { ...byId('friend-tibby'), position: 0, status: 'done' },
      { ...byId('friend-carmen'), position: 1, status: 'done' },
      { ...byId('friend-bridget'), position: 2, status: 'reading' },
    ],
    handoffs: [
      {
        id: 'handoff-3a',
        bookId: 'book-3',
        fromFriend: null,
        toFriend: 'friend-tibby',
        happenedAt: daysAgo(94),
      },
      {
        id: 'handoff-3b',
        bookId: 'book-3',
        fromFriend: 'friend-tibby',
        toFriend: 'friend-carmen',
        happenedAt: daysAgo(38),
        rating: 4,
        note: 'Bring tissues. I mean it. Call me when you get to the end.',
      },
      {
        id: 'handoff-3c',
        bookId: 'book-3',
        fromFriend: 'friend-carmen',
        toFriend: 'friend-bridget',
        happenedAt: daysAgo(7),
        rating: 5,
        note: 'I underlined way too much, sorry not sorry.',
      },
    ],
  },
  {
    id: 'book-4',
    title: 'Anne of Green Gables',
    author: 'L. M. Montgomery',
    coverColor: '#8f9bb0',
    queue: [
      { ...byId('friend-bridget'), position: 0, status: 'done' },
      { ...byId('friend-carmen'), position: 2, status: 'done' },
      // Tibby read it already and signed up again for a second read.
      { ...byId('friend-tibby'), position: 3, status: 'waiting' },
    ],
    handoffs: [
      {
        id: 'handoff-4a',
        bookId: 'book-4',
        fromFriend: null,
        toFriend: 'friend-bridget',
        happenedAt: daysAgo(121),
      },
      {
        id: 'handoff-4b',
        bookId: 'book-4',
        fromFriend: 'friend-bridget',
        toFriend: 'friend-tibby',
        happenedAt: daysAgo(88),
        rating: 4,
        note: "Anne talks a lot for the first fifty pages. You'll love her anyway.",
      },
      {
        id: 'handoff-4c',
        bookId: 'book-4',
        fromFriend: 'friend-tibby',
        toFriend: 'friend-carmen',
        happenedAt: daysAgo(59),
        rating: 5,
        note: "Kindred spirits. That's all I'll say.",
      },
      {
        id: 'handoff-4d',
        bookId: 'book-4',
        fromFriend: 'friend-carmen',
        toFriend: 'friend-bridget',
        happenedAt: daysAgo(20),
        rating: 4,
        note: "Thank you for lending me your copy. It's a little sandier now.",
      },
    ],
  },
  {
    // Lena's Jane Eyre: all the way round the group and home again.
    id: 'book-5',
    title: 'Jane Eyre',
    author: 'Charlotte Brontë',
    coverColor: '#b4b8a9',
    queue: [
      { ...byId('friend-lena'), position: 0, status: 'done' },
      { ...byId('friend-carmen'), position: 1, status: 'done' },
      { ...byId('friend-tibby'), position: 2, status: 'done' },
      { ...byId('friend-bridget'), position: 3, status: 'done' },
    ],
    handoffs: [
      { id: 'handoff-5a', bookId: 'book-5', fromFriend: null, toFriend: 'friend-lena', happenedAt: daysAgo(200) },
      {
        id: 'handoff-5b',
        bookId: 'book-5',
        fromFriend: 'friend-lena',
        toFriend: 'friend-carmen',
        happenedAt: daysAgo(170),
        rating: 5,
        note: 'Reader, I mailed it. Tell me when you meet Mr. Rochester.',
      },
      {
        id: 'handoff-5c',
        bookId: 'book-5',
        fromFriend: 'friend-carmen',
        toFriend: 'friend-tibby',
        happenedAt: daysAgo(140),
        rating: 4,
        note: 'Darker than I expected and better for it. Read the attic chapters at night.',
      },
      {
        id: 'handoff-5d',
        bookId: 'book-5',
        fromFriend: 'friend-tibby',
        toFriend: 'friend-bridget',
        happenedAt: daysAgo(110),
        rating: 5,
        note: 'Jane would have been great at soccer. Stubborn, fast, never quits.',
      },
      {
        id: 'handoff-5e',
        bookId: 'book-5',
        fromFriend: 'friend-bridget',
        toFriend: 'friend-lena',
        happenedAt: daysAgo(75),
        rating: 5,
        note: 'Home it goes, with sand in the spine. Thank you for starting this one.',
      },
    ],
  },
];

/**
 * Who's friends with whom. Lena and Bridget aren't friends yet, though they
 * share Carmen and Tibby, so Bridget has asked: the demo shows a request
 * waiting for Lena, who is who the dev bar starts as.
 */
const accepted = (a: string, b: string): Friendship => ({
  a,
  b,
  status: 'accepted',
  requestedBy: a,
});

export const friendshipsSeed: Friendship[] = [
  accepted('friend-carmen', 'friend-lena'),
  accepted('friend-lena', 'friend-tibby'),
  accepted('friend-bridget', 'friend-carmen'),
  accepted('friend-bridget', 'friend-tibby'),
  { a: 'friend-bridget', b: 'friend-lena', status: 'pending', requestedBy: 'friend-bridget' },
];

/** The four of them are one group, and every demo book is lent within it. */
export const groupsSeed: Group[] = [
  {
    id: 'group-pants',
    name: 'The Traveling Pants',
    inviteCode: 'pants-demo',
    memberIds: ['friend-lena', 'friend-tibby', 'friend-carmen', 'friend-bridget'],
  },
];

/**
 * Every demo book is lent within The Traveling Pants. Every demo leg has
 * arrived (Got it) when it was sent, except Lena's A Room with a View to
 * Bridget, sent five hours ago: it's still in the post, so the demo shows
 * that state too.
 */
for (const book of booksSeed) {
  book.groupId = 'group-pants';
  for (const leg of book.handoffs) {
    if (leg.id !== 'handoff-2b') {
      leg.receivedAt = leg.happenedAt;
    }
  }
}
