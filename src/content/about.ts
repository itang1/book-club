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
    'My twelve-year-old self wanted so badly to have the life those fictional girls had, with the summer happenings and friends who stayed close across an ocean. I never found that life, or jeans that fit as well as that, but I did find the friends to pass books around by USPS Media Mail (a ritual that spawned out of an annual long-distance Secret Santa tradition).',
  ],
];

/**
 * Ours, in the spirit of the Pants' rules: the "You must" voice, specific
 * and a little silly, a time limit, and a last line about the friendship.
 * Written fresh, not borrowed.
 */
export const rules = [
  'You must write a letter before you pass it on. Two lines counts. "Good book" does not.',
  'You must never spoil the ending. Not in the letter, not in the group chat, not with your face on FaceTime.',
  'You must never dog-ear a page. Use a receipt, a boarding pass, a sock if you have to.',
  'You must write in the margins. A clean copy is a lonely copy.',
  'You must never apologize for what you underlined.',
  'You must not keep it longer than a month. If life happens, say so in the group chat.',
  "You must ship it Media Mail. It's slow, it's cheap, and the waiting is part of it.",
  'If you read it in the bath, you must confess in your letter.',
  'You must never say "I\'m not a reader" while it\'s in your hands.',
  'Remember: the book always comes home, and so do we.',
];

/**
 * The Rules of the Pants, shown as a taped note beside ours. Paraphrased,
 * not quoted: the original wording is Ann Brashares' and this site is
 * public. Credited and linked below the note.
 */
export const pantsRules = [
  'Never wash the pants.',
  'Never double-cuff them.',
  "Don't call yourself fat while you're wearing them.",
  "Don't let a boy take them off you.",
  'No picking your nose in them.',
  'When you meet up again, record what happened while you had them.',
  "Write to each other all summer, even if you're having fun.",
  'Keep them only for your turn, then pass them on.',
  'No tucked-in shirt and belt with them.',
  'The pants are love. Love your friends, and yourself.',
];

export const pantsCredit = {
  text: 'Paraphrased from The Sisterhood of the Traveling Pants by Ann Brashares',
  href: SERIES_URL,
};

export const homage =
  'A fan homage to The Sisterhood of the Traveling Pants by Ann Brashares. Not affiliated with the author or publisher.';
