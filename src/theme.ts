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
const light = {
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
  /** The taped note's paper. */
  paper: '#fdf8ec',
};

type Palette = typeof light;

/**
 * The same house after dark: warm ink-brown stock, light text, and the green
 * lifted so it reads as text and still carries dark lettering as a button.
 * Every text colour clears 4.5:1 on background, card and soft.
 */
const dark: Palette = {
  background: '#161411',
  card: '#211e19',
  text: '#ece5d6',
  muted: '#b3aa9a',
  faint: '#9d9483',
  accent: '#9cc7a8',
  border: '#3a342b',
  soft: '#2c2822',
  masthead: '#211e19',
  letterhead: '#1f3b2c',
  onMasthead: '#f1ead9',
  avatar: '#3a342b',
  onAccent: '#14130f',
  brass: '#c9a86e',
  stamp: '#e3909b',
  stampSoft: '#3b2226',
  coverInk: '#1c1b17',
  rule: '#3f392f',
  paper: '#2a261f',
};

export const palettes = { light, dark };

/**
 * On the web, every colour is a CSS variable, so the page follows the
 * device's light or dark setting without re-rendering anything. Native
 * builds stay light. Anything drawn outside the page (a canvas, an image)
 * takes real colours from `palettes`.
 */
const isWeb = Platform.OS === 'web';
const cssVar = (key: string) => `--tb-${key.replace(/[A-Z]/g, (c) => `-${c.toLowerCase()}`)}`;
const declarations = (palette: Palette) =>
  Object.entries(palette)
    .map(([key, value]) => `${cssVar(key)}:${value};`)
    .join('');

if (isWeb && typeof document !== 'undefined' && !document.getElementById('tb-colors')) {
  const style = document.createElement('style');
  style.id = 'tb-colors';
  style.textContent =
    `:root{color-scheme:light dark;${declarations(light)}}` +
    `@media (prefers-color-scheme: dark){:root{${declarations(dark)}}}`;
  document.head.appendChild(style);
}

const colors = isWeb
  ? (Object.fromEntries(Object.keys(light).map((key) => [key, `var(${cssVar(key)})`])) as Palette)
  : light;

export const theme = {
  colors,
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
