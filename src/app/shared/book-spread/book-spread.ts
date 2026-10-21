import { BreakpointObserver } from '@angular/cdk/layout';
import {
  ChangeDetectionStrategy,
  Component,
  DOCUMENT,
  DestroyRef,
  ElementRef,
  afterRenderEffect,
  computed,
  effect,
  inject,
  input,
  model,
  output,
  signal,
  untracked,
  viewChild,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { map } from 'rxjs';
import tokens from '../../../../design/tokens.json';
import { Book } from '../../core/book';
import { BookContent } from '../../core/book-content';
import { DEFAULT_PAPER, Paper } from '../../core/paper';
import { ChapterText } from './chapter-text';
import {
  chapterAt,
  nextView,
  pageEdgeLayers,
  pageForProgress,
  previousView,
  progressForPage,
  viewStart,
} from './pagination';
import { ALC_PAGINATOR, PageLayout, Paginator } from './paginator';

const SPREAD = `(min-width: ${tokens.breakpoint.spread}px)`;
const DESKTOP = `(min-width: ${tokens.breakpoint.desktop}px)`;
const TABLET = `(min-width: ${tokens.breakpoint.tablet}px)`;

type Screen = 'phone' | 'tablet' | 'desktop';

/** Keys that turn pages. Up and Down are left for scroll mode. */
const TURN_KEYS: Readonly<Record<string, 1 | -1>> = {
  ArrowRight: 1,
  PageDown: 1,
  ArrowLeft: -1,
  PageUp: -1,
};

/** Where focus belongs to something else that uses these keys. */
const OWNS_KEYS =
  'input, textarea, select, [contenteditable]:not([contenteditable="false"]), [role="slider"]';

export interface ReadingPosition {
  /** The first page on screen, from 0. */
  readonly page: number;
  readonly pageCount: number;
  /** Share of the book behind that page, 0–1. */
  readonly progress: number;
}

/**
 * The reader's open book (spec §4.5): cloth boards in the book's own spine colour, page-edge
 * stacks, and the text laid out into pages with running heads and folios. Two pages side by side
 * from --alc-bp-spread, one below it.
 *
 * Page turns: the left and right thirds of the pages are buttons, plus the arrow keys and Page
 * Up/Down. The middle third is left free for the reader controls, and nothing here stops a
 * pointer from swiping.
 */
@Component({
  selector: 'alc-book-spread',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ChapterText],
  templateUrl: './book-spread.html',
  styleUrl: './book-spread.css',
  host: {
    '[attr.data-paper]': 'paper()',
    '[class.phone]': "screen() === 'phone'",
    '[class.tablet]': "screen() === 'tablet'",
    '[class.two-up]': 'perView() === 2',
    '(document:keydown)': 'onKeydown($event)',
  },
})
export class BookSpread {
  readonly book = input.required<Book>();
  /** The book's text. Null shows that the text isn't available yet. */
  readonly content = input<BookContent | null>(null);
  readonly paper = input<Paper>(DEFAULT_PAPER);
  /**
   * The first page on screen, from 0. Leave it null to open at the book's saved progress; the
   * spread then fills it in, and keeps it up to date as pages turn.
   */
  readonly page = model<number | null>(null);
  /** Every change of position, including the first, for the parent to save. */
  readonly positionChange = output<ReadingPosition>();

  private readonly document = inject(DOCUMENT);
  private readonly paginatorFactory = inject(ALC_PAGINATOR);
  private readonly breakpoints = inject(BreakpointObserver);

  private readonly viewport = viewChild.required<ElementRef<HTMLElement>>('viewport');
  private readonly flow = viewChild.required<ElementRef<HTMLElement>>('flow');
  private readonly pages = viewChild.required<ElementRef<HTMLElement>>('pages');
  private paginator: Paginator | null = null;
  /**
   * The reading position as a share of the book. Reflows (fonts arriving, a resize, one page or
   * two) go back to it, so repeated layouts never drift. Only a turn, the parent or the browser
   * scrolling to a find match moves it.
   */
  private anchor: number | null = null;
  /** The page as of the last layout or turn; a different `page()` means the parent moved it. */
  private settled: number | null = null;

