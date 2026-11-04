import { describe, expect, it } from 'vitest';

import type { Book, Friend, Handoff } from '../types';
import { withJoined, withLeft, withPassedOn, withReceived } from './journeyChanges';

const ana: Friend = { id: 'ana', name: 'Ana', city: 'Austin', state: 'TX' };
const bea: Friend = { id: 'bea', name: 'Bea', city: 'Boston', state: 'MA' };

const leg = (id: string, from: string | null, to: string, received = true): Handoff => ({
  id,
  bookId: 'b',
  fromFriend: from,
  toFriend: to,
  happenedAt: `2026-01-0${id}T00:00:00Z`,
  receivedAt: received ? `2026-01-0${id}T00:00:00Z` : undefined,
});

const book = (overrides: Partial<Book> = {}): Book => ({
  id: 'b',
  title: 'Emma',
  author: 'Jane Austen',
  coverColor: '#000',
  queue: [
    { ...ana, position: 0, status: 'reading' },
    { ...bea, position: 1, status: 'waiting' },
  ],
  handoffs: [leg('1', null, 'ana')],
  ...overrides,
});

describe('journey changes', () => {
  it('passing on adds a leg in the post, and moves both readers along', () => {
    const next = withPassedOn(book(), leg('2', 'ana', 'bea', false));
    expect(next.handoffs).toHaveLength(2);
    expect(next.queue.find((entry) => entry.id === 'ana')?.status).toBe('done');
    expect(next.queue.find((entry) => entry.id === 'bea')?.status).toBe('reading');
  });

  it('passing on marks your own copy received if you never tapped Got it', () => {
    const start = book({ handoffs: [leg('1', null, 'bea'), leg('2', 'bea', 'ana', false)] });
    const next = withPassedOn(start, leg('3', 'ana', 'bea', false));
    expect(next.handoffs[1].receivedAt).toBe(next.handoffs[2].happenedAt);
  });

  it('sending it home answers a call home', () => {
    const called = book({
      calledHomeAt: '2026-01-05T00:00:00Z',
      handoffs: [leg('1', null, 'bea'), leg('2', 'bea', 'ana')],
    });
    expect(withPassedOn(called, leg('3', 'ana', 'bea', false)).calledHomeAt).toBeUndefined();
  });

  it('Got it records the arrival in your city', () => {
    const start = book({ handoffs: [leg('1', null, 'bea'), leg('2', 'bea', 'ana', false)] });
    const next = withReceived(start, ana, '2026-01-09T00:00:00Z');
    expect(next.handoffs[1]).toMatchObject({
      receivedAt: '2026-01-09T00:00:00Z',
      placeCity: 'Austin',
    });
  });

  it('joining puts you at the back, reusing a past place', () => {
    const next = withJoined(book(), { ...ana }, 5);
    expect(next.queue.filter((entry) => entry.id === 'ana')).toEqual([
      { ...ana, position: 5, status: 'waiting' },
    ]);
  });

  it('leaving removes a first-timer and keeps a rereader as done', () => {
    expect(withLeft(book(), 'bea', false).queue.map((entry) => entry.id)).toEqual(['ana']);
    expect(withLeft(book(), 'bea', true).queue.find((entry) => entry.id === 'bea')?.status).toBe(
      'done',
    );
  });
});
