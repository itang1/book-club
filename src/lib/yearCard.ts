import type { YearInReview } from './stats';

/**
 * What goes on the shareable year-in-review picture. Drawing it is in
 * yearCardImage.ts; this half has no React Native in it, so it can be tested.
 */

export type YearCard = {
  year: number;
  /** The four big numbers, in order. */
  figures: { value: number; label: string }[];
  /** Up to two highlights: the furthest travelled and the best loved. */
  highlights: { kicker: string; title: string; detail: string }[];
  /** A handful of places, most visited first. */
  places: string[];
  morePlaces: number;
  /** "I passed on 3 books" when there's something to say. */
  mine: string | null;
};

const plural = (count: number, one: string, many: string) => `${count} ${count === 1 ? one : many}`;

/** What goes on the card, decided apart from drawing it, so it can be tested. */
export function yearCard(review: YearInReview, year: number): YearCard {
  const highlights: YearCard['highlights'] = [];
  if (review.mostTravelled) {
    highlights.push({
      kicker: 'Furthest travelled',
      title: review.mostTravelled.book.title,
      detail: `${plural(review.mostTravelled.legs, 'leg', 'legs')} of its journey`,
    });
  }
  if (review.bestLoved) {
    highlights.push({
      kicker: 'Best loved',
      title: review.bestLoved.book.title,
      detail: `${'★'.repeat(Math.round(review.bestLoved.average))} from ${plural(
        review.bestLoved.ratings,
        'note',
        'notes',
      )}`,
    });
  }

  const PLACES_SHOWN = 6;
  return {
    year,
    figures: [
      { value: review.handoffs, label: review.handoffs === 1 ? 'Handoff' : 'Handoffs' },
      { value: review.letters, label: review.letters === 1 ? 'Note' : 'Notes' },
      { value: review.readers, label: review.readers === 1 ? 'Reader' : 'Readers' },
      { value: review.places, label: review.places === 1 ? 'Place' : 'Places' },
    ],
    highlights,
    places: review.placeList.slice(0, PLACES_SHOWN).map((place) => place.city),
    morePlaces: Math.max(0, review.placeList.length - PLACES_SHOWN),
    mine:
      review.mine.finished > 0
        ? `I passed on ${plural(review.mine.finished, 'book', 'books')}${
            review.mine.lettersWritten > 0
              ? ` and left ${plural(review.mine.lettersWritten, 'note', 'notes')}`
              : ''
          }.`
        : null,
  };
}
