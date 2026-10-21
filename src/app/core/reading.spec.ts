import { Book } from './book';
import { MOCK_BOOKS } from './mock-books';
import { currentlyReading, formatTimeLeft, minutesLeft, percentRead, timeLeft } from './reading';

describe('minutesLeft', () => {
  it('divides the pages left by 1.3 pages a minute', () => {
    // 100 pages × 0.5 left = 50 pages, 38.46 min.
    expect(minutesLeft(100, 0.5)).toBe(38);
    expect(minutesLeft(39, 0)).toBe(30);
  });

  it('rounds to 10 minutes from an hour up', () => {
    // Middlemarch: 880 × 0.82 = 721.6 pages, 555.1 min.
    expect(minutesLeft(880, 0.18)).toBe(560);
    // 104 pages = 80 min exactly; 110 pages = 84.6 min.
    expect(minutesLeft(104, 0)).toBe(80);
    expect(minutesLeft(110, 0)).toBe(80);
  });

  it('never says 0 while pages are left, and 0 once finished', () => {
    expect(minutesLeft(300, 0.999)).toBe(1);
    expect(minutesLeft(300, 1)).toBe(0);
  });

  it('clamps progress to 0–1', () => {
    expect(minutesLeft(13, -1)).toBe(10);
    expect(minutesLeft(13, 2)).toBe(0);
  });
});

describe('formatTimeLeft', () => {
  it('shows hours and minutes', () => {
    expect(formatTimeLeft(200)).toBe('3 h 20 min left');
    expect(formatTimeLeft(550)).toBe('9 h 10 min left');
  });

  it('shows only minutes under an hour', () => {
    expect(formatTimeLeft(45)).toBe('45 min left');
    expect(formatTimeLeft(1)).toBe('1 min left');
  });

  it('drops the minutes on the hour', () => {
    expect(formatTimeLeft(60)).toBe('1 h left');
    expect(formatTimeLeft(180)).toBe('3 h left');
  });

  it('formats a book directly', () => {
    expect(timeLeft({ pages: 880, progress: 0.18 })).toBe('9 h 20 min left');
  });
});

describe('percentRead', () => {
  it('rounds to a whole percent', () => {
    expect(percentRead(0.18)).toBe(18);
    expect(percentRead(0.675)).toBe(68);
    expect(percentRead(1.2)).toBe(100);
  });
});

describe('currentlyReading', () => {
  const book = (id: string, status: Book['status'], lastOpened?: string): Book => ({
    ...MOCK_BOOKS[0],
    id,
    status,
    lastOpened,
  });

  it('keeps only books being read, most recently opened first', () => {
    const books = [
      book('a', 'reading', '2026-10-01T10:00:00Z'),
      book('b', 'finished', '2026-10-21T10:00:00Z'),
      book('c', 'reading'),
      book('d', 'reading', '2026-10-20T10:00:00Z'),
    ];
    expect(currentlyReading(books).map((b) => b.id)).toEqual(['d', 'a', 'c']);
  });

  it('returns nothing when nothing is being read', () => {
    expect(currentlyReading([book('a', 'to-read'), book('b', 'finished')])).toEqual([]);
  });

  it('gives every mock book being read a lastOpened date', () => {
    const reading = currentlyReading(MOCK_BOOKS);
    expect(reading.length).toBeGreaterThan(0);
    expect(reading.every((b) => b.lastOpened)).toBe(true);
    expect(reading[0].id).toBe('bk-middlemarch');
  });
});
