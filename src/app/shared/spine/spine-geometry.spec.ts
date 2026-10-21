import { Book } from '../../core/book';
import { MOCK_BOOKS } from '../../core/mock-books';
import { fitSpineTitle, spineHeight, spineLabel, spineWidth } from './spine-geometry';

describe('spineWidth', () => {
  it('follows round((16 + pages × 0.034) × scale)', () => {
    expect(spineWidth(118)).toBe(20);
    expect(spineWidth(1023)).toBe(51);
  });

  it('scales', () => {
    expect(spineWidth(1023, 0.5)).toBe(25);
  });
});

describe('spineHeight', () => {
  it('is the same for the same id every time', () => {
    for (const { id } of MOCK_BOOKS) {
      expect(spineHeight(id)).toBe(spineHeight(id));
    }
  });

  it('stays within 160–206 px and varies between books', () => {
    const heights = Array.from({ length: 500 }, (_, i) => spineHeight(`book-${i}`));
    expect(Math.min(...heights)).toBeGreaterThanOrEqual(160);
    expect(Math.max(...heights)).toBeLessThanOrEqual(206);
    expect(new Set(heights).size).toBeGreaterThan(30);
  });

  it('multiplies by 0.85 in compact density', () => {
    const id = 'bk-middlemarch';
    expect(spineHeight(id, 1, 'compact')).toBe(Math.round(spineHeight(id) * 0.85));
  });
});

describe('fitSpineTitle', () => {
  const base = { style: 'cloth', width: 30, height: 180 } as const;

  it('keeps title and author at the base size when both fit', () => {
    expect(fitSpineTitle({ ...base, title: 'Emma', author: 'Jane Austen' })).toEqual({
      titleSize: 13,
      authorSize: 10,
      showAuthor: true,
      truncated: false,
    });
  });

  it('caps the size at 0.56 × width', () => {
    expect(fitSpineTitle({ ...base, width: 20, title: 'Emma', author: '' }).titleSize).toBe(11);
  });

  it('never goes below 8 px, even on a narrow spine', () => {
    expect(fitSpineTitle({ ...base, width: 10, title: 'Emma', author: '' }).titleSize).toBe(8);
  });

  it('drops the author before shrinking the title', () => {
    const fit = fitSpineTitle({ ...base, title: 'Middlemarch', author: 'George Eliot' });
    expect(fit.showAuthor).toBe(false);
    expect(fit.titleSize).toBe(13);
  });

  it('shrinks the title only once the author is gone', () => {
    const fit = fitSpineTitle({ ...base, title: 'The Picture of Dorian Gray', author: 'Oscar Wilde' });
    expect(fit.showAuthor).toBe(false);
    expect(fit.titleSize).toBeLessThan(13);
    expect(fit.titleSize).toBeGreaterThanOrEqual(8);
    expect(fit.truncated).toBe(false);
  });

  it('stops at the 8 px floor and reports truncation', () => {
    const fit = fitSpineTitle({ ...base, title: 'A'.repeat(80), author: 'Someone' });
    expect(fit).toEqual({ titleSize: 8, authorSize: 8, showAuthor: false, truncated: true });
  });

  it('uses the wider caps factor for bold and band', () => {
    const title = 'Frankenstein';
    const serif = fitSpineTitle({ ...base, style: 'paper', height: 200, title, author: 'Mary Shelley' });
    const caps = fitSpineTitle({ ...base, style: 'bold', height: 200, title, author: 'Mary Shelley' });
    expect(serif.showAuthor).toBe(true);
    expect(caps.showAuthor).toBe(false);
  });
});

describe('spineLabel', () => {
  const book: Book = {
    id: 'x',
    title: 'Middlemarch',
    author: 'George Eliot',
    pages: 880,
    status: 'finished',
    progress: 1,
    offline: { kind: 'on-device' },
    spine: { style: 'cloth', color: 'oxblood' },
  };

  it('reads "{title} by {author}, {pages} pages, {status}"', () => {
    expect(spineLabel(book)).toBe('Middlemarch by George Eliot, 880 pages, finished');
    expect(spineLabel({ ...book, status: 'to-read' })).toBe('Middlemarch by George Eliot, 880 pages, to read');
  });

  it('includes the share read and the offline state', () => {
    expect(spineLabel({ ...book, status: 'reading', progress: 0.42 })).toBe(
      'Middlemarch by George Eliot, 880 pages, reading, 42% read',
    );
    expect(spineLabel({ ...book, status: 'new', offline: { kind: 'not-on-device' } })).toBe(
      'Middlemarch by George Eliot, 880 pages, new, not on this device',
    );
    expect(spineLabel({ ...book, offline: { kind: 'downloading', progress: 0.35 } })).toBe(
      'Middlemarch by George Eliot, 880 pages, finished, downloading, 35%',
    );
  });
});
