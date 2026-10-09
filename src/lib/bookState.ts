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
export function currentOwnerId(book: Book): string | null {
  return latestHandoff(book)?.toFriend ?? null;
}

export function lastActivityAt(book: Book): string | null {
  return latestHandoff(book)?.happenedAt ?? null;
}

export function readingQueue(book: Book): ReadingQueueEntry[] {
  return [...book.queue].sort((a, b) => a.position - b.position);
}

/**
 * Whoever is next in the reading queue after the current holder, or null when
 * the queue runs out.
 *
 * Note this is derived from queue *position*, not from anyone asking for the
 * book. It answers "who is next in the agreed order", not "who wants it next".
 * A request model — people asking for a copy and the holder accepting — would
 * replace this with the oldest accepted request.
 */
export function nextInLineId(book: Book): string | null {
  const queue = readingQueue(book);
  const ownerId = currentOwnerId(book);

  if (!ownerId) {
    return queue[0]?.id ?? null;
  }

  const index = queue.findIndex((entry) => entry.id === ownerId);
  if (index === -1) {
    return queue[0]?.id ?? null;
  }

  return queue[index + 1]?.id ?? null;
}

export function friendNameIn(book: Book, friendId: string | null): string {
  if (!friendId) {
    return 'Unassigned';
  }

  return book.queue.find((entry) => entry.id === friendId)?.name ?? 'Unknown';
}

/**
 * How many distinct places this copy has been.
 *
 * Keyed on city *and* region, so two readers in the same city count once — the
 * book didn't travel anywhere new — while two Springfields in different states
 * stay separate. Deliberately makes no attempt to merge neighbouring towns:
 * Seattle and Bellevue are two places, and deciding otherwise would need real
 * coordinates and an arbitrary radius. Simple and explainable beats clever and
 * surprising here.
 */
export function placesVisited(book: Book): number {
  const legs = journey(book);
  const places = legs.map((leg) => {
    const entry = book.queue.find((person) => person.id === leg.toFriend);
    if (!entry) {
      return null;
    }

    return `${entry.city.trim().toLowerCase()}|${entry.state.trim().toLowerCase()}`;
  });

  return new Set(places.filter(Boolean)).size;
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
    return 'Not circulating yet';
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
