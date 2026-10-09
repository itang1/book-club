import type { ImageSourcePropType } from 'react-native';

/**
 * Words for the About page. Kept here, apart from layout, so they're easy to
 * edit without touching any components.
 */

/**
 * Your middle-school photo. Drop the image at assets/about/me.jpg and swap
 * `null` for the require below. Until then the page shows a placeholder
 * bookplate instead of a broken image.
 *
 *   photo: require('../../assets/about/me.jpg'),
 */
export const photo: ImageSourcePropType | null = null;

export const photoCaption = 'Me, middle school, mid-chapter.';

export const authorName = 'Irene';

/** A draft. Rewrite it in your own voice. */
export const bio = [
  "I read The Sisterhood of the Traveling Pants in middle school and wanted, very badly, a pair of pants that fit all my friends.",
  "I never found the pants. I did find friends who pass books around, so I built the next best thing: one copy, many readers, and a record of everywhere it's been.",
];

/**
 * In the spirit of the Pants, which came with rules of their own. These are
 * ours, written fresh rather than borrowed.
 */
export const rules = [
  'Write a letter before you pass it on. Tell the next reader something true.',
  "Never spoil the ending in your letter. That's what sealing them is for.",
  'No dog-ears. Use a receipt, a ticket stub, a pressed flower.',
  'Pencil in the margins is a gift. Pen is between you and the owner.',
  "Don't keep it longer than you need. Someone is waiting.",
  'Coffee rings and sand are part of the journey, not damage.',
  'However far it goes, it always comes home in the end.',
];

export const homage =
  'A fan homage to The Sisterhood of the Traveling Pants by Ann Brashares. Not affiliated with the author or publisher.';
