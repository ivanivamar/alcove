import { InjectionToken } from '@angular/core';

/** Where the text fell once laid out. */
export interface PageLayout {
  readonly pageCount: number;
  /** The page each chapter starts on, in chapter order. */
  readonly chapterStarts: readonly number[];
}

/**
 * Lays the reader's text out into pages and moves between them. The spread only talks to this,
 * so a scroll mode can be added as a second implementation without touching page turns,
 * positions or focus.
 *
 * Elements in the flow marked `data-block` are the units focus can land on (paragraphs and
 * headings); `data-chapter-start` marks each chapter's first element; `data-flow-end` is an
 * empty element after the text.
 */
export interface Paginator {
  /** Lays the text out `perView` pages at a time. Call again after anything that moves the text. */
  measure(perView: number): PageLayout;
  /** Brings the page to the start of the viewport, without animation. */
  show(page: number): void;
  /** The page at the start of the viewport, which the browser can move to reveal a find match. */
  shownPage(): number;
  /** The first block with any of its lines on the page: the "first line" focus goes to. */
  firstBlockOn(page: number): HTMLElement | null;
}

export type PaginatorFactory = (viewport: HTMLElement, flow: HTMLElement) => Paginator;

/**
 * The default: CSS columns. The flow is a multi-column box exactly as tall as a page's text area
 * and as wide as the view, so the text overflows into further columns to the right, one per page,
 * and the viewport scrolls (overflow hidden) to show a view. The column gap is the inner and
 * outer page margins together.
 */
export const columnPaginator: PaginatorFactory = (viewport, flow) => {
  let stride = 0;

  const pageAtX = (x: number) => (stride > 0 ? Math.max(0, Math.floor((x + 1) / stride)) : 0);
  const left = (rect: DOMRect) => rect.left - flow.getBoundingClientRect().left;

  return {
    measure(perView) {
      const gap = parseFloat(getComputedStyle(flow).columnGap) || 0;
      stride = (viewport.clientWidth + gap) / perView;
      if (stride <= 0) return { pageCount: 1, chapterStarts: [] };
      const end = flow.querySelector<HTMLElement>('[data-flow-end]');
      const pageCount = end ? Math.max(1, pageAtX(left(end.getBoundingClientRect()))) : 1;
      const chapterStarts = Array.from(
        flow.querySelectorAll<HTMLElement>('[data-chapter-start]'),
        (el) => pageAtX(left(el.getBoundingClientRect())),
      );
      return { pageCount, chapterStarts };
    },
    show(page) {
      viewport.scrollLeft = Math.round(page * stride);
    },
    shownPage() {
      return stride > 0 ? Math.round(viewport.scrollLeft / stride) : 0;
    },
    firstBlockOn(page) {
      for (const block of flow.querySelectorAll<HTMLElement>('[data-block]')) {
        for (const rect of block.getClientRects()) {
          const at = pageAtX(left(rect));
          if (at === page) return block;
          if (at > page) return null;
        }
      }
      return null;
    },
  };
};

export const ALC_PAGINATOR = new InjectionToken<PaginatorFactory>('ALC_PAGINATOR', {
  providedIn: 'root',
  factory: () => columnPaginator,
});
