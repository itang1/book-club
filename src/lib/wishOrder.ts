import type { Wish } from '../types';

/** Most wanted first; ties go to the oldest wish, which keeps its place. */
export function byDemand(wishes: Wish[]): Wish[] {
  return wishes
    .map((wish, index) => ({ wish, index }))
    .sort((a, b) => b.wish.voters.length - a.wish.voters.length || a.index - b.index)
    .map(({ wish }) => wish);
}
