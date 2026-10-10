import { describe, expect, it, vi, beforeEach } from 'vitest';
import { lookupIsbn } from './isbn';

describe('lookupIsbn', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('rejects invalid ISBN lengths', async () => {
    expect(await lookupIsbn('123')).toBeNull();
    expect(await lookupIsbn('123456789012345')).toBeNull();
    expect(await lookupIsbn('')).toBeNull();
  });

  it('normalizes hyphens and spaces and parses valid Open Library response', async () => {
    const fakeData = {
      'ISBN:9780385729338': {
        title: 'The Sisterhood of the Traveling Pants',
        authors: [{ name: 'Ann Brashares' }],
        cover: { medium: 'https://covers.openlibrary.org/b/id/123-M.jpg' },
      },
    };

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => fakeData,
    }) as unknown as typeof fetch;

    const result = await lookupIsbn('978-0-385-72933-8');
    expect(result).toEqual({
      title: 'The Sisterhood of the Traveling Pants',
      author: 'Ann Brashares',
      coverUrl: 'https://covers.openlibrary.org/b/id/123-M.jpg',
    });
  });

  it('returns null on network failure or missing entry', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
    }) as unknown as typeof fetch;

    const result = await lookupIsbn('9780385729338');
    expect(result).toBeNull();
  });
});
