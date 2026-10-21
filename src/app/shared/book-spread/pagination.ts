import tokens from '../../../../design/tokens.json';

/**
 * Page arithmetic for the reader, independent of how pages are laid out. Pages are numbered
 * from 0. A view is what is on screen at once: one page, or two in a spread, where the left
 * page always has an even number. A position is always the first page of its view.
 */

const EDGE_LAYERS = tokens.reader.edgeLayers;

export interface PageEdges {
  /** 1 px lines on the read side (left). */
  readonly read: number;
  /** 1 px lines on the unread side (right). */
  readonly unread: number;
}

/** The page-edge stacks: max(1, round(read × 8)) layers on the read side, the rest on the other. */
export function pageEdgeLayers(read: number): PageEdges {
  const share = Number.isFinite(read) ? Math.min(1, Math.max(0, read)) : 0;
  const layers = Math.max(1, Math.round(share * EDGE_LAYERS));
  return { read: layers, unread: EDGE_LAYERS - layers };
}

/** The page clamped to the book, 0 for a book with no pages. */
export function clampPage(page: number, pageCount: number): number {
  if (pageCount < 1 || !Number.isFinite(page)) return 0;
  return Math.min(pageCount - 1, Math.max(0, Math.floor(page)));
}

/** The first page of the view showing `page`. */
export function viewStart(page: number, pageCount: number, perView: number): number {
  const clamped = clampPage(page, pageCount);
  return clamped - (clamped % perView);
}

/** The next view's first page, or null on the last view. */
export function nextView(page: number, pageCount: number, perView: number): number | null {
  const next = viewStart(page, pageCount, perView) + perView;
  return next < pageCount ? next : null;
}

/** The previous view's first page, or null on the first view. */
export function previousView(page: number, pageCount: number, perView: number): number | null {
  const start = viewStart(page, pageCount, perView);
  return start > 0 ? start - perView : null;
}

/** Share of the book behind a page: 0 on the first page, 1 on the last. */
export function progressForPage(page: number, pageCount: number): number {
  return pageCount > 1 ? clampPage(page, pageCount) / (pageCount - 1) : 0;
}

/**
 * Where to open for a share read: the nearest page, then the start of its view, so a spread
 * never shows a page past the saved position.
 */
export function pageForProgress(progress: number, pageCount: number, perView: number): number {
  const share = Number.isFinite(progress) ? Math.min(1, Math.max(0, progress)) : 0;
  return viewStart(Math.round(share * (pageCount - 1)), pageCount, perView);
}

/** The chapter a page belongs to: the last one starting on or before it, or -1 before the first. */
export function chapterAt(page: number, chapterStarts: readonly number[]): number {
  let chapter = -1;
  chapterStarts.forEach((start, i) => {
    if (start <= page) chapter = i;
  });
  return chapter;
}
