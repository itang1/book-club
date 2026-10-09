import { describe, expect, it } from 'vitest';

import type { Friend, Friendship, Group } from '../types';
import {
  friendIdsOf,
  groupmateIdsOf,
  incomingRequests,
  outgoingRequests,
  suggestionsFor,
} from './friendGraph';

const person = (id: string): Friend => ({ id, name: id, city: 'X', state: 'Y' });
const members = ['ana', 'bea', 'cat', 'dee', 'eve'].map(person);
const friendships: Friendship[] = [
  { a: 'ana', b: 'bea', status: 'accepted', requestedBy: 'ana' },
  { a: 'bea', b: 'cat', status: 'accepted', requestedBy: 'bea' },
  { a: 'ana', b: 'dee', status: 'pending', requestedBy: 'dee' },
];
const groups: Group[] = [
  { id: 'g1', name: 'Club', inviteCode: 'c', memberIds: ['ana', 'bea', 'cat', 'dee'] },
  { id: 'g2', name: 'Other', inviteCode: 'o', memberIds: ['eve'] },
];

describe('friends and requests', () => {
  it('counts only accepted friendships as friends', () => {
    expect([...friendIdsOf(friendships, 'ana')]).toEqual(['bea']);
  });

  it('splits requests into theirs and yours', () => {
    expect(incomingRequests(friendships, 'ana')).toEqual(['dee']);
    expect([...outgoingRequests(friendships, 'dee')]).toEqual(['ana']);
    expect(incomingRequests(friendships, 'dee')).toEqual([]);
  });
});

describe('people you may know', () => {
  it('suggests groupmates only, not friends, not anyone already asked', () => {
    expect(groupmateIdsOf(groups, 'ana')).toEqual(new Set(['bea', 'cat', 'dee']));
    const suggested = suggestionsFor('ana', members, friendships, [], groups);
    // Bea is a friend, Dee has a pending request, Eve shares no group.
    expect(suggested.map((s) => s.person.id)).toEqual(['cat']);
    expect(suggested[0].reason).toBe('1 mutual friend');
  });
});
