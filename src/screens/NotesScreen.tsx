import type { Annotation, Book, Shipment } from '../types';

export const friends = [
  { id: 'friend-1', name: 'Maya', city: 'Seattle', state: 'WA', status: 'done', address: '429 Pine St, Seattle, WA', email: 'maya@example.com' },
  { id: 'friend-2', name: 'Leah', city: 'Austin', state: 'TX', status: 'reading', address: '88 Willow Dr, Austin, TX', email: 'leah@example.com' },
  { id: 'friend-3', name: 'Priya', city: 'Boston', state: 'MA', status: 'waiting', address: '14 Commonwealth Ave, Boston, MA', email: 'priya@example.com' },
  { id: 'friend-4', name: 'Nina', city: 'Chicago', state: 'IL', status: 'waiting', address: '301 Lakeview Terrace, Chicago, IL', email: 'nina@example.com' },
  { id: 'friend-5', name: 'Rina', city: 'New York', state: 'NY', status: 'done', address: '98 7th Ave, New York, NY', email: 'rina@example.com' },
] as const;

export const annotations: Annotation[] = [
  {
    id: 'annotation-1',
    bookId: 'book-1',
    friendId: 'friend-1',
    friendName: 'Maya',
    pageNumber: 42,
    note: 'This chapter feels like a love letter to chosen family. The sensory details are incredible.',
    createdAt: '2 days ago',
  },
  {
    id: 'annotation-2',
    bookId: 'book-2',
    friendId: 'friend-2',
    friendName: 'Leah',
    pageNumber: 18,
    note: 'Elizabeth’s wit is sharp, but the emotional stakes are even sharper. This is such a modern kind of pride.',
    createdAt: 'Today',
  },
  {
    id: 'annotation-3',
    bookId: 'book-3',
    friendId: 'friend-3',
    friendName: 'Priya',
    pageNumber: 88,
    note: 'The symbolism in the Mango Street moments sticks with me. Simple, intimate, and unforgettable.',
    createdAt: 'Yesterday',
  },
];

export const shipments: Shipment[] = [
  {
    id: 'shipment-1',
    bookId: 'book-1',
    trackingNumber: '9400 1234 5678 9012 3456 78',
    fromName: 'Maya',
    toName: 'Leah',
    status: 'in-transit',
    createdAt: '2 days ago',
  },
  {
    id: 'shipment-2',
    bookId: 'book-2',
    trackingNumber: '9400 9876 5432 1098 7654 32',
    fromName: 'Leah',
    toName: 'Nina',
    status: 'delivered',
    createdAt: 'Today',
  },
  {
    id: 'shipment-3',
    bookId: 'book-3',
    trackingNumber: '9400 6543 2109 8765 4321 09',
    fromName: 'Priya',
    toName: 'Rina',
    status: 'pending',
    createdAt: 'Yesterday',
  },
];

export const booksSeed: Book[] = [
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
    shipment: shipments[0],
    friends: [
      { id: 'friend-1', name: 'Maya', city: 'Seattle', state: 'WA', status: 'done' },
      { id: 'friend-2', name: 'Leah', city: 'Austin', state: 'TX', status: 'waiting' },
      { id: 'friend-3', name: 'Priya', city: 'Boston', state: 'MA', status: 'reading' },
    ],
    annotations: [
      annotations[0],
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
    shipment: shipments[1],
    friends: [
      { id: 'friend-2', name: 'Leah', city: 'Austin', state: 'TX', status: 'reading' },
      { id: 'friend-4', name: 'Nina', city: 'Chicago', state: 'IL', status: 'waiting' },
    ],
    annotations: [annotations[1]],
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
    shipment: shipments[2],
    friends: [
      { id: 'friend-3', name: 'Priya', city: 'Boston', state: 'MA', status: 'done' },
      { id: 'friend-5', name: 'Rina', city: 'New York', state: 'NY', status: 'waiting' },
    ],
    annotations: [annotations[2]],
  },
];
