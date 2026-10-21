import { BreakpointObserver } from '@angular/cdk/layout';
import { TestBed } from '@angular/core/testing';
import { Title } from '@angular/platform-browser';
import { Router, provideRouter, withComponentInputBinding } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { of } from 'rxjs';
import { routes } from '../../app.routes';
import { ALC_PAGINATOR, PaginatorFactory } from '../../shared/book-spread/paginator';

/** Ten pages, one block starting each. */
const paginator: PaginatorFactory = (_viewport, flow) => ({
  measure: () => ({ pageCount: 10, chapterStarts: [0, 6] }),
  show: () => undefined,
  shownPage: () => 0,
  firstBlockOn: (page) => flow.querySelectorAll<HTMLElement>('[data-block]')[page] ?? null,
});

describe('ReaderPage', () => {
  beforeEach(() =>
    TestBed.configureTestingModule({
      providers: [
        provideRouter(routes, withComponentInputBinding()),
        { provide: ALC_PAGINATOR, useValue: paginator },
        {
          provide: BreakpointObserver,
          useValue: { observe: () => of({ matches: false }), isMatched: () => false },
        },
      ],
    }),
  );

  async function open(url: string) {
    const harness = await RouterTestingHarness.create(url);
    await harness.fixture.whenStable();
    return { harness, el: harness.routeNativeElement as HTMLElement };
  }

  it('opens the book named in the route, titled "{title} · Alcove"', async () => {
    const { el } = await open('/read/bk-moby');
    expect(TestBed.inject(Title).getTitle()).toBe('Moby-Dick; or, The Whale · Alcove');
    expect(el.querySelector('h1')!.textContent).toBe('Moby-Dick; or, The Whale');
    expect(el.querySelector('h2')!.textContent).toBe('Chapter 1: Loomings');
    expect(el.querySelector('.head')).not.toBeNull();
  });

  it('opens at the saved progress: 67% of ten pages is page 7', async () => {
    const { el } = await open('/read/bk-moby');
    expect(el.querySelector('.folio')!.textContent).toBe('7');
  });

  it('redirects an unknown book to the library', async () => {
    await open('/read/bk-nope');
    expect(TestBed.inject(Router).url).toBe('/library');
  });

  it('shows the no-text state for a book without mock content', async () => {
    const { el } = await open('/read/bk-walden');
    expect(el.querySelector('.unavailable')!.textContent).toBe(
      "This book's text isn't available yet.",
    );
  });

  it('reads on Slate by default and takes another paper from ?paper=', async () => {
    const { harness } = await open('/read/bk-middlemarch');
    const paper = () =>
      harness.routeNativeElement!.querySelector('alc-book-spread')!.getAttribute('data-paper');
    expect(paper()).toBe('slate');
    await harness.navigateByUrl('/read/bk-middlemarch?paper=sepia');
    expect(paper()).toBe('sepia');
    await harness.navigateByUrl('/read/bk-middlemarch?paper=vellum');
    expect(paper()).toBe('slate');
  });

  it('has a labelled link back to the library', async () => {
    const { el } = await open('/read/bk-middlemarch');
    const back = el.querySelector('a')!;
    expect(back.textContent!.trim()).toBe('Back to library');
    expect(back.getAttribute('href')).toBe('/library');
  });
});
