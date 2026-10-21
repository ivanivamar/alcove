import { Shelf } from './shelf';

const shelf = (id: string, name: string, bookIds: readonly string[]): Shelf => ({
  id,
  name,
  bookIds,
  route: `/collections/${id}`,
});

/**
 * Demo shelves for MOCK_BOOKS until collections exist. Every mock book is on exactly one shelf.
 * "Nineteenth century" sits in a 1fr column on desktop and is wide enough (≈ 500 px of spines)
 * to wrap onto a second row there; "Poetry" is empty.
 */
export const MOCK_SHELVES: readonly Shelf[] = [
  shelf('gothic', 'Gothic & strange', [
    'bk-frankenstein',
    'bk-metamorphosis',
    'bk-pym',
    'bk-heart',
  ]),
  shelf('nineteenth-century', 'Nineteenth century', [
    'bk-middlemarch',
    'bk-bleak',
    'bk-warden',
    'bk-barchester',
    'bk-thorne',
    'bk-war-peace',
    'bk-karamazov',
    'bk-moby',
    'bk-jekyll',
    'bk-dracula',
    'bk-dorian',
    'bk-persuasion',
    'bk-emma',
  ]),
  shelf('detectives', 'Detectives', ['bk-scarlet', 'bk-four']),
  shelf('poetry', 'Poetry', []),
  shelf('voyages', 'Voyages', ['bk-leagues', 'bk-odyssey']),
  shelf('essays-oddities', 'Essays & oddities', ['bk-shandy', 'bk-walden', 'bk-gatsby']),
];
