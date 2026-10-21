import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ProgressChapter, ShelfProgress } from './shelf-progress';

/** Twenty pages; chapters open on pages 0, 6 and 13. */
const chapters: ProgressChapter[] = [
  { start: 0, number: 1, name: 'Loomings' },
  { start: 6, number: 2, name: 'The Carpet-Bag' },
  { start: 13, number: 3, name: 'The Spouter-Inn' },
];

interface Options {
  page?: number;
  pageCount?: number;
  perView?: number;
}

async function render({ page = 0, pageCount = 20, perView = 1 }: Options = {}) {
  const fixture = TestBed.createComponent(ShelfProgress);
  fixture.componentRef.setInput('page', page);
  fixture.componentRef.setInput('pageCount', pageCount);
  fixture.componentRef.setInput('perView', perView);
  fixture.componentRef.setInput('chapters', chapters);
  fixture.componentRef.setInput('timeLeft', '4 min left in chapter');
  await fixture.whenStable();
  const el = fixture.nativeElement as HTMLElement;
  const slider = el.querySelector<HTMLElement>('[role="slider"]')!;
  return { fixture, el, slider };
}

async function press(fixture: ComponentFixture<ShelfProgress>, slider: HTMLElement, key: string) {
  const event = new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true });
  slider.dispatchEvent(event);
  await fixture.whenStable();
  return event;
}

const now = (slider: HTMLElement) => Number(slider.getAttribute('aria-valuenow'));

