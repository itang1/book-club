/** The same title and author with the case and spacing ignored, to spot a book already shelved. */
export const sameBook = (a: { title: string; author: string }, b: { title: string; author: string }) =>
  a.title.trim().toLowerCase() === b.title.trim().toLowerCase() &&
  a.author.trim().toLowerCase() === b.author.trim().toLowerCase();
