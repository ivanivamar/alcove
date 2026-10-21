import {
  chapterAt,
  clampPage,
  nextView,
  pageEdgeLayers,
  pageForProgress,
  previousView,
  progressForPage,
  viewStart,
} from './pagination';

describe('pageEdgeLayers', () => {
  it('puts max(1, round(read × 8)) layers on the read side and the rest on the unread side', () => {
    expect(pageEdgeLayers(0)).toEqual({ read: 1, unread: 7 });
    expect(pageEdgeLayers(0.05)).toEqual({ read: 1, unread: 7 });
    expect(pageEdgeLayers(0.18)).toEqual({ read: 1, unread: 7 });
    expect(pageEdgeLayers(0.2)).toEqual({ read: 2, unread: 6 });
    expect(pageEdgeLayers(0.5)).toEqual({ read: 4, unread: 4 });
    expect(pageEdgeLayers(0.9)).toEqual({ read: 7, unread: 1 });
    expect(pageEdgeLayers(1)).toEqual({ read: 8, unread: 0 });
  });

  it('never has more than 8 layers in all, whatever it is given', () => {
    for (const read of [-1, 1.5, Number.NaN, Number.POSITIVE_INFINITY]) {
      const { read: left, unread } = pageEdgeLayers(read);
      expect(left).toBeGreaterThanOrEqual(1);
      expect(left + unread).toBe(8);
    }
  });
});

describe('views', () => {
  it('starts a spread on an even page', () => {
    expect(viewStart(5, 10, 2)).toBe(4);
    expect(viewStart(4, 10, 2)).toBe(4);
    expect(viewStart(5, 10, 1)).toBe(5);
  });

  it('clamps to the book', () => {
    expect(clampPage(-3, 10)).toBe(0);
    expect(clampPage(42, 10)).toBe(9);
    expect(clampPage(3, 0)).toBe(0);
    expect(viewStart(42, 9, 2)).toBe(8);
  });

  it('turns a view at a time and stops at the first and last', () => {
    expect(nextView(0, 10, 1)).toBe(1);
    expect(nextView(0, 10, 2)).toBe(2);
    expect(nextView(9, 10, 1)).toBeNull();
    expect(nextView(8, 10, 2)).toBeNull();
    // An odd count ends on a spread whose right page is blank.
    expect(nextView(6, 9, 2)).toBe(8);
    expect(nextView(8, 9, 2)).toBeNull();
    expect(previousView(1, 10, 1)).toBe(0);
    expect(previousView(5, 10, 2)).toBe(2);
    expect(previousView(0, 10, 1)).toBeNull();
    expect(previousView(1, 10, 2)).toBeNull();
  });
});

describe('positions', () => {
  it('opens at the nearest page to the share read, then the start of its view', () => {
    expect(pageForProgress(0, 25, 1)).toBe(0);
    expect(pageForProgress(0.18, 25, 1)).toBe(4); // 4.32
    expect(pageForProgress(0.67, 23, 1)).toBe(15); // 14.74
    expect(pageForProgress(0.67, 23, 2)).toBe(14); // never shows a page past it
    expect(pageForProgress(1, 25, 2)).toBe(24);
    expect(pageForProgress(1.4, 25, 1)).toBe(24);
  });

  it('gives the share behind a page, which maps back to the same page', () => {
    expect(progressForPage(0, 25)).toBe(0);
    expect(progressForPage(24, 25)).toBe(1);
    expect(progressForPage(0, 1)).toBe(0);
    for (let page = 0; page < 25; page++) {
      expect(pageForProgress(progressForPage(page, 25), 25, 1)).toBe(page);
    }
  });

  it('finds the chapter a page belongs to', () => {
    expect(chapterAt(0, [0, 12])).toBe(0);
    expect(chapterAt(11, [0, 12])).toBe(0);
    expect(chapterAt(12, [0, 12])).toBe(1);
    expect(chapterAt(3, [2, 12])).toBe(0);
    expect(chapterAt(1, [2, 12])).toBe(-1);
  });
});
