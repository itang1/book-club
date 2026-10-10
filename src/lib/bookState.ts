import type { Book, Handoff, ReadingQueueEntry } from '../types';

const DAY_MS = 24 * 60 * 60 * 1000;

/** Handoffs oldest-first. The stored order is not trusted. */
export function journey(book: Book): Handoff[] {
  return [...book.handoffs].sort(
    (a, b) => Date.parse(a.happenedAt) - Date.parse(b.happenedAt),
  );
}

export function latestHandoff(book: Book): Handoff | undefined {
  const legs = journey(book);
  return legs[legs.length - 1];
}

/** The book is wherever the newest handoff delivered it. */
export function holderId(book: Book): string | null {
  return latestHandoff(book)?.toFriend ?? null;
}

/**
 * Whose copy this is: the person the first leg delivered it to. The copy goes
 * home to them once nobody else is waiting for it.
 */
export function copyOwnerId(book: Book): string | null {
  return journey(book)[0]?.toFriend ?? null;
}

export function lastActivityAt(book: Book): string | null {
  return latestHandoff(book)?.happenedAt ?? null;
}

export function readingQueue(book: Book): ReadingQueueEntry[] {
  return [...book.queue].sort((a, b) => a.position - b.position);
}

/** Everyone who has signed up and not had their turn yet, in sign-up order. */
export function waitingList(book: Book): ReadingQueueEntry[] {
  const holder = holderId(book);
  return readingQueue(book).filter(
    (entry) => entry.status === 'waiting' && entry.id !== holder,
  );
}

/**
 * Whoever signed up earliest and is still waiting, or null when nobody is.
 *
 * Nobody is put in line automatically: the queue only holds people who asked
 * for the book, so "next" is simply the oldest sign-up that hasn't had a turn.
 */
export function nextInLineId(book: Book): string | null {
  return waitingList(book)[0]?.id ?? null;
}

/** 1-based place in line, or null if this person isn't waiting. */
export function placeInLine(book: Book, friendId: string | null): number | null {
  const index = waitingList(book).findIndex((entry) => entry.id === friendId);
  return index === -1 ? null : index + 1;
}

/** The copy has made its rounds and is back with whoever it belongs to. */
export function isBackHome(book: Book): boolean {
  return book.handoffs.length > 1 && holderId(book) === copyOwnerId(book);
}

/**
 * The holder can send it home once nobody else is waiting. Never true for the
 * owner, who already has it.
 */
export function canReturnHome(book: Book): boolean {
  const owner = copyOwnerId(book);
  return Boolean(owner) && holderId(book) !== owner && nextInLineId(book) === null;
}

/**
 * Sent but not yet "Got it": it's in the post. The holder is already the
 * recipient (it's theirs to receive), but nobody has it in their hands.
 */
export function isInTransit(book: Book): boolean {
  const latest = latestHandoff(book);
  return Boolean(latest && latest.fromFriend && !latest.receivedAt);
}

/** Who sent the book that's in the post, or null if nothing is. */
export function senderId(book: Book): string | null {
  return isInTransit(book) ? latestHandoff(book)?.fromFriend ?? null : null;
}

/**
 * Status is derived, never stored. A stored status drifted from the log it was
 * meant to summarise ("in transit" stuck forever after a handoff); deriving it
 * from whether the newest leg has arrived means it can't.
 */
export function statusLabel(book: Book): string {
  if (!holderId(book)) {
    return 'Ready to travel';
  }
  if (isInTransit(book)) {
    return 'In the post';
  }

  return isBackHome(book) ? 'Back home' : 'Being read';
}

/** Distinct people who have had this copy; a trip home isn't a new reader. */
export function readersSoFar(book: Book): number {
  return new Set(book.handoffs.map((leg) => leg.toFriend)).size;
}

/**
 * How many times this person has finished the copy, counted from the log: each
 * time they passed it on is a read completed. Derived rather than read off the
 * queue, because the queue row is reused when someone signs up to read it
 * again and its status goes back to "waiting".
 */
export function timesRead(book: Book, friendId: string | null): number {
  if (!friendId) {
    return 0;
  }

  return book.handoffs.filter((leg) => leg.fromFriend === friendId).length;
}

export function hasFinished(book: Book, friendId: string | null): boolean {
  return timesRead(book, friendId) > 0;
}

/**
 * Letters stay sealed until you've finished this copy yourself, so nobody's
 * opinion colours your read. You can always see a letter you wrote, and a
 * second read doesn't re-seal what you've already opened.
 */
