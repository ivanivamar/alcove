import { NgTemplateOutlet } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import tokens from '../../../../design/tokens.json';
import { Book, SpineColor, SpineStyle } from '../../core/book';
import {
  SpineDensity,
  fitSpineTitle,
  headReserve,
  isCapsStyle,
  spineHeight,
  spineLabel,
  spineWidth,
} from './spine-geometry';

const LIGHT_CLOTHS: readonly string[] = tokens.spine.lightCloths;

/** A book spine, generated in the UI (spec §4.1). */
@Component({
  selector: 'alc-spine',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [NgTemplateOutlet],
  templateUrl: './spine.html',
  styleUrl: './spine.css',
})
export class Spine {
  readonly book = input.required<Book>();
  /** Defaults to the book's own spine style. */
  readonly style = input<SpineStyle>();
  /** Defaults to the book's own cloth. */
  readonly color = input<SpineColor>();
  readonly scale = input(1);
  readonly density = input<SpineDensity>('comfortable');
  /** Just the picture, hidden from assistive tech: for a spine inside another control. */
  readonly decorative = input(false);

  protected readonly resolvedStyle = computed(() => this.style() ?? this.book().spine.style);
  protected readonly caps = computed(() => isCapsStyle(this.resolvedStyle()));
  protected readonly cloth = computed(() => {
    const color = this.color() ?? this.book().spine.color;
    return {
      fill: `var(--alc-cloth-${color})`,
      ink: LIGHT_CLOTHS.includes(color) ? 'var(--alc-spine-ink-dark)' : 'var(--alc-spine-ink-light)',
    };
  });

  protected readonly width = computed(() => spineWidth(this.book().pages, this.scale()));
  protected readonly height = computed(() => spineHeight(this.book().id, this.scale(), this.density()));
  protected readonly textStart = computed(
    () => tokens.spine.padHead + headReserve(this.resolvedStyle(), this.height()),
  );

  protected readonly fit = computed(() =>
    fitSpineTitle({
      title: this.book().title,
      author: this.book().author,
      style: this.resolvedStyle(),
      width: this.width(),
      height: this.height(),
    }),
  );

  protected readonly label = computed(() => spineLabel(this.book()));

  /** The one mark at the foot. Offline states win over the reading status. */
  protected readonly mark = computed(() => {
    const { offline, status } = this.book();
    if (offline.kind !== 'on-device') return offline.kind;
    if (status === 'new' || status === 'finished') return status;
    return null;
  });

  protected readonly downloadProgress = computed(() => {
    const offline = this.book().offline;
    return offline.kind === 'downloading' ? offline.progress : 0;
  });
}
