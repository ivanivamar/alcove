import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { Book } from '../../core/book';
import { MOCK_BOOKS } from '../../core/mock-books';
import { currentlyReading } from '../../core/reading';
import { SpineDensity } from '../spine/spine-geometry';
import { ReadingLedge } from './reading-ledge';

const middlemarch = MOCK_BOOKS.find((b) => b.id === 'bk-middlemarch')!;
const walden = MOCK_BOOKS.find((b) => b.id === 'bk-walden')!;

function render(books: readonly Book[], density: SpineDensity = 'comfortable') {
  const fixture = TestBed.createComponent(ReadingLedge);
  fixture.componentRef.setInput('books', books);
  fixture.componentRef.setInput('density', density);
  fixture.detectChanges();
  return { fixture, el: fixture.nativeElement as HTMLElement };
}

describe('ReadingLedge', () => {
  beforeEach(() => TestBed.configureTestingModule({ providers: [provideRouter([])] }));

  it('is a section named by its visible "Currently reading" heading', () => {
    const { el } = render([middlemarch]);
    const section = el.querySelector('section')!;
    const heading = el.querySelector(`#${section.getAttribute('aria-labelledby')}`)!;
    expect(heading.tagName).toBe('H2');
    expect(heading.textContent).toBe('Currently reading');
  });

  it('is a list with one item per book, in the order given', () => {
    const books = currentlyReading(MOCK_BOOKS);
    const { el } = render(books);
    const items = el.querySelectorAll('section ul > li');
    expect(items.length).toBe(books.length);
    expect([...items].map((li) => li.querySelector('.meta .title')!.textContent)).toEqual(
      books.map((b) => b.title),
    );
  });

  it('names each book link with the title, author, share read and time left', () => {
    const { el } = render([middlemarch, walden]);
    const names = [...el.querySelectorAll('li a')].map((a) => a.getAttribute('aria-label'));
    expect(names).toEqual([
      'Continue Middlemarch by George Eliot, 18% read, 9 h 20 min left',
      'Continue Walden by Henry David Thoreau, 5% read, 4 h 20 min left',
    ]);
  });

  it('has one link per book, going to its reading route, so nothing is announced twice', () => {
    const { el } = render([middlemarch]);
    const links = el.querySelectorAll('li a');
    expect(links.length).toBe(1);
    expect(links[0].getAttribute('href')).toBe('/read/bk-middlemarch');
    expect(links[0].querySelector('alc-cover')).not.toBeNull();
    expect(links[0].querySelector('.continue')!.textContent).toBe('Continue');
  });

  it('gives the progress bars a text equivalent and hides the visual-only parts', () => {
    const { el } = render([middlemarch]);
    expect(el.querySelector('.stat')!.textContent).toBe('18% · 9 h 20 min left');
    expect(el.querySelector('.pct')!.textContent).toBe('18%');
    // The link's name says it all; the cover's own image name would repeat it.
    for (const part of el.querySelectorAll('.board, .meta, .pct, alc-cover')) {
      expect(part.getAttribute('aria-hidden')).toBe('true');
    }
    expect((el.querySelector('.bar .read') as HTMLElement).style.transform).toBe('scaleX(0.18)');
  });

  it('hides itself when nothing is being read', () => {
    const { fixture, el } = render([middlemarch]);
    expect(el.hidden).toBe(false);
    fixture.componentRef.setInput('books', []);
    fixture.detectChanges();
    expect(el.hidden).toBe(true);
    expect(el.querySelectorAll('li').length).toBe(0);
  });

  it('uses 80 px covers on phone and shrinks them in compact density', () => {
    const width = (d: SpineDensity) =>
      (render([middlemarch], d).el.querySelector('alc-cover') as HTMLElement).style.width;
    // jsdom matches no media queries, so this is the phone size.
    expect(width('comfortable')).toBe('80px');
    expect(width('compact')).toBe('68px');
  });
});
