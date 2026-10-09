import { describe, expect, it } from 'vitest';

import type { Book } from '../types';
import { clubYear, finishesByMonth, placesForOwner, routeOf } from './stats';

const book: Book = {
  id: 'book',
  title: 'Circe',
  author: 'Madeline Miller',
  coverColor: '#000000',
  queue: [
    { id: 'ana', name: 'Ana Reader', city: 'Austin', state: 'TX', position: 0, status: 'done' },
    { id: 'bea', name: 'Bea Reader', city: 'Boston', state: 'MA', position: 1, status: 'reading' },
    { id: 'cat', name: 'Cat Reader', city: 'Austin', state: 'TX', position: 2, status: 'waiting' },
  ],
  handoffs: [
    {
      id: 'a',
      bookId: 'book',
      fromFriend: null,
      toFriend: 'ana',
      happenedAt: '2026-01-01T12:00:00Z',
      receivedAt: '2026-01-01T12:00:00Z',
    },
    {
      id: 'b',
      bookId: 'book',
      fromFriend: 'ana',
      toFriend: 'bea',
      happenedAt: '2026-01-11T12:00:00Z',
      receivedAt: '2026-01-11T12:00:00Z',
      note: 'Hi',
    },
  ],
};

describe('routeOf', () => {
  it('lists where it has been, where it is, and who is waiting', () => {
    const now = Date.parse('2026-01-16T12:00:00Z');
    expect(routeOf(book, now).map((stop) => [stop.name, stop.kind, stop.days])).toEqual([
      ['Ana', 'past', 10],
      ['Bea', 'current', 5],
      ['Cat', 'upcoming', null],
    ]);
  });
});

describe('routeOf while in the post', () => {
  it("shows the recipient as arriving, with no day count", () => {
    const inPost: Book = {
      ...book,
      handoffs: [book.handoffs[0], { ...book.handoffs[1], receivedAt: undefined }],
    };
    const bea = routeOf(inPost).find((stop) => stop.name === 'Bea');
    expect(bea).toMatchObject({ kind: 'arriving', days: null });
  });
});

describe('finishesByMonth', () => {
  it('counts a pass-on as a finish, with empty months kept', () => {
    const months = finishesByMonth([book], 'ana', 3, new Date('2026-02-10T12:00:00Z'));
    expect(months.map((m) => m.count)).toEqual([0, 1, 0]);
    expect(months[1].titles).toEqual(['Circe']);
  });
});

describe('placesForOwner', () => {
  it('counts each place a copy has been, keyed on city and state', () => {
    expect(placesForOwner([book], 'ana')).toEqual([
      { city: 'Austin', region: 'TX', visits: 1 },
      { city: 'Boston', region: 'MA', visits: 1 },
    ]);
    expect(placesForOwner([book], 'bea')).toEqual([]);
  });
});

describe('clubYear', () => {
  it('sums the year', () => {
    expect(clubYear([book], 2026)).toEqual({
      year: 2026,
      handoffs: 2,
      letters: 1,
      readers: 2,
      places: 2,
      booksMoving: 1,
    });
    expect(clubYear([book], 2025).handoffs).toBe(0);
  });
});
