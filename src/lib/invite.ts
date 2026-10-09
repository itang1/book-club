import { Platform } from 'react-native';

/**
 * Invite links. Someone new opens the link, makes their own profile on the
 * welcome screen, and starts out friends with whoever invited them.
 *
 * The link carries only the inviter's member id, which is already visible to
 * anyone in the club. Only the web build reads it back for now; a native
 * deep link would need the URL scheme wired into navigation.
 */

const APP_URL = process.env.EXPO_PUBLIC_APP_URL?.trim() || 'https://itang1.github.io/book-club';

export function inviteLink(inviterId: string): string {
  return `${APP_URL}?invited_by=${encodeURIComponent(inviterId)}`;
}

export function invitedByFromUrl(): string | null {
  if (Platform.OS !== 'web' || typeof window === 'undefined') {
    return null;
  }

  return new URLSearchParams(window.location.search).get('invited_by');
}
