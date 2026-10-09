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

/** The same photo cropped tight on the face, for small round avatars. */
export const face: ImageSourcePropType | null = require('../../assets/about/me-face.jpg');

export const photoCaption = 'Me, middle school.';

export const photoCredit = 'Photo creds: Dad';

export const authorName = 'Irene';

/** What the note is called wherever it's offered. "Maker", not "author": this is an app, not a book. */
export const noteTitle = 'Message from the Maker';

/**
 * A run of bio text: plain, or italic (a title), optionally a link.
 * Paragraphs are lists of runs so a title can sit mid-sentence.
 */
export type BioRun = string | { text: string; italic?: boolean; href?: string };

const SERIES_URL = 'https://en.wikipedia.org/wiki/The_Sisterhood_of_the_Traveling_Pants';

export const bio: BioRun[][] = [
  [
    'I read ',
    { text: 'The Sisterhood of the Traveling Pants', italic: true, href: SERIES_URL },
    ' series by Ann Brashares in middle school. It\'s about four best friends who spend their first summer apart and mail a pair of thrift store jeans (which somehow fits every one of them) back and forth with letters about everything that happens.',
  ],
  [
    'My twelve-year-old self wanted so badly to have the life those fictional girls had, with grand summer adventures and friends who stayed close across an ocean. I never found that life, or jeans that fit as well as that, but I did find the friends to pass books around by USPS Media Mail (a ritual that spawned out of an annual long-distance Secret Santa tradition).',
  ],
];

/**
 * In the spirit of the Pants, which came with rules of their own. These are
 * ours: plain house rules, written fresh rather than borrowed.
 */
export const rules = [
  'Write a letter or note before you pass it on.',
  'No spoilers in the letter.',
  'Handle the book with care.',
  'Write in the margins! Your thoughts are meant to be shared.',
  'Use USPS Media Mail for the best shipping prices.',
  "When everyone's had a turn, it goes home to whoever owns it. Or it lives on in circulation.",
];

export const homage =
  'A fan homage to The Sisterhood of the Traveling Pants by Ann Brashares. Not affiliated with the author or publisher.';
