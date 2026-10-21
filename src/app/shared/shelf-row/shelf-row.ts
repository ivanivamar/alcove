import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Book } from '../../core/book';
import { Shelf } from '../../core/shelf';
import { Spine } from '../spine/spine';
import { SpineDensity } from '../spine/spine-geometry';
import { layoutShelf } from './shelf-geometry';

/** One bay of the bookcase: a shelf label, its spines on one or more boards, and a bookend (spec §4.3). */
@Component({
  selector: 'alc-shelf-row',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, Spine],
  templateUrl: './shelf-row.html',
  styleUrl: './shelf-row.css',
  host: {
    '[class.compact]': "density() === 'compact'",
    '[style.min-height.px]': 'layout().height',
  },
})
export class ShelfRow {
  readonly shelf = input.required<Shelf>();
  /** The shelf's books, already resolved from its ids, in shelf order. */
  readonly books = input.required<readonly Book[]>();
  /** Outer width of the bay in px. Spines that don't fit wrap onto another board. */
  readonly width = input.required<number>();
  readonly density = input<SpineDensity>('comfortable');

  protected readonly layout = computed(() =>
    layoutShelf(this.books(), this.width(), this.density()),
  );
  protected readonly labelId = computed(() => `alc-shelf-${this.shelf().id}`);
  protected readonly countLabel = computed(() => (this.books().length === 1 ? 'book' : 'books'));
}
