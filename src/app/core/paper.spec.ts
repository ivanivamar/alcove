import tokens from '../../../design/tokens.json';
import { DEFAULT_PAPER, PAPERS, isPaper } from './paper';

/** WCAG 2.x relative luminance of #rrggbb, darkened by a black overlay of `shade` alpha. */
function luminance(hex: string, shade = 0): number {
  const [r, g, b] = [1, 3, 5].map((i) => {
    const c = (parseInt(hex.slice(i, i + 2), 16) / 255) * (1 - shade);
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function contrast(a: number, b: number): number {
  return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
}

describe('papers', () => {
  it('defaults to Slate, as the brief and tokens.json say (spec §9)', () => {
    expect(DEFAULT_PAPER).toBe('slate');
    expect(PAPERS).toEqual(['paper', 'sepia', 'slate', 'night']);
    expect(isPaper('sepia')).toBe(true);
    expect(isPaper('vellum')).toBe(false);
  });

  for (const name of PAPERS) {
    const paper = tokens.paper[name];

    it(`${name}: the stated text contrast is true`, () => {
      expect(contrast(luminance(paper.ink), luminance(paper.page))).toBeCloseTo(paper.contrast, 1);
    });

    it(`${name}: ink and muted ink keep 4.5:1 under the darkest page shading`, () => {
      // The falloff is darkest in the bottom-right corner; text never reaches the gutter shade.
      const page = luminance(paper.page, tokens.reader.falloff);
      expect(contrast(luminance(paper.ink), page)).toBeGreaterThanOrEqual(4.5);
      expect(contrast(luminance(paper.muted), page)).toBeGreaterThanOrEqual(4.5);
      // The drop cap is large text: 3:1.
      expect(contrast(luminance(paper.accent), page)).toBeGreaterThanOrEqual(3);
    });
  }
});
