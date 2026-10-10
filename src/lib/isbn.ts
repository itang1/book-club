export type BookLookupResult = {
  title: string;
  author: string;
  coverUrl?: string;
};

/**
 * Fetch book details by ISBN from Open Library.
 * Returns the title, author, and cover URL, or null if the book isn't catalogued.
 */
export async function lookupIsbn(rawIsbn: string): Promise<BookLookupResult | null> {
  const isbn = rawIsbn.replace(/[^0-9X]/gi, '').trim();
  if (isbn.length !== 10 && isbn.length !== 13) {
    return null;
  }

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
