import { BreakpointObserver } from '@angular/cdk/layout';
import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { map } from 'rxjs';
import tokens from '../../../../design/tokens.json';
import { Book } from '../../core/book';
import { percentRead, timeLeft } from '../../core/reading';
import { Cover } from '../cover/cover';
import { coverHeight } from '../cover/cover-geometry';
import { SpineDensity } from '../spine/spine-geometry';

const DESKTOP = `(min-width: ${tokens.breakpoint.desktop}px)`;
const TABLET = `(min-width: ${tokens.breakpoint.tablet}px)`;

type Screen = keyof typeof tokens.ledge.cover;

/**
 * The currently reading ledge (spec §4.4): covers face-out on one board above the bookcase.
 * Tablet and desktop show each book's title, author, progress and Continue beside its cover;
 * phone shows only the percentages under the board. Covers scroll sideways when they don't fit.
 *
 * Each book is one link, cover and meta together, so there is one tab stop per book and one
 * announcement: a separate Continue link to the same place would repeat the cover's name
 * straight after it.
 */
@Component({
  selector: 'alc-reading-ledge',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, Cover],
  templateUrl: './reading-ledge.html',
  styleUrl: './reading-ledge.css',
  host: {
    '[hidden]': '!books().length',
    '[class.compact]': "density() === 'compact'",
  },
})
export class ReadingLedge {
  /** The books being read, in the order to show them. Nothing to show hides the ledge. */
  readonly books = input.required<readonly Book[]>();
  readonly density = input<SpineDensity>('comfortable');

  private readonly breakpoints = inject(BreakpointObserver);
  private readonly screen = toSignal(
    this.breakpoints.observe([TABLET, DESKTOP]).pipe(map(() => this.currentScreen())),
    { initialValue: this.currentScreen() },
  );

  protected readonly coverWidth = computed(() => {
    const width = tokens.ledge.cover[this.screen()];
    return this.density() === 'compact' ? Math.round(width * tokens.spine.densityCompact) : width;
  });
  protected readonly coverHeight = computed(() => coverHeight(this.coverWidth()));

  protected readonly items = computed(() =>
    this.books().map((book) => {
      const pct = percentRead(book.progress);
      const left = timeLeft(book);
      return {
        book,
        pct,
        timeLeft: left,
        route: ['/read', book.id],
        label: `Continue ${book.title} by ${book.author}, ${pct}% read, ${left}`,
      };
    }),
  );

  private currentScreen(): Screen {
    if (this.breakpoints.isMatched(DESKTOP)) return 'desktop';
    if (this.breakpoints.isMatched(TABLET)) return 'tablet';
    return 'phone';
  }
}
