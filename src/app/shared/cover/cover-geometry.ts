import tokens from '../../../../design/tokens.json';

const COVER = tokens.cover;

/** Height in px of a 2:3 cover `width` px wide. */
export function coverHeight(width: number): number {
  return Math.round(width * COVER.heightPerWidth);
}

export interface CoverFallbackLayout {
  /** Padding inside the cover edge, and the gap between mark, title and author. */
  readonly pad: number;
  readonly gap: number;
  /** The arch mark's size. */
  readonly mark: number;
  readonly titleSize: number;
  /** The title, already broken into lines that fit the box. */
  readonly lines: readonly string[];
  readonly authorSize: number;
}

/**
 * Lays out the fallback cover (spec §4.2): the arch mark at the head, the title in the middle,
 * the author at the foot. The title takes the largest size, up to --alc-cover-type-max × width,
 * at which every word fits the measure and every line fits the box. If even the minimum size
 * doesn't fit, long words are hyphenated and the last line that fits ends in an ellipsis, so
 * the title never overflows.
 */
export function layoutCoverFallback(title: string, width: number): CoverFallbackLayout {
  const pad = Math.round(width * COVER.pad);
  const gap = Math.round(pad / 2);
  const mark = Math.round(width * COVER.mark);
  const authorSize = Math.max(COVER.minType, Math.round(width * COVER.author));
  const boxWidth = width - 2 * pad;
  const boxHeight =
    coverHeight(width) - 2 * pad - mark - authorSize * COVER.lineHeight - 2 * gap;
  const words = title.trim().split(/\s+/);

  const maxSize = Math.max(COVER.minType, Math.round(width * COVER.typeMax));
  for (let size = maxSize; size >= COVER.minType; size--) {
    const lines = wrapWords(words, maxChars(boxWidth, size), false);
    if (lines && lines.length * size * COVER.lineHeight <= boxHeight) {
      return { pad, gap, mark, titleSize: size, lines, authorSize };
    }
  }

  const size = COVER.minType;
  const chars = maxChars(boxWidth, size);
  const lines = wrapWords(words, chars, true)!;
  const maxLines = Math.max(1, Math.floor(boxHeight / (size * COVER.lineHeight)));
  if (lines.length > maxLines) {
    lines.length = maxLines;
    lines[maxLines - 1] = `${lines[maxLines - 1].slice(0, chars - 1).trimEnd()}…`;
  }
  return { pad, gap, mark, titleSize: size, lines, authorSize };
}

/** Characters that fit `width` px at `size`, by the average Fraunces glyph width. */
function maxChars(width: number, size: number): number {
  return Math.max(2, Math.floor(width / (size * COVER.charWidth)));
}

/**
 * Greedy word wrap to `chars` per line. A word longer than a line returns null, unless
 * `breakLong` is set, when it is hyphenated across lines instead.
 */
function wrapWords(words: readonly string[], chars: number, breakLong: boolean): string[] | null {
  const lines: string[] = [];
  let line = '';
  for (let word of words) {
    if (word.length > chars) {
      if (!breakLong) return null;
      if (line) lines.push(line);
      while (word.length > chars) {
        lines.push(`${word.slice(0, chars - 1)}-`);
        word = word.slice(chars - 1);
      }
      line = word;
      continue;
    }
    const next = line ? `${line} ${word}` : word;
    if (line && next.length > chars) {
      lines.push(line);
      line = word;
    } else {
      line = next;
    }
  }
  if (line) lines.push(line);
  return lines;
}
