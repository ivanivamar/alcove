import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MOCK_BOOKS } from '../../core/mock-books';
import { MOCK_SHELVES } from '../../core/mock-shelves';
import { currentlyReading } from '../../core/reading';
import { Bookcase } from '../../shared/bookcase/bookcase';
import { Icon } from '../../shared/icon/icon';
import { ReadingLedge } from '../../shared/reading-ledge/reading-ledge';
import { SpineDensity } from '../../shared/spine/spine-geometry';

@Component({
  selector: 'alc-library-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, Icon, ReadingLedge, Bookcase],
  template: `
    <header class="header">
      <h1>Library</h1>
      <!-- On phone, Import lives here instead of in the bottom bar (spec §3). -->
      <a class="import" routerLink="/import" aria-label="Import books">
        <alc-icon name="plus" />
      </a>
    </header>
    <alc-reading-ledge class="ledge" [books]="reading" [density]="density()" />
    <alc-bookcase class="bookcase" [shelves]="shelves" [books]="books" [density]="density()" />
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
    .ledge,
    .bookcase {
      margin-top: var(--alc-space-5);
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
export class LibraryPage {
  /** From `?density=compact` until Settings owns it. */
  readonly density = input<SpineDensity, string | undefined>('comfortable', {
    transform: (value) => (value === 'compact' ? 'compact' : 'comfortable'),
  });

  protected readonly shelves = MOCK_SHELVES;
  protected readonly books = MOCK_BOOKS;
  /** Most recently opened first. */
  protected readonly reading = currentlyReading(MOCK_BOOKS);
}
