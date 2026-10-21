import { BreakpointObserver } from '@angular/cdk/layout';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import tokens from '../../../../design/tokens.json';
import { Book } from '../../core/book';
import { BookContent } from '../../core/book-content';
import { Paper } from '../../core/paper';
import { BookSpread, ReadingPosition } from './book-spread';
import { ALC_PAGINATOR, PaginatorFactory } from './paginator';

const book: Book = {
  id: 'bk-test',
  title: 'Moby-Dick',
  author: 'Herman Melville',
  pages: 635,
  status: 'reading',
  progress: 0.5,
  offline: { kind: 'on-device' },
  spine: { style: 'band', color: 'teal' },
};

const paragraphs = (n: number) => Array.from({ length: n }, (_, i) => `Paragraph ${i + 1}.`);
const content: BookContent = {
  bookId: 'bk-test',
  chapters: [
    { number: 1, name: 'Loomings', paragraphs: paragraphs(5) },
    { number: 2, name: 'The Carpet-Bag', paragraphs: paragraphs(5) },
  ],
};

/**
 * Lays the flow out without a layout engine: `pageCount` pages, one `data-block` starting each
 * page. Chapter 1 opens on page 0 and chapter 2 on page 6.
 */
function fakePaginator(pageCount = 10, chapterStarts = [0, 6]) {
  const shown: number[] = [];
  const factory: PaginatorFactory = (_viewport, flow) => ({
    measure: () => ({ pageCount, chapterStarts }),
    show: (page) => shown.push(page),
    shownPage: () => shown.at(-1) ?? 0,
    firstBlockOn: (page) => flow.querySelectorAll<HTMLElement>('[data-block]')[page] ?? null,
  });
  return { factory, shown };
}

/** Breakpoints without matchMedia: a window at least 960 px wide shows a spread. */
function windowOf(width: number) {
  const min = (query: string) => Number(/min-width: (\d+)px/.exec(query)?.[1] ?? 0);
  return {
    provide: BreakpointObserver,
    useValue: {
      observe: () => of({ matches: true, breakpoints: {} }),
      isMatched: (q: string) => width >= min(q),
    },
  };
}

interface Options {
  width?: number;
  value?: Book;
  text?: BookContent | null;
  paper?: Paper;
  pageCount?: number;
}

async function render({
  width = 1440,
  value = book,
  text = content,
  paper,
  pageCount,
}: Options = {}) {
  const paginator = fakePaginator(pageCount);
  TestBed.configureTestingModule({
    providers: [windowOf(width), { provide: ALC_PAGINATOR, useValue: paginator.factory }],
  });
  const fixture = TestBed.createComponent(BookSpread);
  fixture.componentRef.setInput('book', value);
  fixture.componentRef.setInput('content', text);
  if (paper) fixture.componentRef.setInput('paper', paper);
  const positions: ReadingPosition[] = [];
  fixture.componentInstance.positionChange.subscribe((p) => positions.push(p));
  fixture.detectChanges();
  await fixture.whenStable();
  const el = fixture.nativeElement as HTMLElement;
  return { fixture, el, positions, shown: paginator.shown };
}

const folios = (el: HTMLElement) => [...el.querySelectorAll('.folio')].map((f) => f.textContent);
const heads = (el: HTMLElement) => [...el.querySelectorAll('.head')].map((h) => h.textContent);
const live = (el: HTMLElement) => el.querySelector('[aria-live="polite"]')!.textContent;

async function press(
  fixture: ComponentFixture<BookSpread>,
  key: string,
  init: KeyboardEventInit = {},
) {
  const target = document.activeElement ?? document.body;
  target.dispatchEvent(
    new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true, ...init }),
  );
  await fixture.whenStable();
}

async function click(fixture: ComponentFixture<BookSpread>, selector: string) {
  const button = (fixture.nativeElement as HTMLElement).querySelector<HTMLButtonElement>(selector)!;
  button.focus();
  button.click();
  await fixture.whenStable();
}

