import { Book } from '../../core/book';
import { MOCK_BOOKS } from '../../core/mock-books';
import { MOCK_SHELVES } from '../../core/mock-shelves';
import { spineWidth } from '../spine/spine-geometry';
import { bayHeight, layoutShelf, shelfPad, shelfRowHeight, wrapShelf } from './shelf-geometry';

const id = (w: number) => w;

describe('wrapShelf', () => {
  it('keeps everything on one row when spines, gaps and bookend fit', () => {
    // 30 + 2 + 30 + 2 + 30 = 94, plus 2 + 5 for the bookend = 101.
    expect(wrapShelf([30, 30, 30], id, 101)).toEqual([[30, 30, 30]]);
  });

  it('wraps onto further rows in order, counting the 2 px gaps', () => {
    expect(wrapShelf([40, 40, 40, 40, 40], id, 90)).toEqual([[40, 40], [40, 40], [40]]);
    // 40 + 2 + 40 = 82 fits 82; the third spine would need 124.
    expect(wrapShelf([10, 20, 30, 40, 50], id, 70)).toEqual([[10, 20, 30], [40], [50]]);
  });

  it('moves the last spine down a row when the bookend would not fit beside it', () => {
    // 30 + 2 + 30 = 62 fits 66, but the bookend needs 62 + 2 + 5 = 69.
    expect(wrapShelf([30, 30], id, 66)).toEqual([[30], [30]]);
  });

  it('gives a spine wider than the shelf a row of its own', () => {
    expect(wrapShelf([20, 120, 20], id, 100)).toEqual([[20], [120], [20]]);
  });

  it('returns no rows for an empty shelf', () => {
    expect(wrapShelf([], id, 100)).toEqual([]);
  });
});

describe('layoutShelf', () => {
  const books = (pages: number[]): Book[] =>
    pages.map((p, i) => ({ ...MOCK_BOOKS[0], id: `b${i}`, pages: p }));

  it('places spines left to right from the padding, 2 px apart, with the bookend after them', () => {
    const shelf = books([118, 1023]); // 20 px and 51 px
    const { spines, bookend, boards } = layoutShelf(shelf, 300);
    expect(spines.map((s) => s.left)).toEqual([16, 16 + 20 + 2]);
    expect(bookend.left).toBe(16 + 20 + 2 + 51 + 2);
    expect(boards).toEqual([0]);
    expect(spines.every((s) => s.bottom === 16)).toBe(true);
  });

  it('stacks wrapped rows upward from the bottom board', () => {
    const shelf = books(Array(8).fill(1023)); // 51 px each; 5 fit in 300 − 32 = 268
    const layout = layoutShelf(shelf, 300);
    const row = shelfRowHeight();
    expect(layout.boards).toEqual([row, 0]);
    expect(layout.spines.slice(0, 5).every((s) => s.bottom === row + 16)).toBe(true);
    expect(layout.height).toBe(bayHeight(2));
  });

  it('gives an empty shelf one row and puts its bookend at the padding', () => {
    const layout = layoutShelf([], 300);
    expect(layout.spines).toEqual([]);
    expect(layout.boards).toEqual([0]);
    expect(layout.height).toBe(bayHeight(1));
  });

  it('uses 0.75 × the padding and 0.85 × the spine room in compact density', () => {
    expect(shelfPad('compact')).toBe(12);
    expect(shelfRowHeight('compact')).toBe(12 + Math.round(206 * 0.85) + 16);
    expect(layoutShelf(books([118]), 300, 'compact').spines[0].left).toBe(12);
  });
});

describe('MOCK_SHELVES', () => {
  const byId = new Map(MOCK_BOOKS.map((b) => [b.id, b]));

  it('puts every mock book on exactly one shelf', () => {
    const ids = MOCK_SHELVES.flatMap((s) => s.bookIds);
    expect(ids.length).toBe(MOCK_BOOKS.length);
    expect(new Set(ids)).toEqual(new Set(MOCK_BOOKS.map((b) => b.id)));
  });

  it('has an empty shelf and one that wraps in a 1fr bay at 1440 px', () => {
    expect(MOCK_SHELVES.some((s) => s.bookIds.length === 0)).toBe(true);
    // 1440 − 72 rail − 2 × 40 gutters − 2 × 14 panels − 2 × 12 dividers, then 1 / 3.35 of it.
    const bay = Math.floor(((1440 - 72 - 80 - 28 - 24) * 1) / 3.35);
    const long = MOCK_SHELVES.map((s) => s.bookIds.map((i) => byId.get(i)!));
    expect(
      long.some((shelf) => wrapShelf(shelf, (b) => spineWidth(b.pages), bay - 32).length > 1),
    ).toBe(true);
  });
});
