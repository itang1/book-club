/**
 * Placeholder cover colours, derived from title and author so a book looks the
 * same everywhere. Stored on the book, so a chosen colour can override it.
 */

export const coverPalette = [
  '#d9a77d', // tan
  '#c89366', // terracotta
  '#b98a7a', // clay
  '#c7a6b5', // dusty rose
  '#b4b8a9', // sage
  '#93a7a5', // eucalyptus
  '#a8927d', // taupe
  '#8f9bb0', // dusty blue
];

/**
 * FNV-1a plus a final avalanche.
 *
 * The avalanche matters: FNV's low bits are weakly mixed, and taking the hash
 * modulo a small palette reads only those bits. Without this step eight sample
 * titles landed on just four colours. The fmix32 tail from MurmurHash3 spreads
 * entropy down into the low bits.
 */
function hash(input: string): number {
  let h = 0x811c9dc5;

  for (let i = 0; i < input.length; i += 1) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }

  h ^= h >>> 16;
  h = Math.imul(h, 0x85ebca6b);
  h ^= h >>> 13;
  h = Math.imul(h, 0xc2b2ae35);
  h ^= h >>> 16;

  return h >>> 0;
}

export function coverColorFor(title: string, author: string): string {
  const key = `${title.trim().toLowerCase()}|${author.trim().toLowerCase()}`;
  return coverPalette[hash(key) % coverPalette.length];
}
