import tokens from '../../../../design/tokens.json';
import { MOCK_BOOKS } from '../../core/mock-books';
import { coverHeight, layoutCoverFallback } from './cover-geometry';

const { charWidth, lineHeight, minType } = tokens.cover;

/** The title box the layout promises to stay inside. */
function box(width: number) {
  const l = layoutCoverFallback('x', width);
  return {
    width: width - 2 * l.pad,
    height: coverHeight(width) - 2 * l.pad - l.mark - l.authorSize * lineHeight - 2 * l.gap,
  };
}

function fits(title: string, width: number) {
  const { lines, titleSize } = layoutCoverFallback(title, width);
  const { width: w, height: h } = box(width);
  return (
    lines.length * titleSize * lineHeight <= h &&
    lines.every((line) => line.length * titleSize * charWidth <= w)
  );
}

describe('coverHeight', () => {
  it('is 2:3', () => {
    expect(coverHeight(104)).toBe(156);
    expect(coverHeight(80)).toBe(120);
    expect(coverHeight(75)).toBe(113);
  });
});

describe('layoutCoverFallback', () => {
  it('sets a short title large, on one line', () => {
    const l = layoutCoverFallback('Emma', 104);
    expect(l.lines).toEqual(['Emma']);
    expect(l.titleSize).toBe(Math.round(104 * tokens.cover.typeMax));
  });

  it('wraps by word and shrinks until every word fits the measure', () => {
    const l = layoutCoverFallback('Barchester Towers', 80);
    expect(l.lines).toEqual(['Barchester', 'Towers']);
    expect(l.titleSize).toBeLessThan(Math.round(80 * tokens.cover.typeMax));
  });

  it('keeps every mock title inside the box at every ledge width', () => {
    for (const width of [68, 75, 80, 88, 104]) {
      for (const book of MOCK_BOOKS) {
        expect(fits(book.title, width), `${book.title} at ${width}`).toBe(true);
      }
    }
  });

  it('hyphenates and truncates rather than overflowing at the minimum size', () => {
    const title = 'Supercalifragilisticexpialidocious '.repeat(8);
    const l = layoutCoverFallback(title, 68);
    expect(l.titleSize).toBe(minType);
    expect(l.lines[0].endsWith('-')).toBe(true);
    expect(l.lines.at(-1)!.endsWith('…')).toBe(true);
    expect(fits(title, 68)).toBe(true);
  });

  it('never sets the author below the minimum size', () => {
    expect(layoutCoverFallback('Emma', 68).authorSize).toBe(minType);
    expect(layoutCoverFallback('Emma', 104).authorSize).toBe(9);
  });
});
