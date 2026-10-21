import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

/** Line icons on a 24 px grid, 1.5 px stroke, round caps (spec §4.9). */
const PATHS = {
  library: 'M5 4h3v16H5z M10 4h3v16h-3z M15.2 5.6l2.9-.8 3.6 14.4-2.9.8z M3 20h18',
  collections: 'M4 4h7v7H4z M13 4h7v7h-7z M4 13h7v7H4z M13 13h7v7h-7z',
  search: 'M11 4a7 7 0 1 0 0 14a7 7 0 1 0 0-14z M16.2 16.2L20 20',
  import: 'M12 4v11 M7.5 10.5L12 15l4.5-4.5 M4 15v4a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-4',
  sync: 'M20 12a8 8 0 0 1-13.7 5.7 M4 12a8 8 0 0 1 13.7-5.7 M18 3v4h-4 M6 21v-4h4',
  settings:
    'M4 7h8 M18 7h2 M15 5a2 2 0 1 0 0 4a2 2 0 1 0 0-4z M4 17h2 M12 17h8 M9 15a2 2 0 1 0 0 4a2 2 0 1 0 0-4z',
  plus: 'M12 5v14 M5 12h14',
  back: 'M14.5 6L8.5 12l6 6',
  contents: 'M9 6h11 M9 12h11 M9 18h11 M4.5 6h.01 M4.5 12h.01 M4.5 18h.01',
  /** The Alcove mark: an arched niche with one shelf. */
  arch: 'M5.5 20v-9.5a6.5 6.5 0 0 1 13 0V20 M3.5 20h17 M8.5 14.5h7',
} as const;

export type IconName = keyof typeof PATHS;

@Component({
  selector: 'alc-icon',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { 'aria-hidden': 'true' },
  template: `
    <svg viewBox="0 0 24 24" [attr.width]="size()" [attr.height]="size()">
      <path [attr.d]="d()" />
    </svg>
  `,
  styles: `
    :host {
      display: inline-flex;
      flex: none;
    }
    svg {
      fill: none;
      stroke: currentColor;
      stroke-width: 1.5;
      stroke-linecap: round;
      stroke-linejoin: round;
    }
  `,
})
export class Icon {
  readonly name = input.required<IconName>();
  readonly size = input(24);

  protected readonly d = computed(() => PATHS[this.name()]);
}
