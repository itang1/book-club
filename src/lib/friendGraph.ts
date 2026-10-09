import type { Book, Friend, Friendship, Group } from '../types';

/**
 * Friends are social: who you know, and whose reading you follow. Groups
 * decide who can borrow what. These helpers answer "who are my friends",
 * "who's asked", and "who might I know", and nothing else.
 */

const other = (friendship: Friendship, personId: string) =>
  friendship.a === personId ? friendship.b : friendship.a;

const involves = (friendship: Friendship, personId: string | null) =>
  personId !== null && (friendship.a === personId || friendship.b === personId);

/** Accepted friends only. A request isn't a friendship yet. */
export function friendIdsOf(friendships: Friendship[], personId: string | null): Set<string> {
  return new Set(
    friendships
      .filter((friendship) => friendship.status === 'accepted' && involves(friendship, personId))
      .map((friendship) => other(friendship, personId as string)),
  );
}

/** People who've asked you, waiting for your answer. */
export function incomingRequests(friendships: Friendship[], personId: string | null): string[] {
  return friendships
    .filter(
      (friendship) =>
        friendship.status === 'pending' &&
        involves(friendship, personId) &&
        friendship.requestedBy !== personId,
    )
    .map((friendship) => friendship.requestedBy);
}

/** People you've asked, waiting for theirs. */
export function outgoingRequests(friendships: Friendship[], personId: string | null): Set<string> {
  return new Set(
    friendships
      .filter(
        (friendship) =>
          friendship.status === 'pending' &&
          involves(friendship, personId) &&
          friendship.requestedBy === personId,
      )
      .map((friendship) => other(friendship, personId as string)),
  );
}

/** Everyone you share at least one real group with (the sample club doesn't count). */
export function groupmateIdsOf(groups: Group[], personId: string | null): Set<string> {
  const ids = new Set<string>();
  for (const group of groups) {
    if (personId && !group.isSample && group.memberIds.includes(personId)) {
      group.memberIds.forEach((id) => ids.add(id));
    }
  }
  if (personId) {
    ids.delete(personId);
  }
  return ids;
}

export type Suggestion = {
  person: Friend;
  reason: string;
};

/**
 * Groupmates you aren't friends with yet and haven't asked (either way),
 * best guesses first: friends in common, then books you've both been in
 * line for. Only groupmates, never friends of friends: suggesting someone
 * you share nothing with would reveal people they never shared anything
 * with you.
 */
export function suggestionsFor(
  meId: string | null,
  members: Friend[],
  friendships: Friendship[],
  books: Book[],
  groups: Group[],
  limit = 5,
): Suggestion[] {
  if (!meId) {
    return [];
  }

  const mine = friendIdsOf(friendships, meId);
  const asked = new Set([
    ...outgoingRequests(friendships, meId),
    ...incomingRequests(friendships, meId),
  ]);
  const groupmates = groupmateIdsOf(groups, meId);
  const myBooks = books.filter((book) => book.queue.some((entry) => entry.id === meId));
  const sharedGroup = (personId: string) =>
    groups.find(
      (group) =>
        !group.isSample && group.memberIds.includes(meId) && group.memberIds.includes(personId),
    );

  return members
    .filter((person) => groupmates.has(person.id) && !mine.has(person.id) && !asked.has(person.id))
    .map((person) => {
      const theirs = friendIdsOf(friendships, person.id);
      const mutual = [...theirs].filter((id) => mine.has(id)).length;
      const shared = myBooks.filter((book) =>
        book.queue.some((entry) => entry.id === person.id),
      );

      let reason = `In ${sharedGroup(person.id)?.name ?? 'your group'}`;
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
