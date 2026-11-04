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
      'ISBN:9780316556347': {
        title: 'Circe',
        authors: [{ name: 'Madeline Miller' }],
        cover: { medium: 'https://covers.openlibrary.org/b/id/123-M.jpg' },
      },
    };

    global.fetch = vi.fn().mockImplementation((url: string) => {
      if (url.includes('openlibrary.org')) {
        return Promise.resolve({
          ok: true,
          json: async () => fakeData,
        });
      }
      return Promise.resolve({ ok: false });
    }) as unknown as typeof fetch;

    const result = await lookupIsbn('978-0-316-55634-7');
    expect(result).toEqual({
      title: 'Circe',
      author: 'Madeline Miller',
      coverUrl: 'https://covers.openlibrary.org/b/id/123-M.jpg',
    });
  });

  it('falls back to Google Books when Open Library has no match', async () => {
    const googleData = {
      totalItems: 1,
      items: [
        {
          volumeInfo: {
            title: 'The Great Gatsby',
            authors: ['F. Scott Fitzgerald'],
            imageLinks: {
              thumbnail: 'http://books.google.com/books/content?id=xyz&zoom=1',
            },
          },
        },
      ],
    };

    global.fetch = vi.fn().mockImplementation((url: string) => {
      if (url.includes('openlibrary.org')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({}),
        });
      }
      if (url.includes('googleapis.com')) {
        return Promise.resolve({
          ok: true,
          json: async () => googleData,
        });
      }
      return Promise.resolve({ ok: false });
    }) as unknown as typeof fetch;

    const result = await lookupIsbn('9780743273565');
    expect(result).toEqual({
      title: 'The Great Gatsby',
      author: 'F. Scott Fitzgerald',
      coverUrl: 'https://books.google.com/books/content?id=xyz&zoom=1',
    });
  });

  it('supplements missing Open Library cover with Google Books cover', async () => {
    const openLibraryData = {
      'ISBN:9780743273565': {
        title: 'The Great Gatsby',
        authors: [{ name: 'F. Scott Fitzgerald' }],
      },
    };
    const googleData = {
      items: [
        {
          volumeInfo: {
            title: 'The Great Gatsby',
            authors: ['F. Scott Fitzgerald'],
            imageLinks: {
              thumbnail: 'https://books.google.com/cover.jpg',
            },
          },
        },
      ],
    };

    global.fetch = vi.fn().mockImplementation((url: string) => {
      if (url.includes('openlibrary.org')) {
        return Promise.resolve({
          ok: true,
          json: async () => openLibraryData,
        });
      }
      if (url.includes('googleapis.com')) {
        return Promise.resolve({
          ok: true,
          json: async () => googleData,
        });
      }
      return Promise.resolve({ ok: false });
    }) as unknown as typeof fetch;

    const result = await lookupIsbn('9780743273565');
    expect(result).toEqual({
      title: 'The Great Gatsby',
      author: 'F. Scott Fitzgerald',
      coverUrl: 'https://books.google.com/cover.jpg',
    });
  });

  it('returns null when both services fail', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
    }) as unknown as typeof fetch;

    const result = await lookupIsbn('9780316556347');
    expect(result).toBeNull();
  });
});
