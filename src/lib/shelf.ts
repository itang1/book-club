import * as React from 'react';

import type { ScannedBook, ShelfBook, ShelfRequest } from '../types';
import { coverColorFor } from './covers';
import { supabase } from './supabase';

type ShelfRow = {
  id: string;
  owner_id: string;
  title: string;
  author: string;
  cover_color: string;
  lent_book_id: string | null;
};
type RequestRow = { id: string; shelf_book_id: string; requester_id: string; status: ShelfRequest['status'] };

const toBook = (row: ShelfRow): ShelfBook => ({
  id: row.id,
  ownerId: row.owner_id,
  title: row.title,
  author: row.author,
  coverColor: row.cover_color,
  lentBookId: row.lent_book_id,
});

const toRequest = (row: RequestRow): ShelfRequest => ({
  id: row.id,
  shelfBookId: row.shelf_book_id,
  requesterId: row.requester_id,
  status: row.status,
});

const newId = (prefix: string) =>
  `${prefix}-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`;

/** Resolves to an error message, or null when it worked. */
type Outcome = Promise<string | null>;

/**
 * Everyone's shelves you can see (the database decides who that is) and the
 * requests you made or received. Loaded when a shelf screen opens, and again
 * after each change, so it stays out of the main club refresh.
 */
export function useShelf(enabled: boolean) {
  const [books, setBooks] = React.useState<ShelfBook[]>([]);
  const [requests, setRequests] = React.useState<ShelfRequest[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const reload = React.useCallback(async () => {
    if (!supabase || !enabled) return;
    setLoading(true);
    const [shelf, asks] = await Promise.all([
      supabase.from('shelf_books').select('*').order('created_at'),
      supabase.from('shelf_requests').select('*').order('created_at'),
    ]);
    setLoading(false);
    if (shelf.error || asks.error) {
      setError((shelf.error ?? asks.error)!.message);
      return;
    }
    setError(null);
    setBooks((shelf.data as ShelfRow[]).map(toBook));
    setRequests((asks.data as RequestRow[]).map(toRequest));
  }, [enabled]);

  React.useEffect(() => {
    reload();
  }, [reload]);

  /** Runs a change, then reloads so the screen shows what the database now says. */
  const change = async (run: () => PromiseLike<{ error: { message: string } | null }>): Outcome => {
    if (!supabase) return 'Shelves need an account.';
    const { error: failure } = await run();
    await reload();
    return failure ? failure.message : null;
  };

  const addBooks = (ownerId: string, found: ScannedBook[]): Outcome =>
    change(() =>
      supabase!.from('shelf_books').insert(
        found.map((book) => ({
          id: newId('shelf'),
          owner_id: ownerId,
          title: book.title.trim(),
          author: book.author.trim(),
          cover_color: coverColorFor(book.title, book.author),
        })),
      ),
    );

  const removeBook = (shelfBookId: string): Outcome =>
    change(() => supabase!.from('shelf_books').delete().eq('id', shelfBookId));

  const requestBook = (shelfBookId: string): Outcome =>
    change(() =>
      supabase!.rpc('request_shelf_book', { p_request_id: newId('ask'), p_shelf_book_id: shelfBookId }),
    );

  const answerRequest = (requestId: string, accept: boolean): Outcome =>
    change(() =>
      supabase!.rpc('answer_shelf_request', { p_request_id: requestId, p_accept: accept }),
    );

  const lendToGroup = (shelfBookId: string, groupId: string): Outcome =>
    change(() =>
      supabase!.rpc('lend_from_shelf', {
        p_shelf_book_id: shelfBookId,
        p_book_id: newId('book'),
        p_handoff_id: newId('handoff'),
        p_group_id: groupId,
      }),
    );

  return { books, requests, loading, error, reload, addBooks, removeBook, requestBook, answerRequest, lendToGroup };
}

export type ShelfState = ReturnType<typeof useShelf>;

/** Sends a photo (base64, no data: prefix) to the scanner and returns what it found. */
export async function scanShelfPhoto(
  base64: string,
  mimeType: string,
): Promise<{ books: ScannedBook[]; error: string | null }> {
  if (!supabase) return { books: [], error: 'Scanning needs an account.' };

  const { data, error } = await supabase.functions.invoke('scan-shelf', {
    body: { image: base64, mimeType },
  });
  if (error) {
    // The function's own message is in the response body, when there is one.
    let message = 'The scanner isn\'t available right now.';
    try {
      const body = await (error as { context?: Response }).context?.json();
      if (body?.error) message = body.error;
    } catch {
      /* keep the general message */
    }
    return { books: [], error: message };
  }

  return { books: (data?.books ?? []) as ScannedBook[], error: null };
}
