import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  signal,
  viewChild,
} from '@angular/core';
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

/**
 * The reader on /read/:id. The route only lets known books in, and opens the book at its saved
 * progress, on the board it rests on with the progress slider along its edge (spec §4.6).
 *
 * The reader controls (spec §4.7) are hidden at rest. A tap or click in the middle third of the
 * pages shows or hides them, and so does nothing else: tabbing into one shows them, and Escape
 * hides them and puts focus back in the text. Hidden, they stay in the tab order and the
 * accessibility tree, only faded out and not clickable.
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

  readonly controlsShown = signal(false);

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
    this.controlsShown.update((shown) => !shown);
  }

  protected showControls(): void {
    this.controlsShown.set(true);
  }

  protected onEscape(): void {
    if (!this.controlsShown()) return;
    this.controlsShown.set(false);
    this.spread()?.focusText();
  }
}
