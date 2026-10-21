import { Routes } from '@angular/router';

const placeholder = () =>
  import('./features/placeholder/placeholder-page').then((m) => m.PlaceholderPage);

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'library' },
  {
    path: 'library',
    title: 'Library · Alcove',
    loadComponent: () => import('./features/library/library-page').then((m) => m.LibraryPage),
  },
  { path: 'collections', title: 'Collections · Alcove', data: { heading: 'Collections' }, loadComponent: placeholder },
  { path: 'collections/:id', title: 'Collection · Alcove', data: { heading: 'Collection' }, loadComponent: placeholder },
  { path: 'search', title: 'Search · Alcove', data: { heading: 'Search' }, loadComponent: placeholder },
  { path: 'import', title: 'Import · Alcove', data: { heading: 'Import' }, loadComponent: placeholder },
  { path: 'sync', title: 'Sync · Alcove', data: { heading: 'Sync' }, loadComponent: placeholder },
  { path: 'settings', title: 'Settings · Alcove', data: { heading: 'Settings' }, loadComponent: placeholder },
  { path: '**', redirectTo: 'library' },
];