describe('BookSpread', () => {
  describe('opening', () => {
    it("opens at the book's progress, rounded to the nearest page", async () => {
      // 0.5 × 9 = 4.5, which rounds to page 5 (folio 6).
      const { el, positions } = await render({ width: 800 });
      expect(folios(el)).toEqual(['6']);
      expect(positions.at(-1)).toEqual({ page: 5, pageCount: 10, progress: 5 / 9 });
    });

    it('opens a spread on the left page of that spread, never past the saved page', async () => {
      const { el, fixture } = await render();
      expect(folios(el)).toEqual(['5', '6']);
      expect(fixture.componentInstance.page()).toBe(4);
    });

    it('opens at a page the parent gives instead', async () => {
      TestBed.configureTestingModule({
        providers: [windowOf(800), { provide: ALC_PAGINATOR, useValue: fakePaginator().factory }],
      });
      const fixture = TestBed.createComponent(BookSpread);
      fixture.componentRef.setInput('book', book);
      fixture.componentRef.setInput('content', content);
      fixture.componentInstance.page.set(2);
      fixture.detectChanges();
      await fixture.whenStable();
      expect(folios(fixture.nativeElement)).toEqual(['3']);
    });

    it('moves focus to the first line of text on the page it opens at', async () => {
      await render({ width: 800 });
      expect(document.activeElement?.textContent).toBe('Paragraph 5.');
    });
  });

  describe('page furniture', () => {
    it('shows the title on the left page and the chapter on the right, with folios', async () => {
      const { el } = await render();
      expect(heads(el)).toEqual(['Moby-Dick', 'Loomings']);
      expect(folios(el)).toEqual(['5', '6']);
    });

    it("leaves the running head off a chapter's opening page", async () => {
      const { el, fixture } = await render();
      fixture.componentInstance.page.set(6);
      await fixture.whenStable();
      expect(heads(el)).toEqual(['', 'The Carpet-Bag']);
    });

    it('alternates title and chapter on a single page', async () => {
      const { el, fixture } = await render({ width: 800 });
      expect(heads(el)).toEqual(['Loomings']); // page 5 is a recto
      fixture.componentInstance.page.set(4);
      await fixture.whenStable();
      expect(heads(el)).toEqual(['Moby-Dick']);
    });

    it('marks pages as versos and rectos for the gutter shade', async () => {
      const { el } = await render();
      const pages = [...el.querySelectorAll('.page')];
      expect(pages.map((p) => p.className.includes('verso'))).toEqual([true, false]);
    });

    it('hides the running heads, folios, edges and boards from assistive tech', async () => {
      const { el } = await render();
      for (const page of el.querySelectorAll('.page'))
        expect(page.getAttribute('aria-hidden')).toBe('true');
      for (const edges of el.querySelectorAll('.edges'))
        expect(edges.getAttribute('aria-hidden')).toBe('true');
      expect(el.querySelector('.boards')!.getAttribute('aria-hidden')).toBe('true');
    });

    it('stacks page edges by the share read', async () => {
      const { el, fixture } = await render({ width: 800, pageCount: 21 });
      const layers = () => [...el.querySelectorAll('.edges')].map((e) => e.children.length);
      expect(layers()).toEqual([4, 4]); // page 10 of 0–20
      fixture.componentInstance.page.set(1); // 5%
      await fixture.whenStable();
      expect(layers()).toEqual([1, 7]);
      fixture.componentInstance.page.set(18); // 90%
      await fixture.whenStable();
      expect(layers()).toEqual([7, 1]);
    });

    it("uses the book's spine cloth for the boards", async () => {
      const { el } = await render();
      expect((el.querySelector('.book') as HTMLElement).style.getPropertyValue('--cloth')).toBe(
        'var(--alc-cloth-teal)',
      );
    });
  });

  describe('paper', () => {
    it('defaults to the paper tokens.json marks as default', async () => {
      const { el } = await render();
      expect(el.dataset['paper']).toBe('slate');
      expect('default' in tokens.paper.slate).toBe(true);
    });

    it('switches paper without touching the page', async () => {
      const { el, fixture } = await render({ paper: 'sepia' });
      expect(el.dataset['paper']).toBe('sepia');
      fixture.componentRef.setInput('paper', 'night');
      await fixture.whenStable();
      expect(el.dataset['paper']).toBe('night');
      expect(folios(el)).toEqual(['5', '6']);
    });
  });

  describe('turning pages', () => {
    it('turns with the Next and Previous buttons, keeping focus on them', async () => {
      const { el, fixture, shown } = await render({ width: 800 });
      await click(fixture, '.next');
      expect(folios(el)).toEqual(['7']);
      expect(shown.at(-1)).toBe(6);
      expect(document.activeElement?.getAttribute('aria-label')).toBe('Next page');
      await click(fixture, '.previous');
      await click(fixture, '.previous');
      expect(folios(el)).toEqual(['5']);
      expect(document.activeElement?.getAttribute('aria-label')).toBe('Previous page');
    });

    it('turns a whole spread at a time', async () => {
      const { el, fixture } = await render();
      await click(fixture, '.next');
      expect(folios(el)).toEqual(['7', '8']);
    });

    it('turns with the arrow keys and Page Up/Down, and focus in the text follows it', async () => {
      const { el, fixture } = await render({ width: 800 });
      await press(fixture, 'ArrowRight');
      expect(folios(el)).toEqual(['7']);
      expect(document.activeElement?.textContent).toBe('Chapter 2: The Carpet-Bag'); // opens page 6
      await press(fixture, 'PageDown');
      expect(folios(el)).toEqual(['8']);
      await press(fixture, 'PageUp');
      await press(fixture, 'ArrowLeft');
      expect(folios(el)).toEqual(['6']);
      expect(document.activeElement?.textContent).toBe('Paragraph 5.');
    });

    it('leaves keys alone with modifiers, in fields, and when already handled', async () => {
      const { el, fixture } = await render({ width: 800 });
      await press(fixture, 'ArrowRight', { shiftKey: true });
      await press(fixture, 'ArrowRight', { altKey: true });
      const input = document.createElement('input');
      document.body.append(input);
      input.focus();
      await press(fixture, 'ArrowRight');
      input.remove();
      const handled = new KeyboardEvent('keydown', {
        key: 'ArrowRight',
        bubbles: true,
        cancelable: true,
      });
      handled.preventDefault();
      document.body.dispatchEvent(handled);
      await fixture.whenStable();
      expect(folios(el)).toEqual(['6']);
    });

    it('stops at the first and last pages, saying so on the buttons', async () => {
      const { el, fixture } = await render({ width: 800 });
      const next = el.querySelector('.next')!;
      const previous = el.querySelector('.previous')!;
      for (let i = 0; i < 6; i++) await click(fixture, '.next');
      expect(folios(el)).toEqual(['10']);
      expect(next.getAttribute('aria-disabled')).toBe('true');
      expect(fixture.componentInstance.next()).toBe(false);
      // Still focusable, so focus isn't lost when the end is reached.
      expect(document.activeElement).toBe(next);

      for (let i = 0; i < 12; i++) await press(fixture, 'ArrowLeft');
      expect(folios(el)).toEqual(['1']);
      expect(previous.getAttribute('aria-disabled')).toBe('true');
      expect(next.hasAttribute('aria-disabled')).toBe(false);
      expect(fixture.componentInstance.previous()).toBe(false);
    });

    it('ends a spread with an odd page count on a blank right page', async () => {
      const { el, fixture } = await render({ pageCount: 9 });
      for (let i = 0; i < 4; i++) await click(fixture, '.next');
      expect(folios(el)).toEqual(['9']);
      expect(el.querySelectorAll('.page').length).toBe(2);
    });

    it('says the new page politely after a turn, not on opening', async () => {
      const { el, fixture } = await render({ width: 800 });
      expect(live(el)).toBe('');
      await click(fixture, '.next');
      expect(live(el)).toBe('Page 7 of 10');
    });

    it('reports every position for the parent to save', async () => {
      const { fixture, positions } = await render({ width: 800 });
      await click(fixture, '.next');
      expect(positions.at(-1)).toEqual({ page: 6, pageCount: 10, progress: 6 / 9 });
      expect(fixture.componentInstance.page()).toBe(6);
    });

    it('labels the turn zones as buttons and leaves the middle third free', async () => {
      const { el } = await render();
      const buttons = [...el.querySelectorAll('button')];
      expect(buttons.map((b) => [b.type, b.getAttribute('aria-label')])).toEqual([
        ['button', 'Previous page'],
        ['button', 'Next page'],
      ]);
    });
  });

  describe("when the book's text isn't available", () => {
    it('says so on the page and puts focus there', async () => {
      const { el } = await render({ text: null });
      const note = el.querySelector('.unavailable')!;
      expect(note.textContent).toBe("This book's text isn't available yet.");
      expect(document.activeElement).toBe(note);
      expect(el.querySelector('h2')).toBeNull();
    });

    it("stacks the edges by the book's own progress", async () => {
      const { el } = await render({ text: null, value: { ...book, progress: 0.9 }, pageCount: 1 });
      expect([...el.querySelectorAll('.edges')].map((e) => e.children.length)).toEqual([7, 1]);
    });
  });
});
