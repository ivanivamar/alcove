import { inject } from '@angular/core';
import { CanActivateFn, ResolveFn, Router, Routes } from '@angular/router';
import { mockBook } from '../../core/mock-books';

/** Only books in the library open; anything else goes back to it. */
const knownBook: CanActivateFn = (route) =>
  mockBook(route.paramMap.get('id') ?? '') ? true : inject(Router).createUrlTree(['/library']);

const bookTitle: ResolveFn<string> = (route) =>
  `${mockBook(route.paramMap.get('id') ?? '')?.title} · Alcove`;

export const READER_ROUTES: Routes = [
  {
    path: ':id',
    canActivate: [knownBook],
    title: bookTitle,
    // The reader fills the window; its own controls replace the rail and bottom bar (spec §4.7).
    data: { immersive: true },
    loadComponent: () => import('./reader-page').then((m) => m.ReaderPage),
  },
];
