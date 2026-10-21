import { CdkVirtualScrollViewport, VirtualScrollStrategy } from '@angular/cdk/scrolling';
import { Injectable } from '@angular/core';
import { Subject, distinctUntilChanged } from 'rxjs';

/** Extra px rendered above and below the visible part of the bookcase. */
const BUFFER = 600;

/**
 * The cabinet rows to render: those overlapping [top − buffer, top + size + buffer].
 * `offsets` are the rows' top edges plus the total height at the end (length = rows + 1).
 */
export function visibleRows(
  offsets: readonly number[],
  top: number,
  size: number,
  buffer = BUFFER,
): { start: number; end: number } {
  const count = offsets.length - 1;
  const rowAt = (y: number) => {
    let i = 0;
    while (i < count - 1 && offsets[i + 1] <= y) i++;
    return i;
  };
  if (count <= 0) return { start: 0, end: 0 };
  return { start: rowAt(top - buffer), end: Math.min(count, rowAt(top + size + buffer) + 1) };
}

/**
 * Virtual scrolling for the bookcase, one cabinet row of bays per unit. Unlike the CDK's fixed
 * size strategy, rows differ in height (a long shelf wraps onto more boards), but every height
 * is known before render from layoutShelf(), so nothing has to be measured.
 */
@Injectable()
export class ShelfRowsScrollStrategy implements VirtualScrollStrategy {
  private readonly index = new Subject<number>();
  readonly scrolledIndexChange = this.index.pipe(distinctUntilChanged());

  private viewport: CdkVirtualScrollViewport | null = null;
  private offsets: number[] = [0];

  setHeights(heights: readonly number[]): void {
    this.offsets = [0];
    for (const h of heights) this.offsets.push(this.offsets[this.offsets.length - 1] + h);
    this.update();
  }

  attach(viewport: CdkVirtualScrollViewport): void {
    this.viewport = viewport;
    this.update();
  }

  detach(): void {
    this.index.complete();
    this.viewport = null;
  }

  onContentScrolled(): void {
    this.update();
  }

  onDataLengthChanged(): void {
    this.update();
  }

  onContentRendered(): void {}

  onRenderedOffsetChanged(): void {}

  scrollToIndex(index: number, behavior: ScrollBehavior): void {
    this.viewport?.scrollToOffset(this.offsets[index] ?? 0, behavior);
  }

  private update(): void {
    const viewport = this.viewport;
    if (!viewport) return;
    // Heights and data can arrive in either order; only lay out rows we know both for.
    const offsets = this.offsets.slice(
      0,
      Math.min(viewport.getDataLength(), this.offsets.length - 1) + 1,
    );
    const top = viewport.measureScrollOffset();
    const range = visibleRows(offsets, top, viewport.getViewportSize());

    viewport.setTotalContentSize(offsets[offsets.length - 1]);
    viewport.setRenderedRange(range);
    viewport.setRenderedContentOffset(offsets[range.start]);
    this.index.next(visibleRows(offsets, top, 0, 0).start);
  }
}
