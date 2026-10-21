import { BreakpointObserver } from '@angular/cdk/layout';
import { ScrollingModule, VIRTUAL_SCROLL_STRATEGY } from '@angular/cdk/scrolling';
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  computed,
  effect,
  inject,
  input,
  signal,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { map } from 'rxjs';
import tokens from '../../../../design/tokens.json';
import { Book } from '../../core/book';
import { Shelf } from '../../core/shelf';
import { ShelfRow } from '../shelf-row/shelf-row';
import { layoutShelf } from '../shelf-row/shelf-geometry';
import { SpineDensity } from '../spine/spine-geometry';
import { ShelfRowsScrollStrategy } from './shelf-rows-scroll-strategy';

const { columns: COLUMNS, divider: DIVIDER } = tokens.bookcase;
const DESKTOP = `(min-width: ${tokens.breakpoint.desktop}px)`;
const TABLET = `(min-width: ${tokens.breakpoint.tablet}px)`;

interface Bay {
  readonly shelf: Shelf;
  readonly books: readonly Book[];
  readonly width: number;
}

/** A row of bays across the cabinet; the unit of virtual scrolling. */
interface CabinetRow {
  readonly bays: readonly Bay[];
  readonly height: number;
}

/**
 * The built-in bookcase (spec §4.3): wood cabinet, bays in a grid with wood dividers, one shelf
 * per bay. Desktop has three columns, tablet two, phone one, so spines always stay at full size.
 * Virtualised by cabinet row against the window's scroll.
 */
@Component({
  selector: 'alc-bookcase',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ScrollingModule, ShelfRow],
  providers: [
    ShelfRowsScrollStrategy,
    { provide: VIRTUAL_SCROLL_STRATEGY, useExisting: ShelfRowsScrollStrategy },
  ],
  templateUrl: './bookcase.html',
  styleUrl: './bookcase.css',
})
export class Bookcase {
  readonly shelves = input.required<readonly Shelf[]>();
  /** Every book the shelves refer to. Ids with no book here are skipped. */
  readonly books = input.required<readonly Book[]>();
  readonly density = input<SpineDensity>('comfortable');

  private readonly strategy = inject(ShelfRowsScrollStrategy);
  private readonly breakpoints = inject(BreakpointObserver);

  /** Width inside the side panels, px. 0 until measured. */
  protected readonly width = signal(0);

  private readonly fractions = toSignal(
    this.breakpoints.observe([TABLET, DESKTOP]).pipe(map(() => this.columnFractions())),
    { initialValue: this.columnFractions() },
  );

  private readonly booksById = computed(() => new Map(this.books().map((b) => [b.id, b])));

  protected readonly rows = computed<readonly CabinetRow[]>(() => {
    const fractions = this.fractions();
    const total = fractions.reduce((sum, f) => sum + f, 0);
    const free = this.width() - (fractions.length - 1) * DIVIDER;
    // Floor so the spines never overrun the bay the grid actually draws.
    const widths = fractions.map((f) => Math.floor((free * f) / total));
    const byId = this.booksById();
    const density = this.density();

    const rows: CabinetRow[] = [];
    const shelves = this.shelves();
    for (let i = 0; i < shelves.length; i += fractions.length) {
      const bays = shelves.slice(i, i + fractions.length).map((shelf, c) => ({
        shelf,
        books: shelf.bookIds.flatMap((id) => byId.get(id) ?? []),
        width: widths[c],
      }));
      const height = Math.max(
        ...bays.map((bay) => layoutShelf(bay.books, bay.width, density).height),
      );
      rows.push({ bays, height });
    }
    return rows;
  });

  constructor() {
    effect(() => this.strategy.setHeights(this.rows().map((row) => row.height)));

    const host = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
    if (typeof ResizeObserver !== 'undefined') {
      const observer = new ResizeObserver(([entry]) =>
        this.width.set(Math.floor(entry.contentRect.width)),
      );
      observer.observe(host);
      inject(DestroyRef).onDestroy(() => observer.disconnect());
    }
  }

  protected trackRow(index: number, row: CabinetRow): string {
    return row.bays.map((bay) => bay.shelf.id).join(' ');
  }

  private columnFractions(): readonly number[] {
    if (this.breakpoints.isMatched(DESKTOP)) return COLUMNS.desktop;
    if (this.breakpoints.isMatched(TABLET)) return COLUMNS.tablet;
    return COLUMNS.phone;
  }
}
