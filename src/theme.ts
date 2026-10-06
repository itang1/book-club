import { Book } from '../types';

export const mockBooks: Book[] = [
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
    friends: [
      { id: 'f-1', name: 'Maya', city: 'Seattle', state: 'WA', status: 'done' },
      { id: 'f-2', name: 'Leah', city: 'Austin', state: 'TX', status: 'waiting' },
      { id: 'f-3', name: 'Priya', city: 'Boston', state: 'MA', status: 'reading' },
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
    friends: [
      { id: 'f-4', name: 'Leah', city: 'Austin', state: 'TX', status: 'reading' },
      { id: 'f-5', name: 'Nina', city: 'Chicago', state: 'IL', status: 'waiting' },
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
    friends: [
      { id: 'f-6', name: 'Priya', city: 'Boston', state: 'MA', status: 'done' },
      { id: 'f-7', name: 'Rina', city: 'New York', state: 'NY', status: 'waiting' },
    ],
  },
];