  private readonly matched = toSignal(
    this.breakpoints.observe([TABLET, DESKTOP, SPREAD]).pipe(map(() => this.currentScreen())),
    { initialValue: this.currentScreen() },
  );
  protected readonly screen = computed(() => this.matched().screen);
  protected readonly perView = computed(() => (this.matched().spread ? 2 : 1));

  private readonly layout = signal<PageLayout | null>(null, {
    equal: (a, b) =>
      a?.pageCount === b?.pageCount && a?.chapterStarts.join() === b?.chapterStarts.join(),
  });
  protected readonly pageCount = computed(() => this.layout()?.pageCount ?? 0);

  /** The first page on screen, always the start of a view. */
  protected readonly current = computed(() =>
    viewStart(this.page() ?? 0, this.pageCount(), this.perView()),
  );
  protected readonly atStart = computed(
    () => previousView(this.current(), this.pageCount(), this.perView()) === null,
  );
  protected readonly atEnd = computed(
    () => nextView(this.current(), this.pageCount(), this.perView()) === null,
  );

  /** Share read, for the edge stacks: the page on screen, or the book's own without its text. */
  protected readonly progress = computed(() =>
    this.layout() && this.content()
      ? progressForPage(this.current(), this.pageCount())
      : this.book().progress,
  );
  protected readonly edges = computed(() => {
    const { read, unread } = pageEdgeLayers(this.progress());
    return { read: Array.from({ length: read }), unread: Array.from({ length: unread }) };
  });

  protected readonly cloth = computed(() => `var(--alc-cloth-${this.book().spine.color})`);

  /**
   * The pages on screen. Even pages are versos (left, title in the running head), odd pages are
   * rectos (right, chapter name). A chapter's opening page has no running head, as in print.
   */
  protected readonly slots = computed(() => {
    const layout = this.layout();
    const chapters = this.content()?.chapters ?? [];
    return Array.from({ length: this.perView() }, (_, i) => {
      const page = this.current() + i;
      const verso = page % 2 === 0;
      if (!layout || page >= layout.pageCount) return { verso, page: null, head: '', folio: '' };
      const opens = layout.chapterStarts.includes(page);
      const chapter = chapters[chapterAt(page, layout.chapterStarts)];
      const head = opens ? '' : verso ? this.book().title : (chapter?.name ?? '');
      return { verso, page, head, folio: String(page + 1) };
    });
  });

  /** Said politely after a turn. */
  protected readonly announcement = signal('');

  constructor() {
    // Lay the text out again whenever what is on the pages, or how many pages show, changes.
    afterRenderEffect(() => {
      this.content();
      this.perView();
      this.screen();
      untracked(() => this.relayout());
    });

    // Keep the viewport on the current page, whoever moved it (a turn, the parent, a relayout).
    afterRenderEffect(() => {
      const page = this.current();
      if (this.layout()) this.paginator?.show(page);
    });

    effect(() => {
      const layout = this.layout();
      if (!layout) return;
      const page = this.current();
      this.positionChange.emit({
        page,
        pageCount: layout.pageCount,
        progress: progressForPage(page, layout.pageCount),
      });
    });

    // Later layouts, once the first has run.
    const destroyRef = inject(DestroyRef);
    const relayout = () => {
      if (this.paginator) this.relayout();
    };
    const view = this.document.defaultView;
    if (view && 'ResizeObserver' in view) {
      const observer = new ResizeObserver(relayout);
      afterRenderEffect(() => observer.observe(this.viewport().nativeElement));
      destroyRef.onDestroy(() => observer.disconnect());
    }
    // Text reflows when the web fonts arrive.
    const fonts = this.document.fonts;
    if (fonts) {
      fonts.ready.then(relayout);
      fonts.addEventListener?.('loadingdone', relayout);
      destroyRef.onDestroy(() => fonts.removeEventListener?.('loadingdone', relayout));
    }
  }

  /** Turns to the next view. Returns false on the last one. */
  next(): boolean {
    return this.turn(1);
  }

  /** Turns to the previous view. Returns false on the first one. */
  previous(): boolean {
    return this.turn(-1);
  }

