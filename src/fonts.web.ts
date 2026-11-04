// Web only: the bundled typeface (Libre Caslon), registered with their real weights so
// fontWeight: '700' picks the bold cut instead of a smeared fake bold.
// Loaded through the bundler so the URLs carry the site's base path.
import { Asset } from 'expo-asset';

/* eslint-disable @typescript-eslint/no-require-imports -- Metro bundles font files through require(). */

const FACES: [family: string, weight: number, style: string, module: number][] = [
  [
    'Libre Caslon Text',
    400,
    'normal',
    require('../assets/fonts/libre-caslon-text-latin-400-normal.woff2'),
  ],
  [
    'Libre Caslon Text',
    400,
    'italic',
    require('../assets/fonts/libre-caslon-text-latin-400-italic.woff2'),
  ],
  [
    'Libre Caslon Text',
    700,
    'normal',
    require('../assets/fonts/libre-caslon-text-latin-700-normal.woff2'),
  ],
];

export function registerFonts() {
  if (typeof document === 'undefined' || document.getElementById('book-fonts')) return;
  const style = document.createElement('style');
  style.id = 'book-fonts';
  style.textContent = FACES.map(
    ([family, weight, fontStyle, module]) =>
      `@font-face{font-family:"${family}";font-weight:${weight};font-style:${fontStyle};` +
      `font-display:swap;src:url("${Asset.fromModule(module).uri}") format("woff2");}`,
  ).join('\n');
  document.head.appendChild(style);
}
