import { Platform } from 'react-native';

export const theme = {
  colors: {
    background: '#f7f1ea',
    card: '#fffdfb',
    text: '#1f1a17',
    muted: '#54473f',
    faint: '#8a7d76',
    accent: '#7a5c48',
    border: '#eaded3',
    soft: '#f0e5dc',
    masthead: '#e8d9cb',
    avatar: '#e4d2c3',
    onAccent: '#fffdfb',
    // Only for "this book is in your hands", so it stands out from the browns.
    stamp: '#a6463a',
    stampSoft: '#f6e1dc',
    /**
     * Ink on cover swatches. The covers are light pastels, where white text
     * measured 2–3:1; near-black clears 5:1 on every swatch in covers.ts.
     */
    coverInk: '#1f1a17',
  },
  fonts: {
    // Built-in faces, so no font files ship.
    serif: Platform.select({
      ios: 'Georgia',
      android: 'serif',
      default: 'Georgia, "Times New Roman", serif',
    }),
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
