export type BookStatus = 'in-transit' | 'reading' | 'returned' | 'annotated';

export type FriendStatus = 'waiting' | 'reading' | 'done';

export type Friend = {
  id: string;
  name: string;
  city: string;
  state: string;
  status: FriendStatus;
  address?: string;
  email?: string;
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
  isbn?: string;
  trackingNumber?: string;
};

export type RootTabParamList = {
  Home: undefined;
  Friends: undefined;
  AddBook: undefined;
  Profile: undefined;
};

export type RootStackParamList = {
  Home: undefined;
  BookDetail: { bookId: string; bookTitle: string };
  Friends: undefined;
  AddBook: undefined;
  Profile: undefined;
};
