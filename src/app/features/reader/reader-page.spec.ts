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

  describe('controls', () => {
    const controls = (el: HTMLElement) => el.querySelector('.controls')!;
    const shown = (el: HTMLElement) => controls(el).classList.contains('shown');

    it('stay shown on desktop, whatever the middle third and Escape do', async () => {
      TestBed.overrideProvider(BreakpointObserver, {
        useValue: { observe: () => of({ matches: true }), isMatched: () => true },
      });
      const { harness, el } = await open('/read/bk-moby');
      expect(shown(el)).toBe(true);
      expect(el.querySelector('.labels')!.classList).toContain('shown');
      const focused = document.activeElement;
      el.querySelector('[data-block]')!.dispatchEvent(
        new MouseEvent('click', { bubbles: true, detail: 1 }),
      );
      await harness.fixture.whenStable();
      expect(shown(el)).toBe(true);
      document.activeElement!.dispatchEvent(
        new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true }),
      );
      await harness.fixture.whenStable();
      expect(shown(el)).toBe(true);
      expect(document.activeElement).toBe(focused);
    });

    async function press(harness: RouterTestingHarness, key: string) {
      const target = document.activeElement ?? document.body;
      target.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true }));
      await harness.fixture.whenStable();
    }

    /** A click in the middle third, as a pointer sends it. */
    async function tapMiddle(harness: RouterTestingHarness, el: HTMLElement) {
      el.querySelector('[data-block]')!.dispatchEvent(
        new MouseEvent('click', { bubbles: true, detail: 1 }),
      );
      await harness.fixture.whenStable();
    }

    it('are hidden at rest, and a tap in the middle third shows and hides them', async () => {
      const { harness, el } = await open('/read/bk-moby');
      expect(shown(el)).toBe(false);
      const focused = document.activeElement;
      await tapMiddle(harness, el);
      expect(shown(el)).toBe(true);
      await tapMiddle(harness, el);
      expect(shown(el)).toBe(false);
      expect(document.activeElement).toBe(focused);
    });

    it('show when a control takes focus, leaving focus there', async () => {
      const { harness, el } = await open('/read/bk-moby');
      const back = el.querySelector<HTMLElement>('.back')!;
      back.focus();
      await harness.fixture.whenStable();
      expect(shown(el)).toBe(true);
      expect(document.activeElement).toBe(back);
    });

    it('hide on Escape, putting focus back in the text', async () => {
      const { harness, el } = await open('/read/bk-moby');
      el.querySelector<HTMLElement>('.tool')!.focus();
      await harness.fixture.whenStable();
      await press(harness, 'Escape');
      expect(shown(el)).toBe(false);
      expect(document.activeElement).toBe(el.querySelectorAll('[data-block]')[6]); // page 6
    });

    it('leave focus alone on Escape while hidden', async () => {
      const { harness, el } = await open('/read/bk-moby');
      const next = el.querySelector<HTMLElement>('.next')!;
      next.focus();
      await press(harness, 'Escape');
      expect(document.activeElement).toBe(next);
    });

    it('name the shelf the book sits on, beside its spine, and go to the library', async () => {
      const { el } = await open('/read/bk-moby');
      const links = el.querySelectorAll('a');
      expect(links.length).toBe(1); // the temporary "Back to library" link is gone
      const back = links[0];
      // Its name is its text; the spine, with its own title on it, is hidden from assistive tech.
      const named = back.cloneNode(true) as HTMLElement;
      named.querySelectorAll('[aria-hidden="true"]').forEach((hidden) => hidden.remove());
      expect(named.textContent!.trim()).toBe('Back to Nineteenth century');
      expect(back.hasAttribute('aria-label')).toBe(false);
      expect(back.getAttribute('href')).toBe('/library');
      expect(back.querySelector('alc-spine .spine')!.getAttribute('aria-hidden')).toBe('true');
      expect(back.querySelector('button')).toBeNull();
    });

    it('show the title as the heading, with the author', async () => {
      const { el } = await open('/read/bk-moby');
      expect(el.querySelector('.controls h1')!.textContent).toBe('Moby-Dick; or, The Whale');
      expect(el.querySelector('.author')!.textContent).toBe('Herman Melville');
    });

    it('have Contents and Aa buttons, with nothing behind them yet', async () => {
      const { el } = await open('/read/bk-moby');
      const tools = [...el.querySelectorAll<HTMLButtonElement>('.tool')];
      expect(
        tools.map((b) => [b.type, b.textContent!.trim(), b.getAttribute('aria-label')]),
      ).toEqual([
        ['button', 'Contents', null],
        ['button', 'Aa', 'Aa, typography'],
      ]);
      expect(tools.some((b) => b.hasAttribute('aria-expanded'))).toBe(false);
    });
  });

  describe('shelf progress', () => {
    const slider = (el: HTMLElement) => el.querySelector<HTMLElement>('[role="slider"]')!;

    async function press(harness: RouterTestingHarness, key: string) {
      const target = document.activeElement ?? document.body;
      target.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true }));
      await harness.fixture.whenStable();
    }

    it('shows the position on screen, always', async () => {
      const { el } = await open('/read/bk-moby');
      expect(slider(el).getAttribute('aria-valuetext')).toBe(
        'Page 7 of 10, chapter 2, The Carpet-Bag',
      );
      expect(el.querySelectorAll('.notch').length).toBe(1);
    });

    it('labels the board with the time left in the chapter while the controls show', async () => {
      const { harness, el } = await open('/read/bk-moby');
      slider(el).focus();
      await harness.fixture.whenStable();
      const labels = el.querySelector('.labels')!;
      expect(labels.classList).toContain('shown');
      // 4 of 10 laid-out pages left in chapter 2: 254 of 635 pages, 195 min.
      expect(labels.querySelector('.time')!.textContent).toBe('3 h 20 min left in chapter');
    });

    it('moves the book, and leaves the keys to the pages once it loses focus', async () => {
      const { harness, el } = await open('/read/bk-moby');
      const folio = () => el.querySelector('.folio')!.textContent;
      slider(el).focus();
      await press(harness, 'ArrowRight');
      expect(folio()).toBe('8'); // one page, not one from the slider and one from the spread
      await press(harness, 'Home');
      expect(folio()).toBe('1');
      await press(harness, 'PageDown');
      expect(folio()).toBe('7');

      slider(el).blur();
      await press(harness, 'ArrowRight');
      expect(folio()).toBe('8');
      expect(slider(el).getAttribute('aria-valuenow')).toBe('8');
    });
  });
});
