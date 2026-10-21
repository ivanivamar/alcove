import { Book } from './book';

const onDevice = { kind: 'on-device' } as const;
const notOnDevice = { kind: 'not-on-device' } as const;
const downloading = (progress: number) => ({ kind: 'downloading', progress }) as const;

/**
 * Demo library until import and storage exist. Covers every style, status and offline state.
 * Three of the books being read have a cover image (public/covers); the rest show the fallback.
 */
export const MOCK_BOOKS: readonly Book[] = [
  { id: 'bk-warden', title: 'The Warden', author: 'Anthony Trollope', pages: 286, status: 'finished', progress: 1, offline: onDevice, seriesNumber: 1, spine: { style: 'series', color: 'navy' } },
  { id: 'bk-barchester', title: 'Barchester Towers', author: 'Anthony Trollope', pages: 532, status: 'reading', progress: 0.42, offline: onDevice, seriesNumber: 2, spine: { style: 'series', color: 'navy' }, lastOpened: '2026-10-14T21:05:00Z' },
  { id: 'bk-thorne', title: 'Doctor Thorne', author: 'Anthony Trollope', pages: 608, status: 'to-read', progress: 0, offline: notOnDevice, seriesNumber: 3, spine: { style: 'series', color: 'navy' } },
  { id: 'bk-middlemarch', title: 'Middlemarch', author: 'George Eliot', pages: 880, status: 'reading', progress: 0.18, offline: onDevice, spine: { style: 'cloth', color: 'oxblood' }, cover: { src: 'covers/middlemarch.svg', color: '#3B5644' }, lastOpened: '2026-10-20T22:40:00Z' },
  { id: 'bk-metamorphosis', title: 'The Metamorphosis', author: 'Franz Kafka', pages: 118, status: 'finished', progress: 1, offline: onDevice, spine: { style: 'paper', color: 'linen' } },
  { id: 'bk-war-peace', title: 'War and Peace', author: 'Leo Tolstoy', pages: 1096, status: 'to-read', progress: 0, offline: downloading(0.35), spine: { style: 'cloth', color: 'forest' } },
  { id: 'bk-jekyll', title: 'The Strange Case of Dr Jekyll and Mr Hyde', author: 'Robert Louis Stevenson', pages: 138, status: 'new', progress: 0, offline: onDevice, spine: { style: 'bold', color: 'charcoal' } },
  { id: 'bk-moby', title: 'Moby-Dick; or, The Whale', author: 'Herman Melville', pages: 635, status: 'reading', progress: 0.67, offline: onDevice, spine: { style: 'band', color: 'teal' }, cover: { src: 'covers/moby-dick.svg', color: '#1F3A52' }, lastOpened: '2026-10-19T07:55:00Z' },
  { id: 'bk-persuasion', title: 'Persuasion', author: 'Jane Austen', pages: 249, status: 'finished', progress: 1, offline: notOnDevice, spine: { style: 'paper', color: 'blush' } },
  { id: 'bk-dracula', title: 'Dracula', author: 'Bram Stoker', pages: 418, status: 'new', progress: 0, offline: downloading(0.8), spine: { style: 'bold', color: 'oxblood' } },
  { id: 'bk-pym', title: 'The Narrative of Arthur Gordon Pym of Nantucket', author: 'Edgar Allan Poe', pages: 212, status: 'to-read', progress: 0, offline: onDevice, spine: { style: 'cloth', color: 'plum' } },
  { id: 'bk-scarlet', title: 'A Study in Scarlet', author: 'Arthur Conan Doyle', pages: 176, status: 'finished', progress: 1, offline: onDevice, seriesNumber: 1, spine: { style: 'series', color: 'rust' } },
  { id: 'bk-four', title: 'The Sign of the Four', author: 'Arthur Conan Doyle', pages: 154, status: 'reading', progress: 0.9, offline: onDevice, seriesNumber: 2, spine: { style: 'series', color: 'rust' }, lastOpened: '2026-10-17T12:30:00Z' },
  { id: 'bk-karamazov', title: 'The Brothers Karamazov', author: 'Fyodor Dostoevsky', pages: 1023, status: 'to-read', progress: 0, offline: notOnDevice, spine: { style: 'band', color: 'slate' } },
  { id: 'bk-walden', title: 'Walden', author: 'Henry David Thoreau', pages: 352, status: 'reading', progress: 0.05, offline: onDevice, spine: { style: 'paper', color: 'straw' }, cover: { src: 'covers/walden.svg', color: '#C9B57E' }, lastOpened: '2026-10-08T18:10:00Z' },
  { id: 'bk-heart', title: 'Heart of Darkness', author: 'Joseph Conrad', pages: 100, status: 'new', progress: 0, offline: onDevice, spine: { style: 'band', color: 'ochre' } },
  { id: 'bk-shandy', title: 'The Life and Opinions of Tristram Shandy, Gentleman', author: 'Laurence Sterne', pages: 760, status: 'to-read', progress: 0, offline: onDevice, spine: { style: 'cloth', color: 'moss' } },
  { id: 'bk-frankenstein', title: 'Frankenstein', author: 'Mary Shelley', pages: 280, status: 'finished', progress: 1, offline: onDevice, spine: { style: 'bold', color: 'mist' } },
  { id: 'bk-leagues', title: 'Twenty Thousand Leagues Under the Seas', author: 'Jules Verne', pages: 446, status: 'reading', progress: 0.31, offline: downloading(0.1), spine: { style: 'band', color: 'navy' }, lastOpened: '2026-09-27T09:00:00Z' },
  { id: 'bk-emma', title: 'Emma', author: 'Jane Austen', pages: 474, status: 'new', progress: 0, offline: notOnDevice, spine: { style: 'cloth', color: 'teal' } },
  { id: 'bk-dorian', title: 'The Picture of Dorian Gray', author: 'Oscar Wilde', pages: 254, status: 'to-read', progress: 0, offline: onDevice, spine: { style: 'paper', color: 'mist' } },
  { id: 'bk-bleak', title: 'Bleak House', author: 'Charles Dickens', pages: 1017, status: 'reading', progress: 0.55, offline: onDevice, spine: { style: 'cloth', color: 'charcoal' }, lastOpened: '2026-10-11T20:15:00Z' },
  { id: 'bk-odyssey', title: 'The Odyssey', author: 'Homer', pages: 541, status: 'finished', progress: 1, offline: onDevice, spine: { style: 'bold', color: 'straw' } },
  { id: 'bk-gatsby', title: 'The Great Gatsby', author: 'F. Scott Fitzgerald', pages: 180, status: 'to-read', progress: 0, offline: onDevice, spine: { style: 'band', color: 'forest' } },
];
