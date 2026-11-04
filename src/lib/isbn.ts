export type BookLookupResult = {
  title: string;
  author: string;
  coverUrl?: string;
};

async function lookupOpenLibrary(isbn: string): Promise<BookLookupResult | null> {
  try {
    const bibkey = `ISBN:${isbn}`;
    const url = `https://openlibrary.org/api/books?bibkeys=${bibkey}&jscmd=data&format=json`;
    const res = await fetch(url);
    if (!res.ok) {
      return null;
    }

    const data = (await res.json()) as Record<
      string,
      {
        title?: string;
        authors?: { name: string }[];
        cover?: { medium?: string; large?: string };
      }
    >;

    const entry = data[bibkey];
    if (!entry || !entry.title) {
      return null;
    }

    const title = entry.title.trim();
    const author = entry.authors?.[0]?.name?.trim() ?? '';
    const coverUrl = entry.cover?.medium ?? entry.cover?.large;

    return {
      title,
      author,
      coverUrl: coverUrl?.startsWith('http') ? coverUrl : undefined,
    };
  } catch {
    return null;
  }
}

async function lookupGoogleBooks(isbn: string): Promise<BookLookupResult | null> {
  try {
    const url = `https://www.googleapis.com/books/v1/volumes?q=isbn:${isbn}`;
    const res = await fetch(url);
    if (!res.ok) {
      return null;
    }

    const data = (await res.json()) as {
      totalItems?: number;
      items?: Array<{
        volumeInfo?: {
          title?: string;
          authors?: string[];
          imageLinks?: {
            thumbnail?: string;
            smallThumbnail?: string;
          };
        };
      }>;
    };

    const volume = data.items?.[0]?.volumeInfo;
    if (!volume || !volume.title) {
      return null;
    }

    const rawCover = volume.imageLinks?.thumbnail ?? volume.imageLinks?.smallThumbnail;
    const coverUrl = rawCover?.replace(/^http:\/\//i, 'https://');

    return {
      title: volume.title.trim(),
      author: volume.authors?.[0]?.trim() ?? '',
      coverUrl: coverUrl?.startsWith('https://') ? coverUrl : undefined,
    };
  } catch {
    return null;
  }
}

/**
 * Fetch book details by ISBN from Open Library, falling back to Google Books.
 */
export async function lookupIsbn(rawIsbn: string): Promise<BookLookupResult | null> {
  const isbn = rawIsbn.replace(/[^0-9X]/gi, '').trim();
  if (isbn.length !== 10 && isbn.length !== 13) {
    return null;
  }

  const openLibraryResult = await lookupOpenLibrary(isbn);
  if (openLibraryResult?.coverUrl) {
    return openLibraryResult;
  }

  const googleResult = await lookupGoogleBooks(isbn);
  if (openLibraryResult) {
    return {
      ...openLibraryResult,
      coverUrl: googleResult?.coverUrl ?? openLibraryResult.coverUrl,
    };
  }

  return googleResult;
}
