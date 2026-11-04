/**
 * The sample groups every newcomer finds themselves in: four casts of
 * fictional characters passing books around, each with copies in the post,
 * notes on the way, and lines waiting. One source for both the demo
 * (mockData.ts) and the database (supabase/sample.sql, generated from this by
 * sampleSql.ts; `npm run sample:sql` rewrites it).
 *
 * Kept fictional on purpose: this ships in the client bundle and the repo is
 * public. The notes are original, written in each character's voice.
 *
 * Times are "days ago", relative to whenever the data is loaded, and a daily
 * job in the database keeps them that fresh, so the sample never goes stale.
 */

export type SamplePerson = { id: string; name: string; city: string; state: string };

export type SampleStop = {
  /** Who it went to. The first stop is the owner putting it into circulation. */
  to: string;
  /** Days ago it was sent (or, for the first stop, lent). */
  sent: number;
  /** Days ago "Got it" was tapped; null while it's in the post. Defaults to `sent`. */
  got?: number | null;
  /** What the sender said about the book as they passed it on. */
  rating?: number;
  note?: string;
  /** Where it was read, when not the recipient's home city. */
  place?: [city: string, region: string];
};

export type SampleBook = {
  id: string;
  title: string;
  author: string;
  color: string;
  /** Open Library cover id. */
  cover?: string;
  giftedBy?: string;
  journey: SampleStop[];
  /** Signed up and waiting, in order. */
  waiting?: string[];
};

export type SampleClub = {
  id: string;
  name: string;
  inviteCode: string;
  people: SamplePerson[];
  books: SampleBook[];
};

