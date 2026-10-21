import { TestBed } from '@angular/core/testing';
import { Chapter } from '../../core/book-content';
import { ChapterText } from './chapter-text';

const chapter: Chapter = {
  number: 2,
  name: 'The Carpet-Bag',
  paragraphs: ['I stuffed a shirt or two into my old carpet-bag.', 'As most young candidates…'],
};

function render() {
  const fixture = TestBed.createComponent(ChapterText);
  fixture.componentRef.setInput('chapter', chapter);
  fixture.detectChanges();
  return fixture.nativeElement as HTMLElement;
}

describe('ChapterText', () => {
  it('opens with an h2 reading "Chapter N", then the name', () => {
    const h2 = render().querySelector('h2')!;
    expect(h2.querySelector('.number')!.textContent).toBe('Chapter 2');
    expect(h2.querySelector('.name')!.textContent).toBe('The Carpet-Bag');
    // The hidden colon makes it read as one heading: "Chapter 2: The Carpet-Bag".
    expect(h2.textContent).toBe('Chapter 2: The Carpet-Bag');
    expect(h2.hasAttribute('data-chapter-start')).toBe(true);
  });

  it('follows the name with a decorative rule, then the paragraphs in order', () => {
    const el = render();
    const rule = el.querySelector('.rule')!;
    expect(rule.getAttribute('aria-hidden')).toBe('true');
    expect(rule.previousElementSibling!.tagName).toBe('H2');
    expect(rule.nextElementSibling!.tagName).toBe('P');
    expect([...el.querySelectorAll('p')].map((p) => p.textContent)).toEqual(chapter.paragraphs);
  });

  it('lets focus land on the heading and paragraphs without adding tab stops', () => {
    const blocks = [...render().querySelectorAll('[data-block]')];
    expect(blocks.map((b) => b.tagName)).toEqual(['H2', 'P', 'P']);
    expect(blocks.every((b) => b.getAttribute('tabindex') === '-1')).toBe(true);
  });
});
