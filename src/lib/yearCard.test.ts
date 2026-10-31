import { describe, expect, it } from 'vitest';

import type { Book } from '../types';
import type { YearInReview } from './stats';
import { yearCard } from './yearCard';

const book = (title: string) => ({ title }) as Book;

const review = (overrides: Partial<YearInReview> = {}): YearInReview => ({
  year: 2026,
  handoffs: 12,
  letters: 1,
  readers: 4,
  places: 8,
  booksMoving: 3,
  mostTravelled: { book: book('Persuasion'), legs: 5 },
  bestLoved: { book: book('Emma'), average: 4.6, ratings: 3 },
  placeList: ['Austin', 'Boston', 'Chicago', 'Denver', 'El Paso', 'Fresno', 'Gary', 'Houston'].map(
    (city) => ({ city, region: '', visits: 1 }),
  ),
  mine: { finished: 2, lettersWritten: 1, sentTo: ['Mo'] },
  ...overrides,
});

describe('yearCard', () => {
  it('leads with the four figures, singular where it should be', () => {
    expect(yearCard(review(), 2026).figures).toEqual([
      { value: 12, label: 'Handoffs' },
      { value: 1, label: 'Note' },
      { value: 4, label: 'Readers' },
      { value: 8, label: 'Places' },
    ]);
  });

  it('names the furthest travelled and best loved books', () => {
    expect(yearCard(review(), 2026).highlights).toEqual([
      { kicker: 'Furthest travelled', title: 'Persuasion', detail: '5 legs of its journey' },
      { kicker: 'Best loved', title: 'Emma', detail: '★★★★★ from 3 notes' },
    ]);
  });

  it('leaves out highlights the year does not have', () => {
    const card = yearCard(review({ mostTravelled: null, bestLoved: null }), 2026);
    expect(card.highlights).toEqual([]);
  });

  it('shows six places and counts the rest', () => {
    const card = yearCard(review(), 2026);
    expect(card.places).toHaveLength(6);
    expect(card.morePlaces).toBe(2);
  });

  it('says what you did, only if you did something', () => {
    expect(yearCard(review(), 2026).mine).toBe('I passed on 2 books and left 1 note.');
    expect(
      yearCard(review({ mine: { finished: 0, lettersWritten: 0, sentTo: [] } }), 2026).mine,
    ).toBeNull();
  });
});
