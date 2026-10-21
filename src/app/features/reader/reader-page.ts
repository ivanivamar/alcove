import { BreakpointObserver } from '@angular/cdk/layout';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  signal,
  viewChild,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { map } from 'rxjs';
import { RouterLink } from '@angular/router';
import tokens from '../../../../design/tokens.json';
import { mockBook } from '../../core/mock-books';
import { mockContentFor } from '../../core/mock-content';
import { MOCK_SHELVES } from '../../core/mock-shelves';
import { DEFAULT_PAPER, Paper, isPaper } from '../../core/paper';
import { timeLeftInChapter } from '../../core/reading';
import { backLabel, shelfOf } from '../../core/shelf';
import { BookSpread, ReadingPosition } from '../../shared/book-spread/book-spread';
import { Icon } from '../../shared/icon/icon';
import { ProgressChapter, ShelfProgress } from '../../shared/shelf-progress/shelf-progress';
import { Spine } from '../../shared/spine/spine';

const DESKTOP = `(min-width: ${tokens.breakpoint.desktop}px)`;

/**
 * The reader on /read/:id. The route only lets known books in, and opens the book at its saved
 * progress, on the board it rests on with the progress slider along its edge (spec §4.6).
 *
 * The reader controls (spec §4.7) are hidden at rest. A tap or click in the middle third of the
 * pages shows or hides them, and so does nothing else: tabbing into one shows them, and Escape
 * hides them and puts focus back in the text. Hidden, they stay in the tab order and the
 * accessibility tree, only faded out and not clickable. On desktop there is room for them, so
 * they and the labels under the board are always shown, and the middle third and Escape leave
 * them be.
 */
@Component({
  selector: 'alc-reader-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, Icon, Spine, BookSpread, ShelfProgress],
  templateUrl: './reader-page.html',
  styleUrl: './reader-page.css',
  host: { '(document:keydown.escape)': 'onEscape()' },
})
export class ReaderPage {
  /** From the route. */
  readonly id = input.required<string>();
  /** From `?paper=` until the Aa panel owns it. */
  readonly paper = input<Paper, string | undefined>(DEFAULT_PAPER, {
    transform: (value) => (isPaper(value) ? value : DEFAULT_PAPER),
  });

  protected readonly book = computed(() => mockBook(this.id()));
  protected readonly content = computed(() => mockContentFor(this.id()));
  protected readonly backLabel = computed(() => backLabel(shelfOf(this.id(), MOCK_SHELVES)));
  protected readonly spineScale = tokens.readerControls.backSpineScale;

  /** Null until the spread opens the book at its saved progress. */
  protected readonly page = signal<number | null>(null);
  /** The latest position, ready to save once reading positions are stored (spec §8). */
  readonly position = signal<ReadingPosition | null>(null);

  /** Shown by a tap or by focus, on phone and tablet. */
  readonly controlsShown = signal(false);
  /** On desktop the controls never hide. */
  private readonly breakpoints = inject(BreakpointObserver);
  protected readonly pinned = toSignal(
    this.breakpoints.observe(DESKTOP).pipe(map(() => this.breakpoints.isMatched(DESKTOP))),
    { initialValue: this.breakpoints.isMatched(DESKTOP) },
  );
  readonly controlsVisible = computed(() => this.pinned() || this.controlsShown());

  private readonly spread = viewChild(BookSpread);
  protected readonly perView = computed(() => this.spread()?.perView() ?? 1);
  private readonly layout = computed(() => this.spread()?.pageLayout() ?? null);

  protected readonly chapters = computed<ProgressChapter[]>(() => {
    const chapters = this.content()?.chapters ?? [];
    return (this.layout()?.chapterStarts ?? []).map((start, i) => ({
      start,
      number: chapters[i]?.number ?? i + 1,
      name: chapters[i]?.name ?? '',
    }));
  });
  protected readonly chapterTimeLeft = computed(() => {
    const book = this.book();
    const position = this.position();
    const layout = this.layout();
    if (!book || !position || !layout || !this.content()) return '';
    return timeLeftInChapter(book, { ...position, chapterStarts: layout.chapterStarts });
  });

  protected toggleControls(): void {
    if (this.pinned()) return;
    this.controlsShown.update((shown) => !shown);
  }

  protected showControls(): void {
    this.controlsShown.set(true);
  }

  protected onEscape(): void {
    if (this.pinned() || !this.controlsShown()) return;
    this.controlsShown.set(false);
    this.spread()?.focusText();
  }
}
