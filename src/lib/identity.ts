import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Who is using the app on this device. There is no sign-in yet, so this stands
 * in for it: a friend id remembered locally. AsyncStorage maps to localStorage
 * on web. Failures are swallowed, since forgetting the choice only means
 * picking again.
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

const LETTER_KEY = 'book-club:letter-opened';

/** Whether this device has opened Irene's letter, so Books can stop offering it. */
export async function loadLetterOpened(): Promise<boolean> {
  try {
    return (await AsyncStorage.getItem(LETTER_KEY)) === 'yes';
  } catch {
    return false;
  }
}

export async function saveLetterOpened(): Promise<void> {
  try {
    await AsyncStorage.setItem(LETTER_KEY, 'yes');
  } catch {
    // Seeing it again is harmless.
  }
}
