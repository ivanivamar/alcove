import { MOCK_SHELVES } from './mock-shelves';
import { backLabel, shelfOf } from './shelf';

describe('shelfOf', () => {
  it('finds the shelf a book sits on', () => {
    expect(shelfOf('bk-moby', MOCK_SHELVES)?.name).toBe('Nineteenth century');
    expect(shelfOf('bk-scarlet', MOCK_SHELVES)?.name).toBe('Detectives');
  });

  it('finds nothing for a book on no shelf', () => {
    expect(shelfOf('bk-unshelved', MOCK_SHELVES)).toBeUndefined();
    expect(shelfOf('bk-moby', [])).toBeUndefined();
  });
});

describe('backLabel', () => {
  it('names the shelf', () => {
    expect(backLabel(shelfOf('bk-leagues', MOCK_SHELVES))).toBe('Back to Voyages');
  });

  it('falls back to the library for a book on no shelf', () => {
    expect(backLabel(undefined)).toBe('Back to library');
    expect(backLabel(shelfOf('bk-moby', []))).toBe('Back to library');
  });
});
