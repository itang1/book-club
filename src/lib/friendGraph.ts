import type { Book, Friend, Friendship } from '../types';

/**
 * Everyone in `friends` is a member of the club; friendships are the graph
 * between them. These helpers answer "who are my friends" and "who might I
 * know", and nothing else.
 */

export function friendIdsOf(friendships: Friendship[], personId: string | null): Set<string> {
  const ids = new Set<string>();
  if (!personId) {
    return ids;
  }

  for (const [a, b] of friendships) {
    if (a === personId) ids.add(b);
    if (b === personId) ids.add(a);
  }

  return ids;
}

export type Suggestion = {
  person: Friend;
  reason: string;
};

/**
 * Members you aren't friends with yet, best guesses first. Two signals, both
 * easy to explain in the row itself: friends you have in common, and books
 * you've both been in line for. Anyone with neither is still listed, last,
 * since the club is small and they're "new here" rather than strangers.
 */
export function suggestionsFor(
  meId: string | null,
  members: Friend[],
  friendships: Friendship[],
  books: Book[],
  limit = 5,
): Suggestion[] {
  if (!meId) {
    return [];
  }

  const mine = friendIdsOf(friendships, meId);
  const myBooks = books.filter((book) => book.queue.some((entry) => entry.id === meId));

  return members
    .filter((person) => person.id !== meId && !mine.has(person.id))
    .map((person) => {
      const theirs = friendIdsOf(friendships, person.id);
      const mutual = [...theirs].filter((id) => mine.has(id)).length;
      const shared = myBooks.filter((book) =>
        book.queue.some((entry) => entry.id === person.id),
      );

      let reason = 'New to the club';
      if (mutual > 0) {
        reason = `${mutual} mutual ${mutual === 1 ? 'friend' : 'friends'}`;
      } else if (shared.length > 0) {
        reason = `Also in line for ${shared[0].title}`;
      }

      return { person, reason, score: mutual * 2 + shared.length };
    })
    .sort((a, b) => b.score - a.score || a.person.name.localeCompare(b.person.name))
    .slice(0, limit)
    .map(({ person, reason }) => ({ person, reason }));
}
