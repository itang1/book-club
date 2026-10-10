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


// ---------------------------------------------------------------------------
// The year in review
// ---------------------------------------------------------------------------

export type YearInReview = ClubYear & {
  /** The copy with the most legs this year. */
  mostTravelled: { book: Book; legs: number } | null;
  /**
   * The best-loved book by its letters' stars this year. Needs two ratings:
   * one five-star letter is one reader's opinion, not the club's.
   */
  bestLoved: { book: Book; average: number; ratings: number } | null;
  /** Every place a book was read this year, most visits first. */
  placeList: PlaceVisit[];
  /** The reader's own year. */
  mine: { finished: number; lettersWritten: number; sentTo: string[] };
};

export function yearInReview(books: Book[], year: number, meId: string | null): YearInReview {
  const legsInYear = (book: Book) =>
    book.handoffs.filter((leg) => new Date(leg.happenedAt).getFullYear() === year);

  let mostTravelled: YearInReview['mostTravelled'] = null;
  let bestLoved: YearInReview['bestLoved'] = null;
  const places = new Map<string, PlaceVisit>();
  const sentTo = new Set<string>();
  let finished = 0;
  let lettersWritten = 0;

  for (const book of books) {
    const legs = legsInYear(book);
    if (legs.length > 0 && (!mostTravelled || legs.length > mostTravelled.legs)) {
      mostTravelled = { book, legs: legs.length };
    }

    const ratings = legs.map((leg) => leg.rating).filter((r): r is number => Boolean(r));
    if (ratings.length >= 2) {
      const average = ratings.reduce((sum, r) => sum + r, 0) / ratings.length;
      if (
        !bestLoved ||
        average > bestLoved.average ||
        (average === bestLoved.average && ratings.length > bestLoved.ratings)
      ) {
        bestLoved = { book, average, ratings: ratings.length };
      }
    }

    for (const leg of legs) {
      const place = placeOf(book, leg);
      const key = placeKey(place);
      if (place && key) {
        const existing = places.get(key);
        if (existing) {
          existing.visits += 1;
        } else {
          places.set(key, { city: place.city, region: place.region, visits: 1 });
        }
      }

      if (meId && leg.fromFriend === meId) {
        finished += 1;
        if (hasLetter(leg)) {
          lettersWritten += 1;
        }
        const name = book.queue.find((entry) => entry.id === leg.toFriend)?.name;
        if (name) {
          sentTo.add(name.split(' ')[0]);
        }
      }
    }
  }

  return {
    ...clubYear(books, year),
    mostTravelled,
    bestLoved,
    placeList: [...places.values()].sort(
      (a, b) => b.visits - a.visits || a.city.localeCompare(b.city),
    ),
    mine: { finished, lettersWritten, sentTo: [...sentTo].sort() },
  };
}

// ---------------------------------------------------------------------------
// One group, all time
// ---------------------------------------------------------------------------

export type GroupTotals = {
  books: number;
  handoffs: number;
  letters: number;
  readers: number;
  places: number;
};

/** Everything a group's books have done since they started travelling. */
export function groupTotals(books: Book[]): GroupTotals {
  const legs = books.flatMap((book) => book.handoffs.map((leg) => ({ book, leg })));
  const places = new Set(
    legs.map(({ book, leg }) => placeKey(placeOf(book, leg))).filter((key): key is string => Boolean(key)),
  );

  return {
    books: books.length,
    // Passes between people; putting a book into circulation isn't one.
    handoffs: legs.filter(({ leg }) => leg.fromFriend).length,
    letters: legs.filter(({ leg }) => hasLetter(leg)).length,
    readers: new Set(legs.map(({ leg }) => leg.toFriend)).size,
    places: places.size,
  };
}
