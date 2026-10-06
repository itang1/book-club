export type BookStatus = 'in-transit' | 'reading' | 'returned' | 'annotated';

export type Friend = {
  id: string;
  name: string;
  city: string;
  state: string;
  status: 'waiting' | 'reading' | 'done';
};

export type Book = {
  id: string;
  title: string;
  author: string;
  coverColor: string;
  status: BookStatus;
  currentOwner: string;
  nextStop: string;
  lastUpdated: string;
  friends: Friend[];
  notesCount: number;
};
