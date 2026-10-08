import { booksSeed, friends as mockFriends } from '../data/mockData';
import type { Book, Friend } from '../types';
import { supabase } from './supabase';

const fallback = {
  books: booksSeed,
  friends: mockFriends,
};

export async function fetchBooks(): Promise<Book[]> {
  if (!supabase) {
    return fallback.books;
  }

  try {
    const { data, error } = await supabase.from('books').select('*').order('created_at', { ascending: false });
    if (error) {
      console.warn('Supabase books fetch failed:', error.message);
      return fallback.books;
    }

    return (data as Book[]) ?? fallback.books;
  } catch (error) {
    console.warn('Books fetch error:', error);
    return fallback.books;
  }
}

export async function fetchFriends(): Promise<Friend[]> {
  if (!supabase) {
    return fallback.friends;
  }

  try {
    const { data, error } = await supabase.from('friends').select('*').order('created_at', { ascending: false });
    if (error) {
      console.warn('Supabase friends fetch failed:', error.message);
      return fallback.friends;
    }

    return (data as Friend[]) ?? fallback.friends;
  } catch (error) {
    console.warn('Friends fetch error:', error);
    return fallback.friends;
  }
}

export async function createBook(book: Book): Promise<Book | null> {
  if (!supabase) {
    return book;
  }

  try {
    const { data, error } = await supabase.from('books').insert([book]).select().single();
    if (error) {
      console.warn('Supabase createBook failed:', error.message);
      return book;
    }

    return data as Book;
  } catch (error) {
    console.warn('Create book error:', error);
    return book;
  }
}

export async function createFriend(friend: Friend): Promise<Friend | null> {
  if (!supabase) {
    return friend;
  }

  try {
    const { data, error } = await supabase.from('friends').insert([friend]).select().single();
    if (error) {
      console.warn('Supabase createFriend failed:', error.message);
      return friend;
    }

    return data as Friend;
  } catch (error) {
    console.warn('Create friend error:', error);
    return friend;
  }
}

export async function getInitialBookClubData() {
  const [books, friends] = await Promise.all([fetchBooks(), fetchFriends()]);
  return { books, friends };
}
