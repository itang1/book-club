export const friends = [
  { id: 'friend-1', name: 'Maya', city: 'Seattle', state: 'WA', status: 'done', address: '429 Pine St, Seattle, WA', email: 'maya@example.com' },
  { id: 'friend-2', name: 'Leah', city: 'Austin', state: 'TX', status: 'reading', address: '88 Willow Dr, Austin, TX', email: 'leah@example.com' },
  { id: 'friend-3', name: 'Priya', city: 'Boston', state: 'MA', status: 'waiting', address: '14 Commonwealth Ave, Boston, MA', email: 'priya@example.com' },
  { id: 'friend-4', name: 'Nina', city: 'Chicago', state: 'IL', status: 'waiting', address: '301 Lakeview Terrace, Chicago, IL', email: 'nina@example.com' },
  { id: 'friend-5', name: 'Rina', city: 'New York', state: 'NY', status: 'done', address: '98 7th Ave, New York, NY', email: 'rina@example.com' },
];

export const booksSeed = [
  {
    id: 'book-1',
    title: 'The Secret Life of Bees',
    author: 'Sue Monk Kidd',
    coverColor: '#d9a77d',
    status: 'in-transit',
    currentOwner: 'Maya',
    nextStop: 'Austin, TX',
    lastUpdated: '2 days ago',
    notesCount: 14,
    trackingNumber: '9400 1234 5678 9012 3456 78',
    friends: [
      { id: 'friend-1', name: 'Maya', city: 'Seattle', state: 'WA', status: 'done' },
      { id: 'friend-2', name: 'Leah', city: 'Austin', state: 'TX', status: 'waiting' },
      { id: 'friend-3', name: 'Priya', city: 'Boston', state: 'MA', status: 'reading' },
    ],
  },
  {
    id: 'book-2',
    title: 'Pride and Prejudice',
    author: 'Jane Austen',
    coverColor: '#b4b8a9',
    status: 'reading',
    currentOwner: 'Leah',
    nextStop: 'Chicago, IL',
    lastUpdated: 'Today',
    notesCount: 9,
    trackingNumber: '9400 9876 5432 1098 7654 32',
    friends: [
      { id: 'friend-2', name: 'Leah', city: 'Austin', state: 'TX', status: 'reading' },
      { id: 'friend-4', name: 'Nina', city: 'Chicago', state: 'IL', status: 'waiting' },
    ],
  },
  {
    id: 'book-3',
    title: 'The House on Mango Street',
    author: 'Sandra Cisneros',
    coverColor: '#c7a6b5',
    status: 'annotated',
    currentOwner: 'Priya',
    nextStop: 'New York, NY',
    lastUpdated: 'Yesterday',
    notesCount: 21,
    trackingNumber: '9400 6543 2109 8765 4321 09',
    friends: [
      { id: 'friend-3', name: 'Priya', city: 'Boston', state: 'MA', status: 'done' },
      { id: 'friend-5', name: 'Rina', city: 'New York', state: 'NY', status: 'waiting' },
    ],
  },
];
