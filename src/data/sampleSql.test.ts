import { readFileSync, writeFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

import { sampleClubs, sampleQueue } from './sampleClubs';
import { sampleSql } from './sampleSql';

const file = new URL('../../supabase/sample.sql', import.meta.url);

describe('sample groups', () => {
  it('supabase/sample.sql is generated from sampleClubs.ts (npm run sample:sql)', () => {
    if (process.env.WRITE_SAMPLE_SQL) {
      writeFileSync(file, sampleSql());
    }
    expect(readFileSync(file, 'utf8')).toBe(sampleSql());
  });

  it('every stop and waiting reader is in the book’s group, and journeys run forward in time', () => {
    for (const club of sampleClubs) {
      const ids = new Set(club.people.map((person) => person.id));
      for (const book of club.books) {
        for (const id of [...book.journey.map((stop) => stop.to), ...(book.waiting ?? [])]) {
          expect(ids.has(id), `${book.id}: ${id}`).toBe(true);
        }
        book.journey.forEach((stop, index) => {
          if (index > 0) expect(stop.sent, book.id).toBeLessThan(book.journey[index - 1].sent);
          if (stop.got !== undefined && stop.got !== null) expect(stop.got, book.id).toBeLessThanOrEqual(stop.sent);
          if (index > 0) expect(stop.note, `${book.id} leg ${index + 1}`).toBeTruthy();
        });
      }
    }
  });

  it('a line has one reader at a time, and a copy back home has none', () => {
    for (const book of sampleClubs.flatMap((club) => club.books)) {
      const queue = sampleQueue(book);
      expect(queue.filter((entry) => entry.status === 'reading').length, book.id).toBeLessThanOrEqual(1);
      expect(new Set(queue.map((entry) => entry.friendId)).size).toBe(queue.length);
    }
  });
});
