import { Book } from '../../core/book';
import { MOCK_BOOKS } from '../../core/mock-books';
import { fitSpineTitle, spineHeight, spineLabel, spineWidth, splitTitle } from './spine-geometry';

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
      lines: ['Emma'],
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
    expect(fit.lines).toEqual(['Middlemarch']);
  });

  it('shrinks the title only once the author is gone', () => {
    const fit = fitSpineTitle({ ...base, width: 20, title: 'The Picture of Dorian Gray', author: 'Oscar Wilde' });
    expect(fit.showAuthor).toBe(false);
    expect(fit.lines).toHaveLength(1);
    expect(fit.titleSize).toBeLessThan(13);
    expect(fit.titleSize).toBeGreaterThanOrEqual(8);
    expect(fit.truncated).toBe(false);
  });

  it('stops at the 8 px floor and reports truncation', () => {
    const fit = fitSpineTitle({ ...base, title: 'A'.repeat(80), author: 'Someone' });
    expect(fit).toEqual({ titleSize: 8, authorSize: 8, showAuthor: false, lines: ['A'.repeat(80)], truncated: true });
  });

  it('uses the wider caps factor for bold and band', () => {
    const title = 'Frankenstein';
    const serif = fitSpineTitle({ ...base, style: 'paper', height: 200, title, author: 'Mary Shelley' });
    const caps = fitSpineTitle({ ...base, style: 'bold', height: 200, title, author: 'Mary Shelley' });
    expect(serif.showAuthor).toBe(true);
    expect(caps.showAuthor).toBe(false);
  });

  describe('on a wide spine', () => {
    it('wraps a long title onto two lines instead of cutting it', () => {
      const fit = fitSpineTitle({ style: 'band', width: 51, height: 180, title: 'The Brothers Karamazov', author: 'Fyodor Dostoevsky' });
      expect(fit).toEqual({
        titleSize: 11,
        authorSize: 8.5,
        showAuthor: false,
        lines: ['The Brothers', 'Karamazov'],
        truncated: false,
      });
    });

    it('wraps when two lines keep the title larger than one shrunk line', () => {
      const fit = fitSpineTitle({ ...base, title: 'The Picture of Dorian Gray', author: 'Oscar Wilde' });
      expect(fit.lines).toHaveLength(2);
      expect(fit.titleSize).toBe(10);
    });

    it('still drops the author first and keeps a title that fits on one line', () => {
      const fit = fitSpineTitle({ ...base, width: 51, title: 'Middlemarch', author: 'George Eliot' });
      expect(fit.lines).toEqual(['Middlemarch']);
      expect(fit.titleSize).toBe(13);
    });

    it('never wraps a spine too narrow for two 8 px lines', () => {
      const fit = fitSpineTitle({ ...base, width: 24, title: 'The Brothers Karamazov', author: '' });
      expect(fit.lines).toHaveLength(1);
    });
  });
});

describe('splitTitle', () => {
  it('splits where the longer line is shortest', () => {
    expect(splitTitle('The Brothers Karamazov')).toEqual(['The Brothers', 'Karamazov']);
    expect(splitTitle('Twenty Thousand Leagues Under the Seas')).toEqual(['Twenty Thousand', 'Leagues Under the Seas']);
  });

  it('returns null for a single word', () => {
    expect(splitTitle('Middlemarch')).toBeNull();
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
