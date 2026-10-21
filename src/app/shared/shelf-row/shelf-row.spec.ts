import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { Book } from '../../core/book';
import { MOCK_BOOKS } from '../../core/mock-books';
import { Shelf } from '../../core/shelf';
import { SpineDensity } from '../spine/spine-geometry';
import { ShelfRow } from './shelf-row';

const shelf = (bookIds: string[]): Shelf => ({
  id: 'gothic',
  name: 'Gothic & strange',
  bookIds,
  route: '/collections/gothic',
});

function render(books: readonly Book[], width = 320, density: SpineDensity = 'comfortable') {
  const fixture = TestBed.createComponent(ShelfRow);
  fixture.componentRef.setInput('shelf', shelf(books.map((b) => b.id)));
  fixture.componentRef.setInput('books', books);
  fixture.componentRef.setInput('width', width);
  fixture.componentRef.setInput('density', density);
  fixture.detectChanges();
  return fixture.nativeElement as HTMLElement;
}

/** Accessible name from aria-labelledby: the label's text, hidden helper text included. */
function nameOf(el: HTMLElement, list: Element): string {
  const label = el.querySelector(`#${list.getAttribute('aria-labelledby')}`)!;
  return label.textContent!.replace(/\s+/g, ' ').trim();
}

describe('ShelfRow', () => {
  beforeEach(() => TestBed.configureTestingModule({ providers: [provideRouter([])] }));

  const books = MOCK_BOOKS.slice(0, 4);

  it('is a list named by its shelf label, with the book count', () => {
    const el = render(books);
    const list = el.querySelector('ul')!;
    expect(nameOf(el, list)).toBe('Gothic & strange, 4 books');
    expect(list.querySelectorAll(':scope > li').length).toBe(4);
    expect(el.querySelector('.count')!.textContent).toContain('4');
  });

  it('says "1 book" for a single book', () => {
    const el = render(books.slice(0, 1));
    expect(nameOf(el, el.querySelector('ul')!)).toBe('Gothic & strange, 1 book');
  });

  it('links the label to the collection', () => {
    expect(render(books).querySelector('.label a')!.getAttribute('href')).toBe(
      '/collections/gothic',
    );
  });

  it('keeps spines as buttons in shelf order', () => {
    const labels = [...render(books).querySelectorAll('li button')].map((b) =>
      b.getAttribute('aria-label'),
    );
    expect(labels.map((l) => l!.split(' by ')[0])).toEqual(books.map((b) => b.title));
  });

  it('hides boards and the bookend from assistive tech', () => {
    const el = render(books);
    for (const part of el.querySelectorAll('.board, .bookend')) {
      expect(part.closest('[aria-hidden="true"]')).not.toBeNull();
    }
  });

  it('adds a board per row when the spines wrap', () => {
    expect(render(books, 320).querySelectorAll('.board').length).toBe(1);
    expect(render(MOCK_BOOKS, 320).querySelectorAll('.board').length).toBeGreaterThan(1);
  });

  it('shows an empty bay as a hidden slot and bookend with real text', () => {
    const el = render([]);
    expect(el.querySelector('ul')).toBeNull();
    expect(el.querySelector('.label')!.textContent!.replace(/\s+/g, ' ').trim()).toBe(
      'Gothic & strange, 0 books',
    );
    expect(el.querySelector('.slot')!.getAttribute('aria-hidden')).toBe('true');
    expect(el.querySelector('.empty .bookend')!.getAttribute('aria-hidden')).toBe('true');
    const text = el.querySelector('.empty-text')!;
    expect(text.textContent).toBe('Nothing on this shelf yet.');
    expect(text.closest('[aria-hidden]')).toBeNull();
    expect(el.querySelectorAll('.board').length).toBe(1);
  });

  it('passes compact density to the spines', () => {
    const height = (d: SpineDensity) =>
      parseInt(
        (render(books.slice(0, 1), 320, d).querySelector('li button') as HTMLElement).style.height,
      );
    expect(height('compact')).toBeLessThan(height('comfortable'));
  });
});
