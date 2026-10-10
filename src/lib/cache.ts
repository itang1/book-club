import AsyncStorage from '@react-native-async-storage/async-storage';
import type { BookClubData } from './bookClubService';

const CACHE_KEY = 'book-club:cached-data-v1';

/**
 * Persist the latest club data for instant startup and offline reading.
 * Swallowed on failure so storage issues never disrupt the reader.
 */
export async function saveCachedClubData(data: BookClubData): Promise<void> {
  // Only cache if there is meaningful data and no top-level load error.
  if (data.error || (data.books.length === 0 && data.friends.length === 0)) {
    return;
  }

  try {
    await AsyncStorage.setItem(CACHE_KEY, JSON.stringify(data));
  } catch {
    // Non-critical storage failure.
  }
}

export async function loadCachedClubData(): Promise<BookClubData | null> {
  try {
    const raw = await AsyncStorage.getItem(CACHE_KEY);
    if (!raw) {
      return null;
    }
    return JSON.parse(raw) as BookClubData;
  } catch {
    return null;
  }
}

