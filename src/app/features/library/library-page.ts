import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MOCK_BOOKS } from '../../core/mock-books';
import { Icon } from '../../shared/icon/icon';
import { Spine } from '../../shared/spine/spine';

@Component({
  selector: 'alc-library-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, Icon, Spine],
  template: `
    <header class="header">
      <h1>Library</h1>
      <!-- On phone, Import lives here instead of in the bottom bar (spec §3). -->
      <a class="import" routerLink="/import" aria-label="Import books">
        <alc-icon name="plus" />
      </a>
    </header>
    <!-- Temporary row until alc-bookcase and alc-shelf-row land. -->
    <ul class="spines" aria-label="Books">
      @for (book of books; track book.id) {
        <li><alc-spine [book]="book" /></li>
      }
    </ul>
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
    .spines {
      display: flex;
      flex-wrap: wrap;
      align-items: flex-end;
      gap: var(--alc-space-4) var(--alc-shelf-spine-gap);
      margin: var(--alc-space-5) 0 0;
      padding: 0;
      list-style: none;
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
  protected readonly books = MOCK_BOOKS;
}
