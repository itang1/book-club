import { Platform } from 'react-native';

export const theme = {
  colors: {
    background: '#f7f1ea',
    card: '#fffdfb',
    text: '#1f1a17',
    muted: '#54473f',
    // Inactive tab icons and other quiet chrome.
    faint: '#8a7d76',
    accent: '#7a5c48',
    border: '#eaded3',
    soft: '#f0e5dc',
    avatar: '#e4d2c3',
    // Text and icons sitting on accent or stamp.
    onAccent: '#fffdfb',
    /**
     * Library-stamp red, kept for one job: "it's your turn". The browns are
     * all one family, so nothing in the palette could stand out; this can,
     * because it appears nowhere else.
     */
    stamp: '#a6463a',
    stampSoft: '#f6e1dc',
    /**
     * Ink on cover swatches. The covers are light pastels, where white text
     * measured 2–3:1; near-black clears 5:1 on every swatch in covers.ts.
     */
    coverInk: '#1f1a17',
  },
  fonts: {
    /**
     * Titles are set in a serif, which does more for the bookshop feel than
     * any colour. These are built-in faces, so no font files ship.
     */
    serif: Platform.select({
      ios: 'Georgia',
      android: 'serif',
      default: 'Georgia, "Times New Roman", serif',
    }),
    /**
     * Handwriting, for the taped-in Rules of the Pants. Faces that ship with
     * the system (Noteworthy on Apple devices), falling back to the
     * browser's cursive.
     */
    hand: Platform.select({
      ios: 'Noteworthy',
      android: 'casual',
      default: 'Noteworthy, "Bradley Hand", "Segoe Print", "Comic Sans MS", cursive',
    }),
  },
  spacing: {
    xs: 8,
    sm: 12,
    md: 16,
    lg: 20,
  },
};
