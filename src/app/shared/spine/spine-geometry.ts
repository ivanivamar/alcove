import tokens from '../../../../design/tokens.json';
import { Book, SpineStyle } from '../../core/book';

const SPINE = tokens.spine;

export type SpineDensity = 'comfortable' | 'compact';

/** Width in px: round((16 + pages × 0.034) × scale). */
export function spineWidth(pages: number, scale = 1): number {
  return Math.round((SPINE.widthBase + pages * SPINE.widthPerPage) * scale);
}

/**
 * Height in px, 160–206 at scale 1. Seeded from the book id so a book keeps its height
 * between visits. Compact density multiplies it by 0.85.
 */
export function spineHeight(id: string, scale = 1, density: SpineDensity = 'comfortable'): number {
  const [min, max] = SPINE.heightRange;
  const base = min + (hash(id) % (max - min + 1));
  const factor = density === 'compact' ? SPINE.densityCompact : 1;
  return Math.round(base * scale * factor);
}

/** FNV-1a, 32 bit. Stable across sessions and platforms. */
function hash(text: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

export function isCapsStyle(style: SpineStyle): boolean {
  return (SPINE.capsStyles as readonly string[]).includes(style);
}

/** Length along the spine taken by the head decoration (foil rules, band, numeral). */
export function headReserve(style: SpineStyle, height: number): number {
  switch (style) {
    case 'cloth':
      return SPINE.headReserve.cloth;
    case 'series':
      return SPINE.headReserve.series;
    case 'band':
      return Math.round(height * SPINE.bandShare);
    default:
      return 0;
  }
}

export interface SpineFitInput {
  readonly title: string;
  readonly author: string;
  readonly style: SpineStyle;
  readonly width: number;
  readonly height: number;
}

export interface SpineFit {
  readonly titleSize: number;
  readonly authorSize: number;
  readonly showAuthor: boolean;
  /** The title as rendered: one line, or two side by side on a wide spine. */
  readonly lines: readonly string[];
  /** True when even the 8 px floor doesn't fit; the title is then cut with an ellipsis. */
  readonly truncated: boolean;
}

/**
 * Fits the vertical title (and author) into the spine's free length.
 * The size starts at the style's base, capped at 0.56 × width and never below 8 px.
 * When title and author don't fit together, the author goes first; only then does the title shrink.
 * A spine wide enough for two lines of at least 8 px may wrap the title onto two lines
 * instead, when that keeps it larger than one shrunk line (or keeps it from being cut).
 */
export function fitSpineTitle({ title, author, style, width, height }: SpineFitInput): SpineFit {
  const min = SPINE.minType;
  const factor = isCapsStyle(style) ? SPINE.charWidth.caps : SPINE.charWidth.serif;
  const available = height - SPINE.padHead - SPINE.padFoot - headReserve(style, height);
  const length = (text: string, size: number) => text.length * size * factor;
  const authorSizeFor = (size: number) => Math.max(min, halfPx(size * SPINE.authorScale));

  const size = Math.max(min, halfPx(Math.min(SPINE.baseType[style], width * SPINE.maxTypeToWidth)));
  const authorSize = authorSizeFor(size);

  if (author && length(title, size) + SPINE.gap + length(author, authorSize) <= available) {
    return { titleSize: size, authorSize, showAuthor: true, lines: [title], truncated: false };
  }
  if (length(title, size) <= available) {
    return { titleSize: size, authorSize, showAuthor: false, lines: [title], truncated: false };
  }

  const shrunk = Math.max(min, halfPx(available / (title.length * factor)));
  const shrunkCut = length(title, shrunk) > available;

  // Two lines must fit across the spine, inside the side padding.
  const twoLineCap = halfPx((width - 2 * SPINE.padSide) / (2 * SPINE.lineHeight));
  const split = splitTitle(title);
  if (split && twoLineCap >= min) {
    const longest = split[0].length > split[1].length ? split[0] : split[1];
    const twoLine = Math.max(min, halfPx(Math.min(size, twoLineCap, available / (longest.length * factor))));
    if (twoLine > shrunk || shrunkCut) {
      return {
        titleSize: twoLine,
        authorSize: authorSizeFor(twoLine),
        showAuthor: false,
        lines: split,
        truncated: length(longest, twoLine) > available,
      };
    }
  }

  return {
    titleSize: shrunk,
    authorSize: authorSizeFor(shrunk),
    showAuthor: false,
    lines: [title],
    truncated: shrunkCut,
  };
}

/** Splits at the word break that makes the longer line shortest. Null for a single word. */
export function splitTitle(title: string): [string, string] | null {
  const words = title.trim().split(/\s+/);
  if (words.length < 2) return null;
  let best: [string, string] | null = null;
  for (let i = 1; i < words.length; i++) {
    const pair: [string, string] = [words.slice(0, i).join(' '), words.slice(i).join(' ')];
    const longer = Math.max(pair[0].length, pair[1].length);
    if (!best || longer < Math.max(best[0].length, best[1].length)) best = pair;
  }
  return best;
}

/** Rounds down to the nearest half pixel so a fitted size never overflows. */
function halfPx(size: number): number {
  return Math.floor(size * 2) / 2;
}

/** "{title} by {author}, {pages} pages, {status}" (spec §4.1). Offline state is part of the status. */
export function spineLabel(book: Book): string {
  return `${book.title} by ${book.author}, ${book.pages} pages, ${statusText(book)}`;
}

function statusText(book: Book): string {
  const parts: string[] = [];
  switch (book.status) {
    case 'new':
      parts.push('new');
      break;
    case 'to-read':
      parts.push('to read');
      break;
    case 'reading':
      parts.push(`reading, ${Math.round(book.progress * 100)}% read`);
      break;
    case 'finished':
      parts.push('finished');
      break;
  }
  if (book.offline.kind === 'downloading') {
    parts.push(`downloading, ${Math.round(book.offline.progress * 100)}%`);
  } else if (book.offline.kind === 'not-on-device') {
    parts.push('not on this device');
  }
  return parts.join(', ');
}
