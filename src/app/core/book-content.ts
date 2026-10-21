/**
 * A book's text, as the reader lays it out. Until EPUB parsing exists this is a flat list of
 * chapters with plain paragraphs; the parser will produce the same shape.
 */
export interface BookContent {
  readonly bookId: string;
  readonly chapters: readonly Chapter[];
}

export interface Chapter {
  /** As printed in the opener: "Chapter {number}". */
  readonly number: number;
  /** The opener's italic line and the right-hand running head. */
  readonly name: string;
  readonly paragraphs: readonly string[];
}