  protected onKeydown(event: KeyboardEvent): void {
    const direction = TURN_KEYS[event.key];
    if (
      !direction ||
      event.defaultPrevented ||
      event.altKey ||
      event.ctrlKey ||
      event.metaKey ||
      event.shiftKey
    ) {
      return;
    }
    const target = event.target as Element | null;
    if (target?.closest?.(OWNS_KEYS)) return;
    event.preventDefault();
    this.turn(direction);
  }

  /** The browser scrolled the viewport itself, to show a find match or a screen reader's cursor. */
  protected onScroll(): void {
    const paginator = this.paginator;
    if (!paginator || !this.layout()) return;
    const page = viewStart(paginator.shownPage(), this.pageCount(), this.perView());
    if (page !== this.current()) this.settle(page);
    else paginator.show(page);
  }

  /** Moves the position to `page` (a view start) and remembers it as the anchor. */
  private settle(page: number): void {
    this.anchor = progressForPage(page, this.pageCount());
    this.settled = page;
    this.page.set(page);
  }

  private turn(direction: 1 | -1): boolean {
    const count = this.pageCount();
    const target =
      direction > 0
        ? nextView(this.current(), count, this.perView())
        : previousView(this.current(), count, this.perView());
    if (target === null) return false;

    const flow = this.flow().nativeElement;
    const readingText = flow.contains(this.document.activeElement);
    this.settle(target);
    this.paginator?.show(target);
    this.animateTurn(direction);
    // Focus on the turn buttons stays put; focus in the text follows it to the new page.
    if (readingText) this.focusFirstLine(target);
    this.announcement.set(`Page ${target + 1} of ${count}`);
    return true;
  }

  private relayout(): void {
    const paginator = (this.paginator ??= this.paginatorFactory(
      this.viewport().nativeElement,
      this.flow().nativeElement,
    ));
    const perView = this.perView();
    const before = this.layout();
    const page = this.page();
    if (page === null) {
      this.anchor = this.book().progress;
    } else if (page !== this.settled) {
      this.anchor = before ? progressForPage(page, before.pageCount) : null;
    }
    const layout = paginator.measure(perView);
    const target =
      this.anchor === null
        ? viewStart(page ?? 0, layout.pageCount, perView)
        : pageForProgress(this.anchor, layout.pageCount, perView);

    this.layout.set(layout);
    this.settled = target;
    this.page.set(target);
    paginator.show(target);
    // Opening the book, focus goes to the first line of text (spec §5). After a reflow, focus
    // that was in the text follows the first line, wherever it now falls.
    const flow = this.flow().nativeElement;
    if (!before || flow.contains(this.document.activeElement)) this.focusFirstLine(target);
  }

  private focusFirstLine(page: number): void {
    const block =
      this.paginator?.firstBlockOn(page) ??
      this.flow().nativeElement.querySelector<HTMLElement>('[data-block]');
    block?.focus({ preventScroll: true });
  }

  /** A 200 ms fade with a 24 px slide in the direction of travel; a plain fade under reduced motion. */
  private animateTurn(direction: 1 | -1): void {
    const { pageTurn, reduced, ease } = tokens.motion;
    const still =
      this.document.defaultView?.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
    const keyframes: Keyframe[] = still
      ? [{ opacity: 0 }, { opacity: 1 }]
      : [
          { opacity: 0, translate: `${direction * pageTurn.slide}px 0` },
          { opacity: 1, translate: '0 0' },
        ];
    const timing = { duration: still ? reduced.crossfade : pageTurn.duration, easing: ease };
    const moving = [
      this.flow().nativeElement,
      ...this.pages().nativeElement.querySelectorAll<HTMLElement>('.furniture'),
    ];
    for (const el of moving) el.animate?.(keyframes, timing);
  }

  private currentScreen(): { screen: Screen; spread: boolean } {
    const is = (query: string) => this.breakpoints.isMatched(query);
    const screen: Screen = is(DESKTOP) ? 'desktop' : is(TABLET) ? 'tablet' : 'phone';
    return { screen, spread: is(SPREAD) };
  }
}
