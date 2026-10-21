import { ChangeDetectionStrategy, Component, input } from '@angular/core';

/** Stand-in for screens that aren't built yet. `heading` comes from the route's data. */
@Component({
  selector: 'alc-placeholder-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <header class="header">
      <h1>{{ heading() }}</h1>
    </header>
    <p class="note">This screen isn't built yet.</p>
  `,
  styles: `
    .header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: var(--alc-space-3);
    }
    h1 {
      margin: 0;
      font: var(--alc-type-display-l);
    }
    .note {
      color: var(--alc-ink-muted);
    }
  `,
})
export class PlaceholderPage {
  readonly heading = input('');
}
