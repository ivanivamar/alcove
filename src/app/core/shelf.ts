/** A shelf in the bookcase: one collection, shown as one bay (spec §4.3). */
export interface Shelf {
  readonly id: string;
  readonly name: string;
  /** Book ids in shelf order, left to right. */
  readonly bookIds: readonly string[];
  /** Where the shelf label links to: the collection's own screen. */
  readonly route: string;
}

/** The shelf a book sits on, if any. */
export function shelfOf(bookId: string, shelves: readonly Shelf[]): Shelf | undefined {
  return shelves.find((shelf) => shelf.bookIds.includes(bookId));
}

/** The reader's back control: "Back to {shelf}", or the library for a book on no shelf. */
export function backLabel(shelf: Shelf | undefined): string {
  return `Back to ${shelf?.name ?? 'library'}`;
}
