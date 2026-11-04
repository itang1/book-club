import { describe, expect, it } from 'vitest';

import type { Book } from '../types';
import { lately } from './lately';

const person = (id: string, name: string, position: number) => ({
  id,
  name,
  city: 'Austin',
  state: 'TX',
  position,
  status: 'done' as const,
});

const book: Book = {
  id: 'b',
  title: 'Circe',
  author: 'Madeline Miller',
  coverColor: '#ccc',
  queue: [
    person('ana', 'Ana Reader', 0),
    person('bea', 'Bea Reader', 1),
    person('cat', 'Cat Reader', 2),
  ],
  handoffs: [
    {
      id: '1',
      bookId: 'b',
      fromFriend: null,
      toFriend: 'ana',
      happenedAt: '2026-01-01T00:00:00Z',
      receivedAt: '2026-01-01T00:00:00Z',
    },
    {
      id: '2',
      bookId: 'b',
      fromFriend: 'ana',
      toFriend: 'bea',
      happenedAt: '2026-01-05T00:00:00Z',
      receivedAt: '2026-01-08T00:00:00Z',
      note: 'secret',
    },
    {
      id: '3',
      bookId: 'b',
      fromFriend: 'bea',
      toFriend: 'cat',
      happenedAt: '2026-01-20T00:00:00Z',
    },
  ],
};

describe('lately', () => {
  it('lists lends, sends and arrivals, newest first, by full name', () => {
    expect(lately([book]).map((e) => [e.who, e.verb, e.to])).toEqual([
      ['Bea Reader', 'sent', 'Cat Reader'],
      ['Bea Reader', 'got', undefined],
      ['Ana Reader', 'sent', 'Bea Reader'],
      ['Ana Reader', 'lent', undefined],
    ]);
  });

  it('never carries a note, leaves out rested copies, and stops at the limit', () => {
    expect(JSON.stringify(lately([book]))).not.toContain('secret');
    expect(lately([{ ...book, archivedAt: '2026-02-01T00:00:00Z' }])).toEqual([]);
    expect(lately([book], 2)).toHaveLength(2);
  });
});
