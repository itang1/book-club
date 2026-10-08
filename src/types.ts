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

export type BookStatus = 'in-transit' | 'reading' | 'returned' | 'annotated';

export type Annotation = {
  id: string;
  bookId: string;
  friendId: string;
  friendName: string;
  pageNumber?: number;
  note: string;
  createdAt: string;
};

export type Shipment = {
  id: string;
  bookId: string;
  trackingNumber: string;
  fromName: string;
  toName: string;
  status: 'pending' | 'in-transit' | 'delivered';
  createdAt: string;
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
  notesCount: number;
  trackingNumber?: string;
  friends: Friend[];
  annotations: Annotation[];
  shipment?: Shipment;
};

export type RootTabParamList = {
  Home: undefined;
  Friends: undefined;
  AddBook: undefined;
  Notes: undefined;
  Profile: undefined;
};

export type RootStackParamList = {
  Home: undefined;
  BookDetail: { bookId: string; bookTitle: string };
  Notes: undefined;
};