export function canReadLetter(book: Book, leg: Handoff, viewerId: string | null): boolean {
  if (!viewerId) {
    return false;
  }

  return leg.fromFriend === viewerId || hasFinished(book, viewerId);
}

export function hasLetter(leg: Handoff): boolean {
  return Boolean(leg.note?.trim() || leg.rating);
}

/** The newest legs across every book, for the "Recently" feed. */
export function recentActivity(books: Book[], limit: number): { book: Book; leg: Handoff }[] {
  return books
    .flatMap((book) => book.handoffs.map((leg) => ({ book, leg })))
    .sort((a, b) => Date.parse(b.leg.happenedAt) - Date.parse(a.leg.happenedAt))
    .slice(0, limit);
}

/** One leg as a sentence: "Carmen passed Circe to Lena". First names only. */
export function describeLeg(book: Book, leg: Handoff): string {
  const first = (id: string | null) => friendNameIn(book, id).split(' ')[0];

  if (!leg.fromFriend) {
    return `${first(leg.toFriend)} put ${book.title} into circulation`;
  }
  if (leg.toFriend === copyOwnerId(book)) {
    return `${book.title} went home to ${first(leg.toFriend)}`;
  }

  return `${first(leg.fromFriend)} passed ${book.title} to ${first(leg.toFriend)}`;
}

export function friendNameIn(book: Book, friendId: string | null): string {
  if (!friendId) {
    return 'Unassigned';
  }

  return book.queue.find((entry) => entry.id === friendId)?.name ?? 'Unknown';
}

/**
 * How many distinct places this copy has been, keyed on city and region:
 * same city counts once, two Springfields stay two, neighbouring towns aren't merged.
 */
export function placesVisited(book: Book): number {
  const places = journey(book).map((leg) => placeKey(placeOf(book, leg)));
  return new Set(places.filter(Boolean)).size;
}

export type Place = { city: string; region: string };

/**
 * Where a leg was read: the city recorded on the leg when it arrived, so a
 * reader who moves later doesn't move their past stops. Legs from before
 * that was recorded fall back to the reader's current city.
 */
export function placeOf(book: Book, leg: Handoff): Place | null {
  if (leg.placeCity) {
    return { city: leg.placeCity, region: leg.placeRegion ?? '' };
  }

  const entry = book.queue.find((person) => person.id === leg.toFriend);
  return entry ? { city: entry.city, region: entry.state } : null;
}

/** City and region together, case-insensitive: two Springfields stay two. */
export function placeKey(place: Place | null): string | null {
  return place
    ? `${place.city.trim().toLowerCase()}|${place.region.trim().toLowerCase()}`
    : null;
}

/** The longest any single reader has held this copy, in days. */
export function longestHoldDays(book: Book): number {
  const legs = journey(book);
  let longest = 0;

  for (let i = 0; i < legs.length; i += 1) {
    const held = heldForDays(legs, i);
    if (held !== null && held > longest) {
      longest = held;
    }
  }

  return longest;
}

export function daysInCirculation(book: Book): number {
  const legs = journey(book);
  const first = legs[0];
  if (!first) {
    return 0;
  }

  return Math.max(0, Math.round((Date.now() - Date.parse(first.happenedAt)) / DAY_MS));
}

/**
 * How long the recipient of `legs[index]` held the book before passing it on.
 * Returns null for the leg still in progress.
 */
export function heldForDays(legs: Handoff[], index: number): number | null {
  const leg = legs[index];
  const next = legs[index + 1];
  if (!leg || !next) {
    return null;
  }

  return Math.max(
    0,
    Math.round((Date.parse(next.happenedAt) - Date.parse(leg.happenedAt)) / DAY_MS),
  );
}

export function relativeTime(iso: string | null): string {
  if (!iso) {
    return 'Ready to travel';
  }

  const then = Date.parse(iso);
  if (Number.isNaN(then)) {
    return iso;
  }

  const minutes = Math.round((Date.now() - then) / 60000);
  if (minutes < 1) {
    return 'Just now';
  }
  if (minutes < 60) {
    return `${minutes}m ago`;
  }

  const hours = Math.round(minutes / 60);
  if (hours < 24) {
    return `${hours}h ago`;
  }

  const days = Math.round(hours / 24);
  if (days < 7) {
    return `${days}d ago`;
  }

  const weeks = Math.round(days / 7);
  if (weeks < 5) {
    return `${weeks}w ago`;
  }

  return `${Math.round(days / 30)}mo ago`;
}

export function formatDate(iso: string): string {
  const parsed = Date.parse(iso);
  if (Number.isNaN(parsed)) {
    return iso;
  }

  return new Date(parsed).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}
