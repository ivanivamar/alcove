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

  describe('the middle third and swipes', () => {
    async function setUp() {
      const rendered = await render({ width: 800 });
      const taps: number[] = [];
      rendered.fixture.componentInstance.centreTap.subscribe(() => taps.push(1));
      const pages = rendered.el.querySelector<HTMLElement>('.pages')!;
      const text = rendered.el.querySelector<HTMLElement>('[data-block]')!;
      return { ...rendered, taps, pages, text };
    }

    /** A pointer from (x, y) through each point, released at the last. Touch unless `type`. */
    async function drag(
      fixture: ComponentFixture<BookSpread>,
      target: HTMLElement,
      points: [number, number][],
      { type = 'touch', release = 'pointerup' } = {},
    ) {
      const send = (name: string, [clientX, clientY]: [number, number]) =>
        target.dispatchEvent(
          new PointerEvent(name, {
            pointerId: 7,
            pointerType: type,
            isPrimary: true,
            clientX,
            clientY,
            bubbles: true,
          }),
        );
      send('pointerdown', points[0]);
      for (const point of points.slice(1)) send('pointermove', point);
      send(release, points.at(-1)!);
      await fixture.whenStable();
    }

    /** The click a browser sends after a pointer goes up (detail 1, unlike the keyboard's 0). */
    async function tap(fixture: ComponentFixture<BookSpread>, target: HTMLElement) {
      target.dispatchEvent(new MouseEvent('click', { bubbles: true, detail: 1 }));
      await fixture.whenStable();
    }

    it('reports a tap or click in the middle third', async () => {
      const { fixture, taps, text } = await setUp();
      await drag(fixture, text, [[200, 300]]);
      await tap(fixture, text);
      expect(taps.length).toBe(1);
      expect(folios(fixture.nativeElement)).toEqual(['6']);
    });

    it('turns, without reporting a tap, from the turn buttons', async () => {
      const { fixture, el, taps } = await setUp();
      await tap(fixture, el.querySelector<HTMLElement>('.next')!);
      expect(taps.length).toBe(0);
      expect(folios(el)).toEqual(['7']);
    });

    it('leaves a click alone that selects text or clears a selection', async () => {
      const { fixture, taps, text } = await setUp();
      document.getSelection()!.selectAllChildren(text);
      await tap(fixture, text);
      expect(taps.length).toBe(0);

      // The selection is cleared by the time of the click, but was there when the press began.
      await drag(fixture, text, [[200, 300]], { type: 'mouse' });
      document.getSelection()!.removeAllRanges();
      await tap(fixture, text);
      expect(taps.length).toBe(0);

      await drag(fixture, text, [[200, 300]], { type: 'mouse' });
      await tap(fixture, text);
      expect(taps.length).toBe(1);
    });

    it('allows a few pixels of wobble in a tap', async () => {
      const { fixture, taps, text } = await setUp();
      await drag(fixture, text, [
        [200, 300],
        [206, 305],
      ]);
      await tap(fixture, text);
      expect(taps.length).toBe(1);
    });

    it('turns forward on a swipe to the left and back on a swipe to the right', async () => {
      const { fixture, el, taps, text } = await setUp();
      await drag(fixture, text, [
        [300, 300],
        [260, 302],
        [200, 305],
      ]);
      expect(folios(el)).toEqual(['7']);
      await tap(fixture, text); // the click some browsers send after the swipe
      expect(taps.length).toBe(0);
      await drag(fixture, text, [
        [100, 300],
        [220, 300],
      ]);
      expect(folios(el)).toEqual(['6']);
      expect(fixture.componentInstance.page()).toBe(5);
    });

    it('moves the text with the finger, and lets go on release', async () => {
      const { fixture, el, text } = await setUp();
      const flow = el.querySelector<HTMLElement>('.flow')!;
      const down = { pointerId: 7, pointerType: 'touch', isPrimary: true, bubbles: true };
      text.dispatchEvent(new PointerEvent('pointerdown', { ...down, clientX: 300, clientY: 300 }));
      text.dispatchEvent(new PointerEvent('pointermove', { ...down, clientX: 270, clientY: 300 }));
      expect(parseFloat(flow.style.translate)).toBe(-30);
      text.dispatchEvent(new PointerEvent('pointerup', { ...down, clientX: 270, clientY: 300 }));
      await fixture.whenStable();
      expect(flow.style.translate).toBe('');
      expect(folios(el)).toEqual(['6']); // under --alc-swipe-turn: no turn
    });

    it('leaves a turn button alone when a swipe starts on it', async () => {
      const { fixture, el } = await setUp();
      const next = el.querySelector<HTMLElement>('.next')!;
      await drag(fixture, next, [
        [700, 300],
        [600, 300],
      ]);
      await tap(fixture, next);
      expect(folios(el)).toEqual(['7']);
    });

    it('leaves a vertical drag to the browser: no turn and no tap', async () => {
      const { fixture, el, taps, text } = await setUp();
      await drag(fixture, text, [
        [200, 300],
        [190, 200],
        [140, 100],
      ]);
      await tap(fixture, text);
      expect(folios(el)).toEqual(['6']);
      expect(taps.length).toBe(0);

      // Or the browser takes it over and cancels the pointer.
      await drag(
        fixture,
        text,
        [
          [300, 300],
          [200, 300],
        ],
        { release: 'pointercancel' },
      );
      expect(folios(el)).toEqual(['6']);
      expect(el.querySelector<HTMLElement>('.flow')!.style.translate).toBe('');
    });

    it('only swipes on touch: a mouse drag selects text', async () => {
      const { fixture, el, text } = await setUp();
      await drag(
        fixture,
        text,
        [
          [300, 300],
          [100, 300],
        ],
        { type: 'mouse' },
      );
      expect(folios(el)).toEqual(['6']);
    });

    it('stops at the first and last pages, without following the finger', async () => {
      const { fixture, el, text } = await setUp();
      for (let i = 0; i < 6; i++) await click(fixture, '.previous');
      expect(folios(el)).toEqual(['1']);
      const flow = el.querySelector<HTMLElement>('.flow')!;
      const touch = { pointerId: 7, pointerType: 'touch', isPrimary: true, bubbles: true };
      text.dispatchEvent(new PointerEvent('pointerdown', { ...touch, clientX: 100, clientY: 300 }));
      text.dispatchEvent(new PointerEvent('pointermove', { ...touch, clientX: 260, clientY: 300 }));
      expect(flow.style.translate).toBe('');
      text.dispatchEvent(new PointerEvent('pointerup', { ...touch, clientX: 260, clientY: 300 }));
      await fixture.whenStable();
      expect(folios(el)).toEqual(['1']);

      for (let i = 0; i < 12; i++) await click(fixture, '.next');
      expect(folios(el)).toEqual(['10']);
      await drag(fixture, text, [
        [300, 300],
        [100, 300],
      ]);
      expect(folios(el)).toEqual(['10']);
    });

    it('never swallows a click from the keyboard', async () => {
      const { fixture, el, text } = await setUp();
      await drag(fixture, text, [
        [300, 300],
        [200, 300],
      ]);
      expect(folios(el)).toEqual(['7']);
      // No click came after the swipe; Enter on a turn button still turns.
      await click(fixture, '.next');
      expect(folios(el)).toEqual(['8']);
    });

    it('puts focus back in the text on request', async () => {
      const { fixture, el } = await setUp();
      await click(fixture, '.next');
      fixture.componentInstance.focusText();
      expect(document.activeElement).toBe(el.querySelectorAll('[data-block]')[6]);
    });

    it('shares where the text fell and how many pages show', async () => {
      const { fixture } = await setUp();
      expect(fixture.componentInstance.pageLayout()).toEqual({
        pageCount: 10,
        chapterStarts: [0, 6],
      });
      expect(fixture.componentInstance.perView()).toBe(1);
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
