import { describe, expect, it } from 'vitest';

import type { Wish } from '../types';
import { byDemand } from './wishOrder';

const wish = (id: string, voters: string[]): Wish => ({
  id,
  groupId: 'g',
  title: id,
  author: '',
  suggestedBy: voters[0] ?? null,
  voters,
});

describe('byDemand', () => {
  it('puts the most wanted first and keeps ties in the order they were wished', () => {
    const order = byDemand([wish('a', ['x']), wish('b', ['x', 'y']), wish('c', ['y'])]).map(
      (w) => w.id,
    );
    expect(order).toEqual(['b', 'a', 'c']);
  });
});
