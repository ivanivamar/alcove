/** A shelf in the bookcase: one collection, shown as one bay (spec §4.3). */
export interface Shelf {
  readonly id: string;
  readonly name: string;
  /** Book ids in shelf order, left to right. */
  readonly bookIds: readonly string[];
  /** Where the shelf label links to: the collection's own screen. */
  readonly route: string;
}
