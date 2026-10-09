import type { ImageSourcePropType } from 'react-native';

/**
 * Words for the About page. Kept here, apart from layout, so they're easy to
 * edit without touching any components.
 */

/**
 * Middle-school me, reading in a tree. Cropped to the polaroid's 200:230
 * shape with metadata stripped; the full-size original is kept beside it as
 * me-original.jpg and gitignored. Set to null to show the Ex Libris
 * bookplate instead.
 */
export const photo: ImageSourcePropType | null = require('../../assets/about/me.jpg');

export const photoCaption = 'Me, middle school, mid-chapter.';

export const photoCredit = 'Photo: Dad';

export const authorName = 'Irene';

export const bio = [
  'I read The Sisterhood of the Traveling Pants series in middle school and wanted, very badly, to experience life and letters and summers like the girls in the book world.',
  'I never found the pants, but I did find the friends who pass books around (a tradition spawned out of an annual social distancing secret santa tradition).',
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
