import { describe, expect, it } from 'vitest';

import { bookplateHtml, qrSvg } from './bookplate';

const plate = {
  title: 'Pride & Prejudice',
  author: 'Jane Austen',
  owner: 'Carmen <Lowell>',
  link: 'https://itang1.github.io/book-club/b/book-1',
};

describe('bookplate', () => {
  it('draws a QR code', () => {
    expect(qrSvg(plate.link)).toMatch(/^<svg[\s\S]*<\/svg>$/);
  });

  it('names the owner and the book, safely', () => {
    const html = bookplateHtml(plate);
    expect(html).toContain('Pride &amp; Prejudice');
    expect(html).toContain('Carmen &lt;Lowell&gt;');
    expect(html).not.toContain('<Lowell>');
  });

  it('has two plates to cut out', () => {
    expect(bookplateHtml(plate).match(/class="plate"/g)).toHaveLength(2);
  });
});
