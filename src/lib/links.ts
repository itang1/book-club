import { Platform } from 'react-native';
import { getPathFromState, getStateFromPath } from '@react-navigation/native';
import type { LinkingOptions } from '@react-navigation/native';

import type { RootTabParamList } from '../types';

/**
 * Addresses for the web app: every book has its own (/b/<id>), so a link in
 * an email, a shared message, or (later) an NFC sticker opens that book.
 *
 * The site lives under a subpath on GitHub Pages (/book-club). Expo inlines
 * that as EXPO_BASE_URL at build time; it's stripped before a path is read
 * and put back when the address bar is updated. Unknown paths still load
 * the app because the deploy copies index.html to 404.html.
 */
const BASE_PATH = (process.env.EXPO_BASE_URL ?? '').replace(/\/+$/, '');

const stripBase = (path: string) =>
  BASE_PATH && path.startsWith(BASE_PATH) ? path.slice(BASE_PATH.length) || '/' : path;

export const linking: LinkingOptions<RootTabParamList> = {
  prefixes: [],
  config: {
    screens: {
      Home: {
        // A book opened from a link still has the Books list under it, so
        // Back goes somewhere.
        initialRouteName: 'Home',
        screens: {
          Home: '',
          BookDetail: 'b/:bookId',
          AddBook: 'lend',
        },
      },
      Friends: {
        initialRouteName: 'FriendsHome',
        screens: {
          FriendsHome: 'friends',
          Group: 'groups/:groupId',
        },
      },
      Profile: 'you',
    },
  },
  getStateFromPath: (path, options) => getStateFromPath(stripBase(path), options),
  getPathFromState: (state, options) => `${BASE_PATH}${getPathFromState(state, options)}`,
};

const APP_URL = (process.env.EXPO_PUBLIC_APP_URL?.trim() || 'https://itang1.github.io/book-club').replace(
  /\/+$/,
  '',
);

/**
 * A book's own address. On web it uses the site you're on (so it works on
 * localhost too); elsewhere, the published site.
 */
export function bookLink(bookId: string): string {
  const root =
    Platform.OS === 'web' && typeof window !== 'undefined'
      ? `${window.location.origin}${BASE_PATH}`
      : APP_URL;
  return `${root}/b/${encodeURIComponent(bookId)}`;
}
