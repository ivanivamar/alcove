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
  /** True when even the 8 px floor doesn't fit; the title is then cut with an ellipsis. */
  readonly truncated: boolean;
}

/**
 * Fits the vertical title (and author) into the spine's free length.
 * The size starts at the style's base, capped at 0.56 × width and never below 8 px.
 * When title and author don't fit together, the author goes first; only then does the title shrink.
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
    return { titleSize: size, authorSize, showAuthor: true, truncated: false };
  }
  if (length(title, size) <= available) {
    return { titleSize: size, authorSize, showAuthor: false, truncated: false };
  }
  const shrunk = Math.max(min, halfPx(available / (title.length * factor)));
  return {
    titleSize: shrunk,
    authorSize: authorSizeFor(shrunk),
    showAuthor: false,
    truncated: length(title, shrunk) > available,
  };
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
