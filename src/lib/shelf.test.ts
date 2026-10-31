import { describe, expect, it } from 'vitest';

import { sameBook } from './shelfBooks';

describe('sameBook', () => {
  it('ignores case and stray spaces', () => {
    expect(sameBook({ title: ' Middlemarch ', author: 'george eliot' }, { title: 'middlemarch', author: 'George Eliot' })).toBe(true);
  });

  it('tells different books apart', () => {
    expect(sameBook({ title: 'Emma', author: 'Jane Austen' }, { title: 'Persuasion', author: 'Jane Austen' })).toBe(false);
  });
});
