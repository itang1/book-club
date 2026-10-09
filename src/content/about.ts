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

/** The heading above the photo and bio. */
export const noteTitle = 'About';

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
    ' series by Ann Brashares in middle school. It\'s about four best friends who spend their first summer apart during their junior year of high school and mail a pair of thrift store jeans (which somehow fits every one of them) back and forth with letters about everything that happens.',
  ],
  [
    'My twelve-year-old self wanted so badly to have the life those fictional girls had, with the summer happenings and friends who stayed close across an ocean. I never found that life, or jeans that fit as well as that, but I did find the friends to pass books around by USPS Media Mail (a ritual that spawned out of an annual long-distance Secret Santa tradition). This webapp helps keep the books alive by logging where they have been.',
  ],
];

/**
 * Ours, in the spirit of the Pants' rules: the "You must" voice, specific
 * and a little silly, a time limit, and a last line about the friendship.
 * Written fresh, not borrowed.
 */
// In the same order as the Rules of the Pants below, each one answering
// its counterpart: looking after it, taste, self-talk, a line not to cross,
// the silly one, documenting, writing to each other, passing it on,
// logistics, and love.
export const rules = [
  'You must never dog-ear a page. Use a sticky note, a receipt, a boarding pass if you have to.',
  'You must never apologize for what you underlined.',
  'You must never say "I\'m not a reader" while it\'s in your hands.',
  'You must never spoil the ending.',
  'If you read it in the bath, you must confess in your letter.',
  'You must write a letter before you pass it on (a paragraph will suffice).',
  'You must write in the margins. A clean copy is a lonely copy.',
  'You must not keep it longer than needed.',
  'You must ship it USPS Media Mail for best value.',
  'Remember: the book always comes home, and so do we.',
];

/**
 * The Rules of the Pants from the first book, shown as a taped note beside
 * ours, with a credit linking to the series.
 */
export const pantsRules = [
  'You must never wash the Pants.',
  'You must never double-cuff the Pants. It’s tacky. There will never be a time when this will not be tacky.',
  'You must never say the word “phat” while wearing the Pants. You must also never think “I am fat” while wearing the Pants.',
  'You must never let a boy take off the Pants (although you may take them off yourself in his presence).',
  'You must not pick your nose while wearing the Pants. You may, however, scratch casually your nostril while really kind of picking.',
  'Upon our reunion, you must follow the proper procedures for documenting your time in the Pants.',
  'You must write to your Sisters throughout the summer, no matter how much fun you are having without them.',
  'You must pass the Pants along to your Sister according to the specifications set down by the Sisterhood. Failures to comply will result in a severe spanking upon our reunion.',
  'You must not wear the Pants with a tucked-in shirt and belt. See rule #2.',
  'Remember: Pants = love. Love your pals. Love yourself.',
];

/** The line that opens the Rules of the Pants in the book. */
export const pantsPreamble =
  'We, the Sisterhood, hereby instate the following rules to govern the use of the Traveling Pants:';

export const pantsCredit = {
  text: 'From The Sisterhood of the Traveling Pants by Ann Brashares',
  href: SERIES_URL,
};

export const homage =
  'A fan homage to The Sisterhood of the Traveling Pants by Ann Brashares. Not affiliated with the author or publisher.';
