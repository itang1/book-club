import * as React from 'react';

import type { Wish } from '../types';
import { supabase } from './supabase';
import { byDemand } from './wishOrder';

type WishRow = {
  id: string;
  group_id: string;
  title: string;
  author: string;
  suggested_by: string | null;
  wish_votes: { person_id: string }[] | null;
};

const toWish = (row: WishRow): Wish => ({
  id: row.id,
  groupId: row.group_id,
  title: row.title,
  author: row.author,
  suggestedBy: row.suggested_by,
  voters: (row.wish_votes ?? []).map((vote) => vote.person_id),
});

const newId = () => `wish-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`;

/**
 * One group's wishlist. Loaded when the group page opens and after each
 * change, so it stays out of the main club refresh. In the demo it lives in
 * memory.
 */
export function useWishlist(groupId: string, me: string | null) {
  const [wishes, setWishes] = React.useState<Wish[]>([]);
  const [error, setError] = React.useState<string | null>(null);

  const load = React.useCallback(async () => {
    if (!supabase) {
      return;
    }
    const { data, error: failure } = await supabase
      .from('wishes')
      .select('id, group_id, title, author, suggested_by, wish_votes(person_id)')
      .eq('group_id', groupId)
      .order('created_at');
    if (failure) {
      setError(failure.message);
      return;
    }
    setError(null);
    setWishes(((data ?? []) as WishRow[]).map(toWish));
  }, [groupId]);

  React.useEffect(() => {
    // Fetch on open; state is set once the answer arrives.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
  }, [load]);

  /** Apply a change on screen, save it, then reload what the database kept. */
  const change = async (
    update: (current: Wish[]) => Wish[],
    save: () => PromiseLike<{ error: { message: string } | null }>,
  ) => {
    setWishes(update);
    if (!supabase) {
      return;
    }
    const { error: failure } = await save();
    setError(failure ? failure.message : null);
    await load();
  };

  const add = (title: string, author: string) => {
    if (!me || !title.trim()) {
      return;
    }
    const wish: Wish = {
      id: newId(),
      groupId,
      title: title.trim(),
      author: author.trim(),
      suggestedBy: me,
      voters: [me],
    };
    return change(
      (current) => [...current, wish],
      async () => {
        const db = supabase!;
        const inserted = await db.from('wishes').insert({
          id: wish.id,
          group_id: groupId,
          suggested_by: me,
          title: wish.title,
          author: wish.author,
        });
        if (inserted.error) {
          return inserted;
        }
        return db.from('wish_votes').insert({ wish_id: wish.id, person_id: me });
      },
    );
  };

  const toggleVote = (wishId: string) => {
    if (!me) {
      return;
    }
    const voted = wishes.find((wish) => wish.id === wishId)?.voters.includes(me) ?? false;
    return change(
      (current) =>
        current.map((wish) =>
          wish.id !== wishId
            ? wish
            : {
                ...wish,
                voters: voted ? wish.voters.filter((id) => id !== me) : [...wish.voters, me],
              },
        ),
      () =>
        voted
          ? supabase!.from('wish_votes').delete().match({ wish_id: wishId, person_id: me })
          : supabase!.from('wish_votes').insert({ wish_id: wishId, person_id: me }),
    );
  };

  const remove = (wishId: string) =>
    change(
      (current) => current.filter((wish) => wish.id !== wishId),
      () => supabase!.from('wishes').delete().eq('id', wishId),
    );

  return { wishes: byDemand(wishes), error, add, toggleVote, remove };
}
