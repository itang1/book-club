import type { Book, Friend, Friendship, Group } from '../types';
import { sampleClubs, samplePeople, sampleQueue } from './sampleClubs';

/**
 * The demo (`npm run demo`): the sample groups from sampleClubs.ts, viewed as
 * one of the Traveling Pants girls. Their group is a real one here, so the
 * demo can lend, pass and sign up; the other casts are sample groups, as a
 * newcomer sees them. Fictional on purpose: this file ships in the client
 * bundle and the repo is public.
 */

const daysAgo = (days: number): string =>
  new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();

export const friends: Friend[] = samplePeople.map(({ id, name, city, state }) => ({ id, name, city, state }));

const byId = (id: string): Friend => {
  const friend = friends.find((candidate) => candidate.id === id);
  if (!friend) {
    throw new Error(`Unknown seed friend: ${id}`);
  }
  return friend;
};

export const booksSeed: Book[] = sampleClubs.flatMap((club) =>
  club.books.map((book) => ({
    id: book.id,
    title: book.title,
    author: book.author,
    coverColor: book.color,
    coverUrl: book.cover ? `https://covers.openlibrary.org/b/id/${book.cover}-M.jpg` : undefined,
    giftedBy: book.giftedBy,
    groupId: club.id,
    queue: sampleQueue(book).map(({ friendId, position, status }) => ({ ...byId(friendId), position, status })),
    handoffs: book.journey.map((stop, index) => {
      const to = byId(stop.to);
      const got = stop.got === undefined ? stop.sent : stop.got;
      return {
        id: `${book.id}-${index + 1}`,
        bookId: book.id,
        fromFriend: index === 0 ? null : book.journey[index - 1].to,
        toFriend: stop.to,
        happenedAt: daysAgo(stop.sent),
        receivedAt: got === null ? undefined : daysAgo(got),
        placeCity: got === null ? undefined : (stop.place?.[0] ?? to.city),
        placeRegion: got === null ? undefined : (stop.place?.[1] ?? to.state),
        rating: stop.rating,
        note: stop.note,
      };
    }),
  })),
);

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

const pants = sampleClubs[0];
const pantsIds = pants.people.map((person) => person.id);

/** The Traveling Pants are a real group in the demo; everyone else is a sample cast. */
export const groupsSeed: Group[] = sampleClubs.map((club) => ({
  id: club.id,
  name: club.name,
  inviteCode: club === pants ? 'pants-demo' : club.inviteCode,
  memberIds: club === pants ? pantsIds : [...club.people.map((person) => person.id), ...pantsIds],
  isSample: club !== pants,
}));
