import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Icon } from '../../shared/icon/icon';

@Component({
  selector: 'alc-library-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, Icon],
  template: `
    <header class="header">
      <h1>Library</h1>
      <!-- On phone, Import lives here instead of in the bottom bar (spec §3). -->
      <a class="import" routerLink="/import" aria-label="Import books">
        <alc-icon name="plus" />
      </a>
    </header>
    <p class="note">The bookcase goes here.</p>
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
    .import {
      display: grid;
      place-items: center;
      width: var(--alc-touch);
      height: var(--alc-touch);
      color: var(--alc-accent);
      border: 1px solid var(--alc-hairline-strong);
      border-radius: var(--alc-radius-control);
    }
    @media (min-width: 600px) {
      .import {
        display: none;
      }
    }
  `,
})
export class LibraryPage {}
