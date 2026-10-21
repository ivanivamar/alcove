import tokens from '../../../design/tokens.json';

export type BookStatus = 'new' | 'to-read' | 'reading' | 'finished';

/** Whether the EPUB is stored on this device (spec §8). */
export type OfflineState =
  | { readonly kind: 'on-device' }
  | { readonly kind: 'downloading'; readonly progress: number }
  | { readonly kind: 'not-on-device' };

export type SpineStyle = 'cloth' | 'paper' | 'bold' | 'band' | 'series';

/** A cloth from the spine palette, `--alc-cloth-{name}` in tokens.css. */
export type SpineColor = keyof typeof tokens.spine.cloth;

export interface Book {
  readonly id: string;
  readonly title: string;
  readonly author: string;
  readonly pages: number;
  readonly status: BookStatus;
  /** Share read, 0–1. */
  readonly progress: number;
  readonly offline: OfflineState;
  readonly seriesNumber?: number;
  readonly spine: { readonly style: SpineStyle; readonly color: SpineColor };
  /** The EPUB's cover image, if it has one. Without it, alc-cover draws a fallback. */
  readonly cover?: BookCover;
  /** When the book was last opened in the reader, ISO 8601. Orders the currently reading ledge. */
  readonly lastOpened?: string;
}

export interface BookCover {
  readonly src: string;
  /** The image's dominant colour, shown blurred until the image loads. */
  readonly color: string;
}