describe('ShelfProgress', () => {
  it('is a focusable, labelled slider over the pages, from 1', async () => {
    const { slider } = await render({ page: 7 });
    expect(slider.tabIndex).toBe(0);
    expect(slider.getAttribute('aria-label')).toBe('Reading position');
    expect(slider.getAttribute('aria-valuemin')).toBe('1');
    expect(slider.getAttribute('aria-valuemax')).toBe('20');
    expect(now(slider)).toBe(8);
  });

  it('says the page, the chapter and its name', async () => {
    const { fixture, slider } = await render({ page: 7 });
    expect(slider.getAttribute('aria-valuetext')).toBe('Page 8 of 20, chapter 2, The Carpet-Bag');
    fixture.componentRef.setInput('page', 0);
    await fixture.whenStable();
    expect(slider.getAttribute('aria-valuetext')).toBe('Page 1 of 20, chapter 1, Loomings');
  });

  it('leaves the chapter out before the first one', async () => {
    const { fixture, slider } = await render({ page: 2 });
    fixture.componentRef.setInput('chapters', [{ start: 5, number: 1, name: 'Loomings' }]);
    await fixture.whenStable();
    expect(slider.getAttribute('aria-valuetext')).toBe('Page 3 of 20');
  });

  it('moves a page with the arrow keys, and stops at either end', async () => {
    const { fixture, slider } = await render({ page: 18 });
    const right = await press(fixture, slider, 'ArrowRight');
    expect(right.defaultPrevented).toBe(true);
    expect(now(slider)).toBe(20);
    await press(fixture, slider, 'ArrowUp');
    expect(now(slider)).toBe(20);
    await press(fixture, slider, 'ArrowLeft');
    await press(fixture, slider, 'ArrowDown');
    expect(now(slider)).toBe(18);
    expect(fixture.componentInstance.page()).toBe(17);
  });

  it('moves a chapter with Page Up and Page Down', async () => {
    const { fixture, slider } = await render({ page: 8 });
    await press(fixture, slider, 'PageDown');
    expect(now(slider)).toBe(14);
    await press(fixture, slider, 'PageDown'); // no chapter after: the last page
    expect(now(slider)).toBe(20);
    await press(fixture, slider, 'PageUp'); // back to the start of this chapter
    expect(now(slider)).toBe(14);
    await press(fixture, slider, 'PageUp'); // already there: the chapter before
    expect(now(slider)).toBe(7);
    await press(fixture, slider, 'PageUp');
    await press(fixture, slider, 'PageUp');
    expect(now(slider)).toBe(1);
  });

  it('goes to the first and last pages with Home and End', async () => {
    const { fixture, slider } = await render({ page: 8 });
    await press(fixture, slider, 'End');
    expect(now(slider)).toBe(20);
    await press(fixture, slider, 'Home');
    expect(now(slider)).toBe(1);
  });

  it('moves a whole spread at a time, always to its left page', async () => {
    const { fixture, slider } = await render({ page: 8, perView: 2 });
    await press(fixture, slider, 'ArrowRight');
    expect(now(slider)).toBe(11);
    await press(fixture, slider, 'PageDown'); // chapter 3 opens on page 13, a right page
    expect(now(slider)).toBe(13);
    expect(fixture.componentInstance.page()).toBe(12);
    await press(fixture, slider, 'End');
    expect(now(slider)).toBe(19);
  });

  it('leaves other keys, and keys with modifiers, alone', async () => {
    const { fixture, slider } = await render({ page: 8 });
    expect((await press(fixture, slider, 'Tab')).defaultPrevented).toBe(false);
    const ctrl = new KeyboardEvent('keydown', {
      key: 'End',
      ctrlKey: true,
      bubbles: true,
      cancelable: true,
    });
    slider.dispatchEvent(ctrl);
    await fixture.whenStable();
    expect(ctrl.defaultPrevented).toBe(false);
    expect(now(slider)).toBe(9);
  });

  it('scrubs to the page under the pointer while dragging', async () => {
    const { fixture, el, slider } = await render();
    const rail = el.querySelector<HTMLElement>('.rail')!;
    rail.getBoundingClientRect = () => ({ left: 100, width: 190 }) as DOMRect;
    const pointer = (type: string, clientX: number) =>
      slider.dispatchEvent(
        new PointerEvent(type, { pointerId: 1, isPrimary: true, clientX, bubbles: true }),
      );

    pointer('pointerdown', 150); // 50 / 190 of 19 = page 5
    await fixture.whenStable();
    expect(document.activeElement).toBe(slider);
    expect(now(slider)).toBe(6);
    pointer('pointermove', 400); // past the end
    await fixture.whenStable();
    expect(now(slider)).toBe(20);
    pointer('pointerup', 400);
    pointer('pointermove', 100);
    await fixture.whenStable();
    expect(now(slider)).toBe(20);
  });

  it('puts a notch at every chapter after the first, and fills the part read', async () => {
    const { el } = await render({ page: 19 });
    const notches = [...el.querySelectorAll<HTMLElement>('.notch')].map((n) => n.style.left);
    expect(notches).toEqual([`${(6 / 19) * 100}%`, `${(13 / 19) * 100}%`]);
    expect(el.querySelector<HTMLElement>('.read')!.style.width).toBe('100%');
  });

  it('shows the chapter, page and time left only while the controls are shown', async () => {
    const { fixture, el } = await render({ page: 7 });
    const labels = el.querySelector('.labels')!;
    expect(labels.classList).not.toContain('shown');
    expect(labels.getAttribute('aria-hidden')).toBe('true');
    fixture.componentRef.setInput('labelsShown', true);
    await fixture.whenStable();
    expect(labels.classList).toContain('shown');
    expect(labels.hasAttribute('aria-hidden')).toBe(false);
    expect([...labels.children].map((c) => c.textContent)).toEqual([
      'The Carpet-Bag',
      'Page 8 of 20',
      '4 min left in chapter',
    ]);
  });

  it('does nothing in a book of one page', async () => {
    const { fixture, slider } = await render({ pageCount: 1 });
    expect(slider.getAttribute('aria-disabled')).toBe('true');
    await press(fixture, slider, 'End');
    expect(now(slider)).toBe(1);
  });

  describe('tooltip', () => {
    async function setUp(options: Options = {}) {
      const rendered = await render(options);
      const rail = rendered.el.querySelector<HTMLElement>('.rail')!;
      rail.getBoundingClientRect = () => ({ left: 100, width: 190 }) as DOMRect;
      const tip = rendered.el.querySelector<HTMLElement>('.tip')!;
      const pointer = async (type: string, clientX: number, pointerType = 'mouse') => {
        rendered.slider.dispatchEvent(
          new PointerEvent(type, {
            pointerId: 1,
            isPrimary: true,
            pointerType,
            clientX,
            bubbles: true,
          }),
        );
        await rendered.fixture.whenStable();
      };
      const text = () => [...tip.children].map((c) => c.textContent);
      const shown = () => tip.classList.contains('shown');
      return { ...rendered, tip, pointer, text, shown };
    }

    it('is hidden at rest, and from assistive tech always', async () => {
      const { tip, shown } = await setUp({ page: 7 });
      expect(shown()).toBe(false);
      expect(tip.getAttribute('aria-hidden')).toBe('true');
    });

    it('names the page and chapter under a hovering mouse, without moving', async () => {
      const { fixture, tip, pointer, text, shown, slider } = await setUp({ page: 7 });
      await pointer('pointermove', 250); // 150 / 190 of 19 = page 15
      expect(shown()).toBe(true);
      expect(text()).toEqual(['The Spouter-Inn', 'Page 16 of 20']);
      expect(tip.style.getPropertyValue('--at')).toBe(`${(15 / 19) * 100}%`);
      expect(now(slider)).toBe(8);
      expect(fixture.componentInstance.page()).toBe(7);

      await pointer('pointerleave', 250);
      expect(shown()).toBe(false);
      expect(text()).toEqual(['The Spouter-Inn', 'Page 16 of 20']); // kept while it fades
    });

    it('follows the knob while dragging, on touch too', async () => {
      const { pointer, text, shown } = await setUp();
      await pointer('pointermove', 250, 'touch');
      expect(shown()).toBe(false);
      await pointer('pointerdown', 150, 'touch');
      expect(text()).toEqual(['Loomings', 'Page 6 of 20']);
      await pointer('pointermove', 180, 'touch');
      expect(text()).toEqual(['The Carpet-Bag', 'Page 9 of 20']);
      await pointer('pointerup', 180, 'touch');
      expect(shown()).toBe(false);
    });

    it('shows at the knob when a key moves it, until focus leaves', async () => {
      const { fixture, slider, text, shown } = await setUp({ page: 4 });
      slider.focus();
      await press(fixture, slider, 'PageDown');
      expect(shown()).toBe(true);
      expect(text()).toEqual(['The Carpet-Bag', 'Page 7 of 20']);
      slider.blur();
      await fixture.whenStable();
      expect(shown()).toBe(false);
    });

    it('leaves out the chapter before the first one', async () => {
      const { fixture, pointer, text } = await setUp();
      fixture.componentRef.setInput('chapters', [{ start: 5, number: 1, name: 'Loomings' }]);
      await pointer('pointermove', 110);
      expect(text()).toEqual(['Page 2 of 20']);
    });
  });
});
