import tokens from '../../../design/tokens.json';

/** A reading paper, `[data-paper]` in tokens.css. Independent of the app theme (spec §2). */
export type Paper = keyof typeof tokens.paper;

export const PAPERS = Object.keys(tokens.paper) as readonly Paper[];

/** The paper tokens.json marks as the default: Slate, as the brief asks (spec §9). */
export const DEFAULT_PAPER: Paper =
  PAPERS.find((paper) => 'default' in tokens.paper[paper]) ?? 'slate';

export function isPaper(value: unknown): value is Paper {
  return (PAPERS as readonly unknown[]).includes(value);
}
