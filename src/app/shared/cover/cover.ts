import { ChangeDetectionStrategy, Component, computed, input, linkedSignal } from '@angular/core';
import { Book } from '../../core/book';
import { percentRead } from '../../core/reading';
import { Icon } from '../icon/icon';
import { layoutCoverFallback } from './cover-geometry';

/**
 * A book cover, 2:3 (spec §4.2). The image loads lazily over a blurred placeholder in its
 * dominant colour. A book with no cover, or one that fails to load, gets the fallback: the arch
 * mark, the title and the author on the raised surface. Not interactive: wrap it in a link.
 */
@Component({
  selector: 'alc-cover',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Icon],
  templateUrl: './cover.html',
  styleUrl: './cover.css',
  host: {
    role: 'img',
    '[attr.aria-label]': 'label()',
    '[style.width.px]': 'width()',
    '[class.loaded]': 'loaded()',
  },
})
export class Cover {
  readonly book = input.required<Book>();
  /** Width in px. The height follows from 2:3. */
  readonly width = input.required<number>();

  /** Reset whenever the book or its image changes. */
  protected readonly failed = linkedSignal({ source: () => this.book().cover?.src, computation: () => false });
  protected readonly loaded = linkedSignal({ source: () => this.book().cover?.src, computation: () => false });

  protected readonly image = computed(() => (this.failed() ? undefined : this.book().cover));
  protected readonly fallback = computed(() => layoutCoverFallback(this.book().title, this.width()));
  protected readonly reading = computed(() => this.book().status === 'reading');

  protected readonly label = computed(() => {
    const { title, author, progress } = this.book();
    const read = this.reading() ? `, ${percentRead(progress)}% read` : '';
    return `${title} by ${author}${read}`;
  });
}
