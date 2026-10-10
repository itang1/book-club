import { describe, expect, it } from 'vitest';

import { renderEmail } from '../../supabase/functions/notify/templates';

const book = { title: 'Circe', author: 'Madeline Miller', coverColor: '#b4b8a9' };
const appUrl = 'https://example.test/';

describe('emails', () => {
  it('book sent: names the sender, mentions a sealed letter', () => {
    const email = renderEmail({
      kind: 'book_sent', recipient: 'Tibby', other: 'Carmen Lowell', book, group: 'Our Book Club', hasLetter: true, appUrl,
    });
    expect(email.subject).toBe('Carmen sent you Circe');
    expect(email.html).toContain('tucked a letter inside');
    expect(email.text).toContain('tap Got it');
  });

  it('book arrived: says how many cities, not "4th place"', () => {
    const email = renderEmail({
      kind: 'book_arrived', recipient: 'Carmen', other: 'Tibby', book, city: 'Seattle', cities: 4, appUrl,
    });
    expect(email.subject).toBe('Circe made it to Tibby');
    expect(email.text).toContain("It's in Seattle now. It has been read in 4 different cities so far.");
  });

  it('escapes names and titles in the HTML', () => {
    const email = renderEmail({ kind: 'friend_request', recipient: 'A', other: '<b>Bad</b>', appUrl });
    expect(email.html).not.toContain('<b>Bad</b>');
    expect(email.html).toContain('&lt;b&gt;Bad&lt;/b&gt; asked to be friends');
    expect(email.subject).toBe('<b>Bad</b> wants to be friends');
    expect(email.text).toContain('<b>Bad</b> asked to be friends');
  });

  it('buttons open the book, or Friends for a request; settings link to You', () => {
    const sent = renderEmail({ kind: 'book_sent', recipient: 'T', other: 'C', book, bookId: 'sample-room', appUrl });
    expect(sent.html).toContain('href="https://example.test/b/sample-room"');
    expect(sent.html).toContain('href="https://example.test/you"');
    const request = renderEmail({ kind: 'friend_request', recipient: 'T', other: 'C', appUrl });
    expect(request.text).toContain('https://example.test/friends');
  });

  it('a one-tap link becomes the main button, with the book still a tap away', () => {
    const sent = renderEmail({
      kind: 'book_sent', recipient: 'T', other: 'C', book, bookId: 'b1', appUrl, actionUrl: 'https://example.test/?do=abc',
    });
    expect(sent.html).toContain('href="https://example.test/?do=abc"');
    expect(sent.html).toContain("Got it, it's here");
    expect(sent.html).toContain('href="https://example.test/b/b1"');
    expect(sent.text).toContain("Got it, it's here: https://example.test/?do=abc");
    const plain = renderEmail({ kind: 'book_arrived', recipient: 'T', other: 'C', book, bookId: 'b1', appUrl, actionUrl: 'x' });
    expect(plain.html).not.toContain('href="x"');
  });

  it('new book: names who is lending it and invites a join', () => {
    const email = renderEmail({
      kind: 'new_book', recipient: 'T', other: 'Lena Kaligaris', book, group: 'The Traveling Pants', appUrl, actionUrl: 'u',
    });
    expect(email.subject).toBe('New in The Traveling Pants: Circe');
    expect(email.text).toContain('Lena just added Circe by Madeline Miller to The Traveling Pants.');
    expect(email.text).toContain('Join the line: u');
  });
});
