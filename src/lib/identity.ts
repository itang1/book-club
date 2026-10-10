import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Demo mode: who is using the app on this device, remembered locally.
 * Failures are swallowed, since forgetting the choice only means picking again.
 */

const KEY = 'book-club:reader-id';

export async function loadReaderId(): Promise<string | null> {
  try {
    return await AsyncStorage.getItem(KEY);
  } catch {
    return null;
  }
}

export async function saveReaderId(friendId: string): Promise<void> {
  try {
    await AsyncStorage.setItem(KEY, friendId);
  } catch {
    // Not worth interrupting anyone over.
  }
}

/** Forget who's reading here, so the next launch shows the welcome screen. */
export async function clearReaderId(): Promise<void> {
  try {
    await AsyncStorage.removeItem(KEY);
  } catch {
    // As above.
  }
}
