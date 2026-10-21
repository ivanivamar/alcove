import { visibleRows } from './shelf-rows-scroll-strategy';

describe('visibleRows', () => {
  // Three cabinet rows: 0–300, 300–800 (a wrapped shelf), 800–1100.
  const offsets = [0, 300, 800, 1100];

  it('renders the rows overlapping the viewport', () => {
    expect(visibleRows(offsets, 0, 250, 0)).toEqual({ start: 0, end: 1 });
    expect(visibleRows(offsets, 350, 500, 0)).toEqual({ start: 1, end: 3 });
  });

  it('adds the buffer either side', () => {
    expect(visibleRows(offsets, 850, 100, 100)).toEqual({ start: 1, end: 3 });
  });

  it('clamps above and below the bookcase', () => {
    expect(visibleRows(offsets, -500, 200, 0)).toEqual({ start: 0, end: 1 });
    expect(visibleRows(offsets, 5000, 200, 0)).toEqual({ start: 2, end: 3 });
  });

  it('renders nothing with no rows', () => {
    expect(visibleRows([0], 0, 500)).toEqual({ start: 0, end: 0 });
  });
});
