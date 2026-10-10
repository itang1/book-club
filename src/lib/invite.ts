import { Platform } from 'react-native';

/**
 * Invite links: one per group, carrying the group's invite code. Opening one
 * and signing in is joining; someone already in the group who hasn't signed
 * in yet finds themselves there ("That's me"). Only the web build reads the
 * link back for now; native would need a deep link.
 */

const APP_URL = process.env.EXPO_PUBLIC_APP_URL?.trim() || 'https://itang1.github.io/book-club';

export function inviteLink(inviteCode: string): string {
  // With the trailing slash: GitHub Pages redirects /book-club to
  // /book-club/, and the invite shouldn't depend on a redirect keeping it.
  return `${APP_URL.replace(/\/+$/, '')}/?join=${encodeURIComponent(inviteCode)}`;
}

export function inviteCodeFromUrl(): string | null {
  if (Platform.OS !== 'web' || typeof window === 'undefined') {
    return null;
  }

  return new URLSearchParams(window.location.search).get('join');
}

/** Once the invite has been answered, take it out of the address bar. */
export function clearInviteFromUrl(): void {
  if (Platform.OS !== 'web' || typeof window === 'undefined') {
    return;
  }

  const url = new URL(window.location.href);
  url.searchParams.delete('join');
  window.history.replaceState(null, '', url.toString());
}