export const sampleClubs: SampleClub[] = [
  {
    // Carmen, Lena, Tibby and Bridget, where they spend the first book's summer.
    id: 'group-pants',
    name: 'The Traveling Pants',
    inviteCode: 'sample-pants',
    people: [
      { id: 'friend-lena', name: 'Lena Kaligaris', city: 'Santorini', state: 'Greece' },
      { id: 'friend-tibby', name: 'Tibby Rollins', city: 'Bethesda', state: 'MD' },
      { id: 'friend-carmen', name: 'Carmen Lowell', city: 'Charleston', state: 'SC' },
      { id: 'friend-bridget', name: 'Bridget Vreeland', city: 'Baja California', state: 'Mexico' },
    ],
    books: [
      {
        id: 'sample-pride',
        title: 'Pride and Prejudice',
        author: 'Jane Austen',
        color: '#c89366',
        cover: '14348537',
        journey: [
          { to: 'friend-carmen', sent: 41 },
          {
            to: 'friend-lena',
            sent: 12,
            got: 9,
            rating: 5,
            note: "Read it somewhere sunny. You'll work out which of us is which by chapter three.",
          },
        ],
        waiting: ['friend-tibby', 'friend-bridget'],
      },
      {
        id: 'sample-room',
        title: 'A Room with a View',
        author: 'E. M. Forster',
        color: '#c7a6b5',
        cover: '1748132',
        journey: [
          { to: 'friend-lena', sent: 63 },
          {
            to: 'friend-bridget',
            sent: 0.2,
            got: null,
            rating: 3,
            note: "Slow to start, then it's all sunlight. Lucy is so frustrating and so right.",
          },
        ],
        waiting: ['friend-tibby'],
      },
      {
        id: 'sample-little',
        title: 'Little Women',
        author: 'Louisa May Alcott',
        color: '#a8927d',
        cover: '8775559',
        giftedBy: 'Grandma',
        journey: [
          { to: 'friend-tibby', sent: 94 },
          {
            to: 'friend-carmen',
            sent: 38,
            got: 33,
            rating: 4,
            note: 'Bring tissues. I mean it. Call me when you get to the end.',
          },
          {
            to: 'friend-bridget',
            sent: 7,
            got: 3,
            rating: 5,
            note: 'I underlined way too much, sorry not sorry.',
          },
        ],
      },
      {
        id: 'sample-anne',
        title: 'Anne of Green Gables',
        author: 'L. M. Montgomery',
        color: '#8f9bb0',
        cover: '14641084',
        journey: [
          { to: 'friend-bridget', sent: 121 },
          {
            to: 'friend-tibby',
            sent: 88,
            got: 84,
            rating: 4,
            note: "Anne talks a lot for the first fifty pages. You'll love her anyway.",
          },
          {
            to: 'friend-carmen',
            sent: 59,
            got: 55,
            rating: 5,
            note: "Kindred spirits. That's all I'll say.",
          },
          {
            to: 'friend-bridget',
            sent: 20,
            got: 16,
            rating: 4,
            note: "Thank you for lending me your copy. It's a little sandier now.",
          },
        ],
        // Tibby has read it already and signed up again.
        waiting: ['friend-tibby'],
      },
      {
        id: 'sample-eyre',
        title: 'Jane Eyre',
        author: 'Charlotte Brontë',
        color: '#b4b8a9',
        cover: '8235363',
        journey: [
          { to: 'friend-lena', sent: 200 },
          {
            to: 'friend-carmen',
            sent: 170,
            got: 163,
            rating: 5,
            note: 'Reader, I mailed it. Tell me when you meet Mr. Rochester.',
          },
          {
            to: 'friend-tibby',
            sent: 140,
            got: 136,
            rating: 4,
            note: 'Darker than I expected and better for it. Read the attic chapters at night.',
          },
          {
            to: 'friend-bridget',
            sent: 110,
            got: 104,
            rating: 5,
            note: 'Jane would have been great at soccer. Stubborn, fast, never quits.',
          },
          {
            to: 'friend-lena',
            sent: 75,
            got: 68,
            rating: 5,
            note: 'Home it goes, with sand in the spine. Thank you for starting this one.',
          },
        ],
      },
      {
        id: 'sample-persuasion',
        title: 'Persuasion',
        author: 'Jane Austen',
        color: '#b8c4d4',
        journey: [
          { to: 'friend-tibby', sent: 30 },
          {
            to: 'friend-carmen',
            sent: 0.4,
            got: null,
            rating: 5,
            note: 'Eight years of waiting and one letter. Read the letter chapter twice, then call me.',
          },
        ],
        waiting: ['friend-lena'],
      },
      {
        id: 'sample-rebecca',
        title: 'Rebecca',
        author: 'Daphne du Maurier',
        color: '#c2b4a3',
        journey: [{ to: 'friend-carmen', sent: 4 }],
        waiting: ['friend-lena', 'friend-bridget'],
      },
    ],
  },
  {
    id: 'group-friends',
    name: 'Central Perk Regulars',
    inviteCode: 'sample-friends',
    people: [
      { id: 'friend-rachel', name: 'Rachel Green', city: 'New York', state: 'NY' },
      { id: 'friend-monica', name: 'Monica Geller', city: 'Westchester', state: 'NY' },
      { id: 'friend-chandler', name: 'Chandler Bing', city: 'Westchester', state: 'NY' },
      { id: 'friend-ross', name: 'Ross Geller', city: 'New York', state: 'NY' },
      { id: 'friend-joey', name: 'Joey Tribbiani', city: 'Los Angeles', state: 'CA' },
      { id: 'friend-phoebe', name: 'Phoebe Buffay', city: 'New York', state: 'NY' },
    ],
    books: [
      {
        id: 'sample-jurassic',
        title: 'Jurassic Park',
        author: 'Michael Crichton',
        color: '#a9b48f',
        journey: [
          { to: 'friend-ross', sent: 120 },
          {
            to: 'friend-joey',
            sent: 96,
            got: 92,
            rating: 3,
            note: "I've corrected the paleontology in the margins. Velociraptors were the size of turkeys. Please read the margins.",
          },
          {
            to: 'friend-chandler',
            sent: 61,
            got: 58,
            rating: 5,
            note: 'Dinosaurs! Skipped the margin stuff. The T. rex part, I had to put it down and walk around the apartment.',
          },
          {
            to: 'friend-phoebe',
            sent: 22,
            got: 20,
            rating: 4,
            note: 'Could this book BE more about chaos theory? Loved it. Ross, your margins are longer than the chapters.',
          },
          {
            to: 'friend-rachel',
            sent: 0.25,
            got: null,
            rating: 5,
            note: 'I think the dinosaurs had a point. Also I let the bookmark go free. It wanted to.',
          },
        ],
        waiting: ['friend-monica'],
      },
      {
        id: 'sample-shining',
        title: 'The Shining',
        author: 'Stephen King',
        color: '#b4c3d1',
        journey: [
          { to: 'friend-joey', sent: 80 },
          {
            to: 'friend-rachel',
            sent: 45,
            got: 41,
            rating: 5,
            note: "Heads up: it lives in the freezer between chapters. That's normal. Don't ask.",
          },
        ],
        waiting: ['friend-chandler', 'friend-ross'],
      },
      {
        id: 'sample-french',
        title: 'Mastering the Art of French Cooking',
        author: 'Julia Child',
        color: '#dcc196',
        journey: [
          { to: 'friend-monica', sent: 150 },
          {
            to: 'friend-phoebe',
            sent: 130,
            got: 127,
            rating: 5,
            note: 'There is a ribbon. Use the ribbon. Do not dog-ear. I will know.',
          },
          {
            to: 'friend-rachel',
            sent: 90,
            got: 88,
            rating: 4,
            note: 'Made the boeuf bourguignon without the beef. So, just bourguignon. Still great.',
          },
          {
            to: 'friend-monica',
            sent: 60,
            got: 59,
            rating: 4,
            note: "Okay, I didn't cook anything, but I read it in the bath and it was SO relaxing. Sorry about page 212.",
          },
        ],
        waiting: ['friend-joey'],
      },
      {
        id: 'sample-catch',
        title: 'Catch-22',
        author: 'Joseph Heller',
        color: '#d1b878',
        journey: [
          { to: 'friend-chandler', sent: 35 },
          {
            to: 'friend-ross',
            sent: 9,
            got: 7,
            rating: 5,
            note: "The funniest sad book ever written. Or the saddest funny one. I'm told that's my whole personality.",
          },
        ],
        waiting: ['friend-joey'],
      },
      {
        id: 'sample-bridget-jones',
        title: "Bridget Jones's Diary",
        author: 'Helen Fielding',
        color: '#e0b4b0',
        journey: [{ to: 'friend-rachel', sent: 3 }],
        waiting: ['friend-monica', 'friend-phoebe'],
      },
      {
        id: 'sample-seagull',
        title: 'Jonathan Livingston Seagull',
        author: 'Richard Bach',
        color: '#bcd3cc',
        journey: [
          { to: 'friend-phoebe', sent: 200 },
          {
            to: 'friend-joey',
            sent: 170,
            got: 165,
            rating: 5,
            note: 'This seagull is my spirit animal. Well, one of them. My grandmother might also be a seagull.',
          },
          {
            to: 'friend-monica',
            sent: 140,
            got: 138,
            rating: 4,
            note: "It's about a bird who's really, really into flying. I respect that.",
          },
          {
            to: 'friend-chandler',
            sent: 100,
            got: 99,
            rating: 3,
            note: 'Short and sweet. I alphabetised your shelf while I was over, Phoebe. You can thank me.',
          },
          {
            to: 'friend-ross',
            sent: 70,
            got: 66,
            rating: 3,
            note: 'A bird finds himself. Mostly I found sand in it. Phoebe, why is there sand.',
          },
          {
            to: 'friend-phoebe',
            sent: 40,
            got: 37,
            rating: 4,
            note: "Technically gulls can't do most of this. But I cried at the end, so.",
          },
        ],
      },
    ],
  },
  {
    id: 'group-ues',
    name: 'The Upper East Side',
    inviteCode: 'sample-ues',
    people: [
      { id: 'friend-blair', name: 'Blair Waldorf', city: 'Manhattan', state: 'NY' },
      { id: 'friend-serena', name: 'Serena van der Woodsen', city: 'Southampton', state: 'NY' },
      { id: 'friend-dan', name: 'Dan Humphrey', city: 'Brooklyn', state: 'NY' },
      { id: 'friend-nate', name: 'Nate Archibald', city: 'Manhattan', state: 'NY' },
      { id: 'friend-chuck', name: 'Chuck Bass', city: 'Monaco', state: 'Monaco' },
      { id: 'friend-jenny', name: 'Jenny Humphrey', city: 'Hudson', state: 'NY' },
    ],
    books: [
      {
        id: 'sample-tiffany',
        title: "Breakfast at Tiffany's",
        author: 'Truman Capote',
        color: '#a6d2cc',
        journey: [
          { to: 'friend-blair', sent: 140 },
          {
            to: 'friend-serena',
            sent: 110,
            got: 108,
            rating: 5,
            note: 'First edition. Return it in the condition you received it in, which is flawless. XOXO, B.',
          },
          {
            to: 'friend-jenny',
            sent: 75,
            got: 70,
            rating: 5,
            note: "Read it on the beach in Southampton. There may be a little sand. Don't tell Blair.",
          },
          {
            to: 'friend-nate',
            sent: 30,
            got: 28,
            rating: 4,
            note: 'Holly Golightly would never wear the same thing twice. I made a dress inspired by chapter two.',
          },
          {
            to: 'friend-chuck',
            sent: 0.1,
            got: null,
            rating: 3,
            note: "Didn't totally finish it. Good though. Chuck, she wants it back by Friday.",
          },
        ],
        waiting: ['friend-dan'],
      },
      {
        id: 'sample-gatsby',
        title: 'The Great Gatsby',
        author: 'F. Scott Fitzgerald',
        color: '#d4c08e',
        journey: [
          { to: 'friend-serena', sent: 90 },
          {
            to: 'friend-dan',
            sent: 60,
            got: 57,
            rating: 5,
            note: "Read it with the windows open. It's basically a Hamptons party that goes on a little too long.",
          },
          {
            to: 'friend-blair',
            sent: 20,
            got: 18,
            rating: 5,
            note: "A book about outsiders who want in. I've annotated it, lightly. Fine: heavily.",
          },
        ],
        waiting: ['friend-chuck', 'friend-nate'],
      },
      {
        id: 'sample-innocence',
        title: 'The Age of Innocence',
        author: 'Edith Wharton',
        color: '#cbbcd8',
        journey: [
          { to: 'friend-dan', sent: 200 },
          {
            to: 'friend-blair',
            sent: 175,
            got: 172,
            rating: 5,
            note: "Old New York, written by someone who actually lived it. I think you'll find yourself in here.",
          },
          {
            to: 'friend-serena',
            sent: 140,
            got: 137,
            rating: 5,
            note: 'I did not "find myself in it," Humphrey. But May deserved better. Fine. It\'s perfect.',
          },
          {
            to: 'friend-jenny',
            sent: 100,
            got: 96,
            rating: 5,
            note: 'Ellen Olenska, forever and always.',
          },
          {
            to: 'friend-dan',
            sent: 60,
            got: 58,
            rating: 4,
            note: 'Brought it home for you. Dad says come for dinner.',
          },
        ],
      },
      {
        id: 'sample-dorian',
        title: 'The Picture of Dorian Gray',
        author: 'Oscar Wilde',
        color: '#d9b0a8',
        journey: [
          { to: 'friend-chuck', sent: 50 },
          {
            to: 'friend-nate',
            sent: 26,
            got: 21,
            rating: 5,
            note: 'A man who never ages and never apologises. Required reading.',
            place: ['Manhattan', 'NY'],
          },
          {
            to: 'friend-blair',
            sent: 6,
            got: 4,
            rating: 4,
            note: 'Kind of messed up. Chuck underlined a lot of it, which is also kind of messed up.',
          },
        ],
        waiting: ['friend-serena'],
      },
      {
        id: 'sample-brideshead',
        title: 'Brideshead Revisited',
        author: 'Evelyn Waugh',
        color: '#b2c6a8',
        journey: [{ to: 'friend-nate', sent: 1 }],
        waiting: ['friend-blair', 'friend-chuck', 'friend-dan'],
      },
    ],
  },
  {
    id: 'group-pritchett',
    name: 'The Pritchett-Dunphys',
    inviteCode: 'sample-pritchett',
    people: [
      { id: 'friend-jay', name: 'Jay Pritchett', city: 'Los Angeles', state: 'CA' },
      { id: 'friend-gloria', name: 'Gloria Pritchett', city: 'Cartagena', state: 'Colombia' },
      { id: 'friend-claire', name: 'Claire Dunphy', city: 'Los Angeles', state: 'CA' },
      { id: 'friend-phil', name: 'Phil Dunphy', city: 'Los Angeles', state: 'CA' },
      { id: 'friend-mitchell', name: 'Mitchell Pritchett', city: 'Los Angeles', state: 'CA' },
      { id: 'friend-cameron', name: 'Cameron Tucker', city: 'Los Angeles', state: 'CA' },
      { id: 'friend-alex', name: 'Alex Dunphy', city: 'Pasadena', state: 'CA' },
      { id: 'friend-manny', name: 'Manny Delgado', city: 'Los Angeles', state: 'CA' },
    ],
    books: [
      {
        id: 'sample-oldman',
        title: 'The Old Man and the Sea',
        author: 'Ernest Hemingway',
        color: '#a9c1cf',
        journey: [
          { to: 'friend-jay', sent: 130 },
          {
            to: 'friend-manny',
            sent: 110,
            got: 108,
            rating: 5,
            note: "Short. A man, a boat, a fish. No feelings talk. You'll like it, kid.",
          },
          {
            to: 'friend-phil',
            sent: 80,
            got: 77,
            rating: 5,
            note: 'It is entirely about feelings, Jay. I wept twice: once for the marlin, once for the sunrise.',
          },
          {
            to: 'friend-cameron',
            sent: 45,
            got: 43,
            rating: 4,
            note: "I also once caught a fish! Smaller. Same journey though. Phil's-osophy: be the marlin.",
          },
          {
            to: 'friend-jay',
            sent: 15,
            got: 14,
            rating: 5,
            note: 'Santiago never quits. I did a dramatic reading for Lily. She left halfway, but that was her loss.',
          },
        ],
      },
      {
        id: 'sample-carnegie',
        title: 'How to Win Friends and Influence People',
        author: 'Dale Carnegie',
        color: '#e2c886',
        journey: [
          { to: 'friend-phil', sent: 70 },
          {
            to: 'friend-claire',
            sent: 50,
            got: 49,
            rating: 5,
            note: "Honey, I highlighted the good parts. Spoiler: it's all good parts!",
          },
          {
            to: 'friend-mitchell',
            sent: 12,
            got: 10,
            rating: 3,
            note: 'Phil gave me this. Every page is highlighted. Every. Page.',
          },
        ],
        waiting: ['friend-jay', 'friend-gloria'],
      },
      {
        id: 'sample-cholera',
        title: 'Love in the Time of Cholera',
        author: 'Gabriel García Márquez',
        color: '#e5bca6',
        journey: [
          { to: 'friend-manny', sent: 100 },
          {
            to: 'friend-gloria',
            sent: 70,
            got: 64,
            rating: 5,
            note: 'Mamá, this one is about a love that waits fifty years. Read it slowly, on the balcony.',
          },
          {
            to: 'friend-cameron',
            sent: 30,
            got: 27,
            rating: 5,
            note: 'I read it in Cartagena, where it happens! I cried on the balcony and the neighbours cried with me.',
          },
          {
            to: 'friend-claire',
            sent: 0.2,
            got: null,
            rating: 5,
            note: 'Half a century of yearning. I felt every single year of it. Claire, please let yourself feel something.',
          },
        ],
        waiting: ['friend-mitchell'],
      },
      {
        id: 'sample-hawking',
        title: 'A Brief History of Time',
        author: 'Stephen Hawking',
        color: '#bfc1d0',
        journey: [
          { to: 'friend-alex', sent: 60 },
          {
            to: 'friend-phil',
            sent: 40,
            got: 38,
            rating: 4,
            note: "Dad, it's not about time travel. Please stop asking.",
          },
          {
            to: 'friend-manny',
            sent: 14,
            got: 12,
            rating: 5,
            note: "It's a little bit about time travel.",
          },
        ],
        waiting: ['friend-jay'],
      },
      {
        id: 'sample-tuscan',
        title: 'Under the Tuscan Sun',
        author: 'Frances Mayes',
        color: '#e8d3a2',
        journey: [{ to: 'friend-cameron', sent: 2 }],
        waiting: ['friend-gloria', 'friend-claire'],
      },
    ],
  },
];

/** Each person's place in each line, derived from the journey and who's waiting. */
export function sampleQueue(
  book: SampleBook,
): { friendId: string; position: number; status: 'waiting' | 'reading' | 'done' }[] {
  const owner = book.journey[0].to;
  const holder = book.journey[book.journey.length - 1].to;
  const home = holder === owner && book.journey.length > 1;
  const waiting = book.waiting ?? [];
  const positions = new Map<string, number>();
  book.journey.forEach((stop, index) => positions.set(stop.to, stop.to === owner ? 0 : index));
  waiting.forEach((id, index) => positions.set(id, book.journey.length + index));

  return [...positions].map(([friendId, position]) => ({
    friendId,
    position,
    status: waiting.includes(friendId)
      ? 'waiting'
      : friendId === holder && !home
        ? 'reading'
        : 'done',
  }));
}

export const samplePeople: SamplePerson[] = sampleClubs.flatMap((club) => club.people);
