import { Platform } from 'react-native';

// Printed matter: titles, headings, numbers, labels. Libre Caslon on the web
// (assets/fonts, registered in src/fonts.web.ts).
const serif = Platform.select({
  ios: 'Georgia',
  android: 'serif',
  default: '"Libre Caslon Text", Georgia, "Times New Roman", serif',
});

/**
 * Old-school collegiate: ivory stock, hunter green, oxblood and a little
 * brass, set in Caslon like a university press.
 */
export const theme = {
  colors: {
    background: '#f6f1e6',
    card: '#fffdf7',
    text: '#1c1b17',
    muted: '#575046',
    faint: '#6b6357',
    /** Hunter green: buttons, links, the letterhead. */
    accent: '#1f3b2c',
    border: '#e4dac7',
    soft: '#eee6d6',
    /** Light parchment behind screen titles. */
    masthead: '#ece4d3',
    /** The green letterhead across the top of Home, and what's printed on it. */
    letterhead: '#1f3b2c',
    onMasthead: '#f6f1e6',
    avatar: '#e6dcc8',
    onAccent: '#fffdf7',
    /** Brass: fine rules and the motto on green. */
    brass: '#b4925a',
    // Oxblood, only for "this book is in your hands", so it stands out.
    stamp: '#7d2532',
    stampSoft: '#f4e4e2',
    /**
     * Ink on cover swatches. The covers are light pastels, where white text
     * measured 2–3:1; near-black clears 5:1 on every swatch in covers.ts.
     */
    coverInk: '#1c1b17',
    /** Printed rules: dividers, ledger lines, the frame on a cover. */
    rule: '#d6c9b1',
  },
  /** Corners stay nearly square, like paper and board. */
  radius: {
    sm: 2,
    md: 4,
  },
  fonts: {
    serif,
    hand: Platform.select({
      ios: 'Noteworthy',
      android: 'casual',
      default: 'Noteworthy, "Bradley Hand", "Segoe Print", "Comic Sans MS", cursive',
    }),
  },
  /** Engraved-stationery labels: small, spaced capitals. */
  caps: {
    fontFamily: serif,
    textTransform: 'uppercase',
    letterSpacing: 1.6,
  } as const,
  spacing: {
    xs: 8,
    sm: 12,
    md: 16,
    lg: 20,
  },
};
