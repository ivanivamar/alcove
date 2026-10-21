import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  computed,
  input,
  model,
  viewChild,
} from '@angular/core';
import { chapterAt, nextView, previousView, viewStart } from '../book-spread/pagination';

/** A chapter as the slider marks it: where it starts in the laid-out pages. */
export interface ProgressChapter {
  readonly start: number;
  /** As printed in the opener: "Chapter {number}". */
  readonly number: number;
  readonly name: string;
}

/**
 * The reading position on the front edge of the board the book rests on (spec §4.6): a 2 px
 * track, the read part in lamp amber, a notch where each chapter starts and a knob, inside a
 * 44 px slider. Drag to scrub; the arrow keys move a view, Page Up/Down a chapter, Home and End
 * to either end. Always shown; the labels under the board only while the reader controls are.
 *
 * Pages are from 0, as in the spread, and every value is the first page of a view, so a spread
 * moves two pages at a time.
 */
@Component({
  selector: 'alc-shelf-progress',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './shelf-progress.html',
  styleUrl: './shelf-progress.css',
})
export class ShelfProgress {
  /** The first page on screen. */
  readonly page = model(0);
  readonly pageCount = input(0);
  readonly chapters = input<readonly ProgressChapter[]>([]);
  /** Pages on screen at once. */
  readonly perView = input(1);
  /** Shows the chapter, page and time left under the board. */
  readonly labelsShown = input(false);
  /** Time left in the chapter, already formatted. */
  readonly timeLeft = input('');

  private readonly rail = viewChild.required<ElementRef<HTMLElement>>('rail');

  protected readonly disabled = computed(() => this.pageCount() < 2);
  protected readonly current = computed(() =>
    viewStart(this.page(), this.pageCount(), this.perView()),
  );
  protected readonly read = computed(() =>
    this.disabled() ? 0 : (this.current() / (this.pageCount() - 1)) * 100,
  );
  protected readonly notches = computed(() =>
    this.disabled()
      ? []
      : this.chapters()
          .filter(({ start }) => start > 0 && start < this.pageCount())
          .map(({ start }) => (start / (this.pageCount() - 1)) * 100),
  );

  protected readonly chapter = computed(
    () => this.chapters()[chapterAt(this.current(), this.starts())] ?? null,
  );
  protected readonly pageLabel = computed(
    () => `Page ${this.current() + 1} of ${Math.max(1, this.pageCount())}`,
  );
  protected readonly valueText = computed(() => {
    const chapter = this.chapter();
    if (!chapter) return this.pageLabel();
    const name = chapter.name ? `, ${chapter.name}` : '';
    return `${this.pageLabel()}, chapter ${chapter.number}${name}`;
  });

  private readonly starts = computed(() => this.chapters().map(({ start }) => start));
  private dragging: number | null = null;

  protected onKeydown(event: KeyboardEvent): void {
    if (event.altKey || event.ctrlKey || event.metaKey || this.disabled()) return;
    const target = this.target(event.key);
    if (target === null) return;
    event.preventDefault();
    this.moveTo(target);
  }

  protected onPointerDown(event: PointerEvent): void {
    if (!event.isPrimary || event.button > 0 || this.disabled()) return;
    const slider = event.currentTarget as HTMLElement;
    slider.focus({ preventScroll: true, focusVisible: false });
    slider.setPointerCapture?.(event.pointerId);
    this.dragging = event.pointerId;
    event.preventDefault();
    this.scrubTo(event.clientX);
  }

  protected onPointerMove(event: PointerEvent): void {
    if (event.pointerId === this.dragging) this.scrubTo(event.clientX);
  }

  protected onPointerUp(event: PointerEvent): void {
    if (event.pointerId === this.dragging) this.dragging = null;
  }

  /** Where a key goes, or null for keys the slider leaves alone. */
  private target(key: string): number | null {
    const count = this.pageCount();
    const perView = this.perView();
    const page = this.current();
    const starts = this.starts().map((start) => viewStart(start, count, perView));
    switch (key) {
      case 'ArrowRight':
      case 'ArrowUp':
        return nextView(page, count, perView) ?? page;
      case 'ArrowLeft':
      case 'ArrowDown':
        return previousView(page, count, perView) ?? page;
      case 'PageDown':
        return starts.find((start) => start > page) ?? viewStart(count - 1, count, perView);
      case 'PageUp':
        return starts.filter((start) => start < page).at(-1) ?? 0;
      case 'Home':
        return 0;
      case 'End':
        return viewStart(count - 1, count, perView);
      default:
        return null;
    }
  }

  private scrubTo(x: number): void {
    const rect = this.rail().nativeElement.getBoundingClientRect();
    const share = rect.width > 0 ? Math.min(1, Math.max(0, (x - rect.left) / rect.width)) : 0;
    this.moveTo(Math.round(share * (this.pageCount() - 1)));
  }

  private moveTo(page: number): void {
    const target = viewStart(page, this.pageCount(), this.perView());
    if (target !== this.current()) this.page.set(target);
  }
}
