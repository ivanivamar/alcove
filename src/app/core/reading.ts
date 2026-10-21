import tokens from '../../../design/tokens.json';
import { Book } from './book';

const PAGES_PER_MINUTE = tokens.reading.pagesPerMinute;

/**
 * Minutes left in a book at --alc-reading-pages-per-minute. Under an hour it is rounded to the
 * minute, and never shows 0 while any pages are left. From an hour up it is rounded to 10
 * minutes, since nobody plans their evening to the minute.
 */
export function minutesLeft(pages: number, progress: number): number {
  const pagesLeft = pages * (1 - Math.min(1, Math.max(0, progress)));
  if (pagesLeft <= 0) return 0;
  const minutes = pagesLeft / PAGES_PER_MINUTE;
  if (minutes < 60) return Math.max(1, Math.round(minutes));
  return Math.round(minutes / 10) * 10;
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
