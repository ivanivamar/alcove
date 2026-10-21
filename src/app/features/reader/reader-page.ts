import { ChangeDetectionStrategy, Component, computed, input, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { mockBook } from '../../core/mock-books';
import { mockContentFor } from '../../core/mock-content';
import { DEFAULT_PAPER, Paper, isPaper } from '../../core/paper';
import { BookSpread, ReadingPosition } from '../../shared/book-spread/book-spread';
import { Icon } from '../../shared/icon/icon';

/**
 * The reader on /read/:id. The route only lets known books in, and opens the book at its saved
 * progress. Until the reader controls exist (spec §4.7), a plain link leads back to the library.
 */
@Component({
  selector: 'alc-reader-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, Icon, BookSpread],
  template: `
    @if (book(); as book) {
      <h1 class="alc-visually-hidden">{{ book.title }}</h1>
      <nav class="bar" aria-label="Reader">
        <a class="back" routerLink="/library"><alc-icon name="back" />Back to library</a>
      </nav>
      <alc-book-spread
        class="book"
        [book]="book"
        [content]="content()"
        [paper]="paper()"
        [(page)]="page"
        (positionChange)="position.set($event)"
      />
    }
  `,
  styles: `
    :host {
      display: flex;
      flex-direction: column;
      height: 100dvh;
      padding: 0 var(--alc-gutter-phone) var(--alc-space-3);
    }
    .bar {
      display: flex;
      flex: none;
    }
    .back {
      display: inline-flex;
      align-items: center;
      gap: var(--alc-space-1);
      min-height: var(--alc-touch);
      padding-inline-end: var(--alc-space-2);
      font: var(--alc-type-label);
      text-decoration: none;
    }
    .book {
      flex: 1;
    }
    @media (min-width: 600px) {
      :host {
        padding: var(--alc-space-2) var(--alc-gutter-tablet) var(--alc-space-4);
      }
    }
    @media (min-width: 1024px) {
      :host {
        padding-inline: var(--alc-gutter-desktop);
      }
    }
  `,
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

  /** Null until the spread opens the book at its saved progress. */
  protected readonly page = signal<number | null>(null);
  /** The latest position, ready to save once reading positions are stored (spec §8). */
  readonly position = signal<ReadingPosition | null>(null);
}
