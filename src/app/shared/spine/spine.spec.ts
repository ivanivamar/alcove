import { TestBed } from '@angular/core/testing';
import { Book } from '../../core/book';
import { Spine } from './spine';

const book: Book = {
  id: 'bk-metamorphosis',
  title: 'The Metamorphosis',
  author: 'Franz Kafka',
  pages: 118,
  status: 'reading',
  progress: 0.25,
  offline: { kind: 'not-on-device' },
  spine: { style: 'paper', color: 'linen' },
};

function render(value: Book) {
  const fixture = TestBed.createComponent(Spine);
  fixture.componentRef.setInput('book', value);
  fixture.detectChanges();
  return fixture.nativeElement as HTMLElement;
}

describe('Spine', () => {
  it('is a button labelled for screen readers, with decorative parts hidden', () => {
    const el = render(book);
    const button = el.querySelector('button')!;
    expect(button.type).toBe('button');
    expect(button.getAttribute('aria-label')).toBe(
      'The Metamorphosis by Franz Kafka, 118 pages, reading, 25% read, not on this device',
    );
    expect(el.querySelector('.body')!.getAttribute('aria-hidden')).toBe('true');
  });

  it('can be just a picture, for a spine inside another control', () => {
    const fixture = TestBed.createComponent(Spine);
    fixture.componentRef.setInput('book', book);
    fixture.componentRef.setInput('decorative', true);
    fixture.componentRef.setInput('scale', 0.15);
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('button')).toBeNull();
    const spine = el.querySelector<HTMLElement>('.spine')!;
    expect(spine.getAttribute('aria-hidden')).toBe('true');
    expect(spine.hasAttribute('aria-label')).toBe(false);
    expect(spine.style.width).toBe('3px');
  });

  it('sizes itself from the page count', () => {
    const button = render(book).querySelector('button')!;
    expect(button.style.width).toBe('20px');
    expect(parseInt(button.style.height)).toBeGreaterThanOrEqual(160);
  });

  it('shows the reading line and the offline mark', () => {
    const el = render(book);
    expect((el.querySelector('.read') as HTMLElement).style.transform).toBe('scaleY(0.25)');
    expect(el.querySelector('.body')!.classList).toContain('offline');
    expect(el.querySelector('.mark')).not.toBeNull();
  });

  it('lets the style input override the book', () => {
    const fixture = TestBed.createComponent(Spine);
    fixture.componentRef.setInput('book', { ...book, seriesNumber: 3 });
    fixture.componentRef.setInput('style', 'series');
    fixture.detectChanges();
    expect((fixture.nativeElement as HTMLElement).querySelector('.numeral')?.textContent).toBe('3');
  });
});
