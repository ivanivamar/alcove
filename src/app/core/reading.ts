import tokens from '../../../design/tokens.json';
import { Book } from './book';

const PAGES_PER_MINUTE = tokens.reading.pagesPerMinute;

/**
 * Minutes left in a book at --alc-reading-pages-per-minute. Under an hour it is rounded to the
 * minute, and never shows 0 while any pages are left. From an hour up it is rounded to 10
 * minutes, since nobody plans their evening to the minute.
 */
export function minutesLeft(pages: number, progress: number): number {
  return minutesFor(pages * (1 - Math.min(1, Math.max(0, progress))));
}

function minutesFor(pagesLeft: number): number {
  if (!(pagesLeft > 0)) return 0;
  const minutes = pagesLeft / PAGES_PER_MINUTE;
  if (minutes < 60) return Math.max(1, Math.round(minutes));
  return Math.round(minutes / 10) * 10;
}

/** Where the reader is in the text as laid out: pages from 0, and where each chapter starts. */
export interface LaidOutPosition {
  readonly page: number;
  readonly pageCount: number;
  readonly chapterStarts: readonly number[];
}

/**
 * Minutes left in the chapter on screen, rounded like `minutesLeft`. Laid-out pages change size
 * with the window and the type, so the pages left are taken as a share of the book and counted
 * in the book's own pages, at the same speed as the time left in the book.
 */
export function minutesLeftInChapter(
  pages: number,
  { page, pageCount, chapterStarts }: LaidOutPosition,
): number {
  if (pageCount < 1) return 0;
  const at = Math.min(pageCount - 1, Math.max(0, page));
  const end = chapterStarts.find((start) => start > at) ?? pageCount;
  return minutesFor(((end - at) / pageCount) * pages);
}

/** "12 min left in chapter". */
export function timeLeftInChapter(book: Pick<Book, 'pages'>, position: LaidOutPosition): string {
  return `${formatTimeLeft(minutesLeftInChapter(book.pages, position))} in chapter`;
}

/** "3 h 20 min left", "3 h left" or "45 min left". */
export function formatTimeLeft(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (!h) return `${m} min left`;
  return m ? `${h} h ${m} min left` : `${h} h left`;
}

/** The book's time left, formatted. */
export function timeLeft(book: Pick<Book, 'pages' | 'progress'>): string {
  return formatTimeLeft(minutesLeft(book.pages, book.progress));
}

/** Share read as a whole percentage, 0–100. */
export function percentRead(progress: number): number {
  return Math.round(Math.min(1, Math.max(0, progress)) * 100);
}

/** The books being read, most recently opened first. Books never opened go last. */
export function currentlyReading(books: readonly Book[]): Book[] {
  return books
    .filter((book) => book.status === 'reading')
    .sort((a, b) => (b.lastOpened ?? '').localeCompare(a.lastOpened ?? ''));
}
