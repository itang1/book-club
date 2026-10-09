import type { Book } from '../types';
import {
  canReturnHome,
  copyOwnerId,
  hasLetter,
  heldForDays,
  isInTransit,
  journey,
  placeKey,
  placeOf,
  waitingList,
} from './bookState';

/**
 * Numbers behind the visualisations. Everything is derived from the handoff
 * log and the queue, like the rest of the app; nothing here is stored.
 */

// ---------------------------------------------------------------------------
// One book's route
// ---------------------------------------------------------------------------

export type RouteStop = {
  key: string;
  personId: string;
  name: string;
  city: string;
  /**
   * past: had it and passed it on · current: has it now ·
   * arriving: it's in the post to them · upcoming: signed up and waiting ·
   * home: where it goes once the line is empty
   */
  kind: 'past' | 'current' | 'arriving' | 'upcoming' | 'home';
  /** Days held for past stops, days so far for the current one. */
  days: number | null;
};

const DAY_MS = 24 * 60 * 60 * 1000;

/** Everywhere this copy has been, where it is, and where it's headed next. */
export function routeOf(book: Book, now = Date.now()): RouteStop[] {
  const person = (id: string) => book.queue.find((entry) => entry.id === id);
  const firstName = (id: string) => person(id)?.name.split(' ')[0] ?? 'Someone';
  const legs = journey(book);

  const inPost = isInTransit(book);
  const travelled: RouteStop[] = legs.map((leg, index) => {
    const isLast = index === legs.length - 1;
    const arriving = isLast && inPost;
    return {
      key: leg.id,
      personId: leg.toFriend,
      name: firstName(leg.toFriend),
      city: placeOf(book, leg)?.city ?? '',
      kind: arriving ? 'arriving' : isLast ? 'current' : 'past',
      // No count while it's in the post: people tap Got it whenever they
      // remember, so a mail-time number would mostly be wrong.
      days: arriving
        ? null
        : isLast
          ? Math.max(0, Math.round((now - Date.parse(leg.receivedAt ?? leg.happenedAt)) / DAY_MS))
          : heldForDays(legs, index),
    };
  });

  const ahead: RouteStop[] = waitingList(book).map((entry) => ({
    key: `waiting-${entry.id}`,
    personId: entry.id,
    name: entry.name.split(' ')[0],
    city: entry.city,
    kind: 'upcoming',
    days: null,
  }));

  const owner = copyOwnerId(book);
  const home: RouteStop[] =
    owner && canReturnHome(book)
      ? [
          {
            key: 'home',
            personId: owner,
            name: firstName(owner),
            city: person(owner)?.city ?? '',
            kind: 'home',
            days: null,
          },
        ]
      : [];

  return [...travelled, ...ahead, ...home];
}

// ---------------------------------------------------------------------------
// One reader
// ---------------------------------------------------------------------------

export type MonthCount = {
  /** First day of the month, local time. */
  month: Date;
  count: number;
  titles: string[];
};

/**
 * Books this person finished in each of the last `months` months, oldest
 * first, empty months included so the axis is continuous. A finish is a
 * time they passed a copy on, the same definition as everywhere else.
 */
export function finishesByMonth(
  books: Book[],
  personId: string | null,
  months = 12,
  now = new Date(),
): MonthCount[] {
  const buckets: MonthCount[] = [];
  for (let back = months - 1; back >= 0; back -= 1) {
    buckets.push({
      month: new Date(now.getFullYear(), now.getMonth() - back, 1),
      count: 0,
      titles: [],
    });
  }

  if (!personId) {
    return buckets;
  }

  for (const book of books) {
    for (const leg of book.handoffs) {
      if (leg.fromFriend !== personId) {
        continue;
      }

      const at = new Date(leg.happenedAt);
      const bucket = buckets.find(
        (candidate) =>
          candidate.month.getFullYear() === at.getFullYear() &&
          candidate.month.getMonth() === at.getMonth(),
      );
      if (bucket) {
        bucket.count += 1;
        bucket.titles.push(book.title);
      }
    }
  }

  return buckets;
}

export type PlaceVisit = {
  city: string;
  region: string;
  visits: number;
};

/**
 * Every place the copies this person owns have been, most-visited first.
 * Keyed on city and region together, matching placesVisited().
 */
export function placesForOwner(books: Book[], ownerId: string | null): PlaceVisit[] {
  if (!ownerId) {
    return [];
  }

  const visits = new Map<string, PlaceVisit>();
  for (const book of books) {
    if (copyOwnerId(book) !== ownerId) {
      continue;
    }

    for (const leg of journey(book)) {
      const place = placeOf(book, leg);
      const key = placeKey(place);
      if (!place || !key) {
        continue;
      }

      const existing = visits.get(key);
      if (existing) {
        existing.visits += 1;
      } else {
        visits.set(key, { city: place.city, region: place.region, visits: 1 });
      }
    }
  }

  return [...visits.values()].sort((a, b) => b.visits - a.visits || a.city.localeCompare(b.city));
}

// ---------------------------------------------------------------------------
// The whole club
// ---------------------------------------------------------------------------

export type ClubYear = {
  year: number;
  handoffs: number;
  letters: number;
  readers: number;
  places: number;
  booksMoving: number;
};

/** What the club did in one calendar year. A first leg counts as a handoff too. */
export function clubYear(books: Book[], year: number): ClubYear {
  const inYear = books.flatMap((book) =>
    book.handoffs
      .filter((leg) => new Date(leg.happenedAt).getFullYear() === year)
      .map((leg) => ({ book, leg })),
  );

  const places = new Set<string>();
  const readers = new Set<string>();
  for (const { book, leg } of inYear) {
    readers.add(leg.toFriend);
    const key = placeKey(placeOf(book, leg));
    if (key) {
      places.add(key);
    }
  }

  return {
    year,
    handoffs: inYear.length,
    letters: inYear.filter(({ leg }) => hasLetter(leg)).length,
    readers: readers.size,
    places: places.size,
    booksMoving: new Set(inYear.map(({ book }) => book.id)).size,
  };
}

