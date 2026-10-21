import tokens from '../../../../design/tokens.json';
import { Book } from '../../core/book';
import { SpineDensity, spineWidth } from '../spine/spine-geometry';

const SHELF = tokens.shelf;
const GAP = tokens.spine.shelfGap;

/** Bay padding and the head room above each row of spines. Compact multiplies it by 0.75 (spec §2). */
export function shelfPad(density: SpineDensity = 'comfortable'): number {
  return density === 'compact' ? SHELF.pad * SHELF.densityCompact : SHELF.pad;
}

/**
 * One row of spines: head room, the tallest spine there can be, then the board. Every row is the
 * same height, so boards line up across the bays of a cabinet row whatever books they hold.
 */
export function shelfRowHeight(density: SpineDensity = 'comfortable'): number {
  const factor = density === 'compact' ? tokens.spine.densityCompact : 1;
  return shelfPad(density) + Math.round(tokens.spine.heightRange[1] * factor) + SHELF.board.height;
}

/** A bay's height: the label, then its rows. An empty bay still has one row. */
export function bayHeight(rowCount: number, density: SpineDensity = 'comfortable'): number {
  return shelfPad(density) + SHELF.labelLine + Math.max(1, rowCount) * shelfRowHeight(density);
}

/**
 * Splits spines into rows no wider than `maxWidth`, keeping their order. Spines sit
 * --alc-shelf-spine-gap apart and the last row also has to hold the bookend. A spine wider than
 * the shelf gets a row to itself rather than being dropped.
 */
export function wrapShelf<T>(
  items: readonly T[],
  widthOf: (item: T) => number,
  maxWidth: number,
): T[][] {
  const rows: T[][] = [];
  let row: T[] = [];
  let used = 0;
  for (const item of items) {
    const width = widthOf(item);
    const next = row.length ? used + GAP + width : width;
    if (row.length && next > maxWidth) {
      rows.push(row);
      row = [item];
      used = width;
    } else {
      row.push(item);
      used = next;
    }
  }
  // The bookend stands after the last spine; if it doesn't fit, that spine moves down a row.
  if (row.length > 1 && used + GAP + SHELF.bookend.width > maxWidth) {
    const last = row.pop()!;
    rows.push(row);
    row = [last];
  }
  if (row.length) rows.push(row);
  return rows;
}

export interface PlacedSpine {
  readonly book: Book;
  /** From the bay's left edge, px. */
  readonly left: number;
  /** From the bay's bottom edge to the foot of the spine, px. */
  readonly bottom: number;
}

export interface ShelfLayout {
  readonly spines: readonly PlacedSpine[];
  /** Bottom edge of each row's board, from the bay's bottom edge, top row first. */
  readonly boards: readonly number[];
  readonly bookend: { readonly left: number; readonly bottom: number };
  readonly height: number;
}

/** Places a shelf's spines, boards and bookend in a bay `bayWidth` px wide. */
export function layoutShelf(
  books: readonly Book[],
  bayWidth: number,
  density: SpineDensity = 'comfortable',
): ShelfLayout {
  const pad = shelfPad(density);
  const rowHeight = shelfRowHeight(density);
  const width = (book: Book) => spineWidth(book.pages);
  const rows = wrapShelf(books, width, bayWidth - 2 * pad);
  const count = Math.max(1, rows.length);

  const boards = Array.from({ length: count }, (_, r) => (count - 1 - r) * rowHeight);
  const spines: PlacedSpine[] = [];
  let end = pad;
  rows.forEach((row, r) => {
    let left = pad;
    for (const book of row) {
      spines.push({ book, left, bottom: boards[r] + SHELF.board.height });
      left += width(book) + GAP;
    }
    end = left;
  });

  return {
    spines,
    boards,
    bookend: { left: end, bottom: SHELF.board.height },
    height: bayHeight(count, density),
  };
}
