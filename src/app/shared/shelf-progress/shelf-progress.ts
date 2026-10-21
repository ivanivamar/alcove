import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  computed,
  input,
  linkedSignal,
  model,
  signal,
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

/** The tooltip: where along the rail, and what it says. */
interface Tip {
  readonly at: string;
  readonly page: string;
  readonly chapter: string;
}

/**
 * The reading position on the front edge of the board the book rests on (spec §4.6): a 2 px
 * track, the read part in lamp amber, a notch where each chapter starts and a knob, inside a
 * 44 px slider. Drag to scrub; the arrow keys move a view, Page Up/Down a chapter, Home and End
 * to either end. Always shown; the labels under the board only while the reader controls are.
 *
 * A tooltip above the track names the page and chapter: under the pointer while it hovers, and
 * at the knob while dragging or moving with the keys. It repeats aria-valuetext, so it is hidden
 * from assistive tech.
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
  private readonly dragging = signal<number | null>(null);
  /** The page under a hovering mouse. */
  private readonly hovered = signal<number | null>(null);
  /** Focus came from the keyboard, or a key moved the knob. */
  private readonly keyed = signal(false);

  /** What the tooltip says and where, or null while it is hidden. */
  protected readonly tip = computed<Tip | null>(() => {
    if (this.disabled()) return null;
    const page = this.dragging() !== null || this.keyed() ? this.current() : this.hovered();
    if (page === null) return null;
    const chapter = this.chapters()[chapterAt(page, this.starts())];
    return {
      at: `${(page / (this.pageCount() - 1)) * 100}%`,
      page: `Page ${page + 1} of ${this.pageCount()}`,
      chapter: chapter?.name ?? '',
    };
  });
  /** The last tip shown, kept while it fades out. */
  protected readonly lastTip = linkedSignal<Tip | null, Tip | null>({
    source: this.tip,
    computation: (tip, previous) => tip ?? previous?.value ?? null,
  });

  protected onKeydown(event: KeyboardEvent): void {
    if (event.altKey || event.ctrlKey || event.metaKey || this.disabled()) return;
    const target = this.target(event.key);
    if (target === null) return;
    event.preventDefault();
    this.keyed.set(true);
    this.moveTo(target);
  }

  protected onPointerDown(event: PointerEvent): void {
    if (!event.isPrimary || event.button > 0 || this.disabled()) return;
    const slider = event.currentTarget as HTMLElement;
    slider.focus({ preventScroll: true, focusVisible: false });
    slider.setPointerCapture?.(event.pointerId);
    this.dragging.set(event.pointerId);
    this.keyed.set(false);
    event.preventDefault();
    this.moveTo(this.pageAt(event.clientX));
  }

  protected onPointerMove(event: PointerEvent): void {
    if (event.pointerId === this.dragging()) this.moveTo(this.pageAt(event.clientX));
    else if (event.pointerType === 'mouse' && !this.disabled()) {
      this.hovered.set(viewStart(this.pageAt(event.clientX), this.pageCount(), this.perView()));
    }
  }

  protected onPointerUp(event: PointerEvent): void {
    if (event.pointerId === this.dragging()) this.dragging.set(null);
  }

  protected onPointerLeave(): void {
    this.hovered.set(null);
  }

  protected onFocus(event: FocusEvent): void {
    this.keyed.set(matchesFocusVisible(event.target as HTMLElement));
  }

  protected onBlur(): void {
    this.keyed.set(false);
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

  /** The page under a pointer at `x`. */
  private pageAt(x: number): number {
    const rect = this.rail().nativeElement.getBoundingClientRect();
    const share = rect.width > 0 ? Math.min(1, Math.max(0, (x - rect.left) / rect.width)) : 0;
    return Math.round(share * (this.pageCount() - 1));
  }

  private moveTo(page: number): void {
    const target = viewStart(page, this.pageCount(), this.perView());
    if (target !== this.current()) this.page.set(target);
  }
}

/** Whether focus would show its ring: it came from the keyboard. */
function matchesFocusVisible(el: HTMLElement): boolean {
  try {
    return el.matches(':focus-visible');
  } catch {
    return false;
  }
}
