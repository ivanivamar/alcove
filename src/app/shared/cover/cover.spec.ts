import { TestBed } from '@angular/core/testing';
import { Book } from '../../core/book';
import { Cover } from './cover';

const book: Book = {
  id: 'bk-middlemarch',
  title: 'Middlemarch',
  author: 'George Eliot',
  pages: 880,
  status: 'reading',
  progress: 0.18,
  offline: { kind: 'on-device' },
  spine: { style: 'cloth', color: 'oxblood' },
};
const withCover: Book = { ...book, cover: { src: 'covers/middlemarch.svg', color: '#3B5644' } };

function render(value: Book, width = 104) {
  const fixture = TestBed.createComponent(Cover);
  fixture.componentRef.setInput('book', value);
  fixture.componentRef.setInput('width', width);
  fixture.detectChanges();
  return { fixture, el: fixture.nativeElement as HTMLElement };
}

describe('Cover', () => {
  it('is a 2:3 image named by title, author and progress', () => {
    const { el } = render(book);
    expect(el.getAttribute('role')).toBe('img');
    expect(el.getAttribute('aria-label')).toBe('Middlemarch by George Eliot, 18% read');
    expect(el.style.width).toBe('104px');
  });

  it('leaves the progress out of the name when the book is not being read', () => {
    const { el } = render({ ...book, status: 'to-read', progress: 0 });
    expect(el.getAttribute('aria-label')).toBe('Middlemarch by George Eliot');
  });

  describe('fallback', () => {
    it('draws the mark, the title and the author when there is no image', () => {
      const { el } = render(book);
      expect(el.querySelector('img')).toBeNull();
      expect(el.querySelector('.fallback')).not.toBeNull();
      expect(el.querySelector('alc-icon.mark')).not.toBeNull();
      expect(el.querySelector('.title')!.textContent!.trim()).toBe('Middlemarch');
      expect(el.querySelector('.author')!.textContent).toBe('George Eliot');
    });

    it('breaks a long title into fitted lines', () => {
      const { el } = render({ ...book, title: 'Twenty Thousand Leagues Under the Seas' }, 80);
      const lines = [...el.querySelectorAll('.title .line')].map((l) => l.textContent);
      expect(lines.length).toBeGreaterThan(1);
      expect(lines.join(' ')).toBe('Twenty Thousand Leagues Under the Seas');
    });

    it('takes over when the image fails to load', () => {
      const { fixture, el } = render(withCover);
      el.querySelector('img')!.dispatchEvent(new Event('error'));
      fixture.detectChanges();
      expect(el.querySelector('img')).toBeNull();
      expect(el.querySelector('.fallback')).not.toBeNull();
    });
  });

  describe('image', () => {
    it('loads lazily and asynchronously over its dominant colour', () => {
      const { el } = render(withCover);
      const img = el.querySelector('img')!;
      expect(img.getAttribute('src')).toBe('covers/middlemarch.svg');
      expect(img.getAttribute('loading')).toBe('lazy');
      expect(img.getAttribute('decoding')).toBe('async');
      expect(img.alt).toBe('');
      expect((el.querySelector('.placeholder') as HTMLElement).style.backgroundColor).toBe(
        'rgb(59, 86, 68)',
      );
      expect(el.querySelector('.fallback')).toBeNull();
    });

    it('is marked loaded once the image arrives', () => {
      const { fixture, el } = render(withCover);
      expect(el.classList).not.toContain('loaded');
      el.querySelector('img')!.dispatchEvent(new Event('load'));
      fixture.detectChanges();
      expect(el.classList).toContain('loaded');
    });
  });

  describe('progress', () => {
    it('shows a bar along the bottom as long as the share read', () => {
      const { el } = render(book);
      const read = el.querySelector('.progress .read') as HTMLElement;
      expect(read.style.transform).toBe('scaleX(0.18)');
    });

    it('has no bar unless the book is being read', () => {
      expect(render({ ...book, status: 'finished', progress: 1 }).el.querySelector('.progress')).toBeNull();
      expect(render({ ...book, status: 'new', progress: 0 }).el.querySelector('.progress')).toBeNull();
    });
  });
});
