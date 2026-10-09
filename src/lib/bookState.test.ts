import { describe, expect, it } from 'vitest';

import type { Book, Handoff, ReadingQueueEntry } from '../types';
import {
  canReadLetter,
  canReturnHome,
  copyOwnerId,
  describeLeg,
  hasFinished,
  holderId,
  isBackHome,
  nextInLineId,
  placeInLine,
  readersSoFar,
  recentActivity,
  statusLabel,
  timesRead,
} from './bookState';

/**
 * The rules these test are the ones a real group would notice going wrong:
 * who has the book, who's next, when it goes home, and what's sealed.
 */

const person = (id: string, position: number, status: ReadingQueueEntry['status']) => ({
  id,
  name: `${id[0].toUpperCase()}${id.slice(1)} Reader`,
  city: `${id}ville`,
  state: 'XX',
  position,
  status,
});

let legCount = 0;
const leg = (from: string | null, to: string, day: number, extra: Partial<Handoff> = {}): Handoff => ({
  id: `leg-${(legCount += 1)}`,
  bookId: 'book',
  fromFriend: from,
  toFriend: to,
  happenedAt: new Date(Date.UTC(2026, 0, day)).toISOString(),
  ...extra,
});

const book = (queue: ReadingQueueEntry[], handoffs: Handoff[]): Book => ({
  id: 'book',
  title: 'Circe',
  author: 'Madeline Miller',
  coverColor: '#000000',
  queue,
  handoffs,
});

describe('who has it and who owns it', () => {
  it('follows the newest leg, whatever order the log arrives in', () => {
    const b = book(
      [person('ana', 0, 'done'), person('bea', 1, 'reading')],
      [leg('ana', 'bea', 10), leg(null, 'ana', 1)],
    );
    expect(holderId(b)).toBe('bea');
    expect(copyOwnerId(b)).toBe('ana');
  });

  it('has no holder before the first leg', () => {
    expect(holderId(book([], []))).toBeNull();
    expect(statusLabel(book([], []))).toBe('Not circulating');
  });
});

describe('the line', () => {
  const b = book(
    [
      person('ana', 0, 'done'),
      person('bea', 1, 'reading'),
      person('cat', 2, 'waiting'),
      person('dee', 3, 'waiting'),
    ],
    [leg(null, 'ana', 1), leg('ana', 'bea', 5)],
  );

  it('is the earliest waiting sign-up, never the holder', () => {
    expect(nextInLineId(b)).toBe('cat');
    expect(placeInLine(b, 'dee')).toBe(2);
    expect(placeInLine(b, 'bea')).toBeNull();
  });

  it("doesn't send it home while someone is waiting", () => {
    expect(canReturnHome(b)).toBe(false);
  });
});

describe('going home', () => {
  const out = book(
    [person('ana', 0, 'done'), person('bea', 1, 'reading')],
    [leg(null, 'ana', 1), leg('ana', 'bea', 5)],
  );
  const home = book(out.queue, [...out.handoffs, leg('bea', 'ana', 9)]);

  it('can go home once nobody is waiting', () => {
    expect(canReturnHome(out)).toBe(true);
    expect(isBackHome(out)).toBe(false);
  });

  it('is back home when the owner has it again, and that is not a new reader', () => {
    expect(isBackHome(home)).toBe(true);
    expect(canReturnHome(home)).toBe(false);
    expect(statusLabel(home)).toBe('Back home');
    expect(readersSoFar(home)).toBe(2);
  });
});

describe('rereads and sealed letters', () => {
  const b = book(
    [person('ana', 0, 'done'), person('bea', 1, 'waiting'), person('cat', 2, 'reading')],
    [
      leg(null, 'ana', 1),
      leg('ana', 'bea', 3, { note: 'Ana to Bea', rating: 5 }),
      leg('bea', 'cat', 6, { note: 'Bea to Cat' }),
    ],
  );

  it('counts reads from the log, so a reread keeps the first one', () => {
    // Bea's row says "waiting" again (signed up to reread), but she passed it on once.
    expect(timesRead(b, 'bea')).toBe(1);
    expect(hasFinished(b, 'bea')).toBe(true);
    expect(nextInLineId(b)).toBe('bea');
  });

  it('keeps letters sealed until you have finished it', () => {
    const [, toBea, toCat] = b.handoffs;
    expect(canReadLetter(b, toCat, 'cat')).toBe(false);
    expect(canReadLetter(b, toBea, 'bea')).toBe(true);
    expect(canReadLetter(b, toCat, 'bea')).toBe(true);
    expect(canReadLetter(b, toBea, null)).toBe(false);
  });
});

describe('the feed', () => {
  it('describes legs as sentences, newest first', () => {
    const b = book(
      [person('ana', 0, 'done'), person('bea', 1, 'done')],
      [leg(null, 'ana', 1), leg('ana', 'bea', 2), leg('bea', 'ana', 3)],
    );
    const recent = recentActivity([b], 2);
    expect(recent.map(({ leg: l }) => describeLeg(b, l))).toEqual([
      'Circe went home to Ana',
      'Ana passed Circe to Bea',
    ]);
  });
});
