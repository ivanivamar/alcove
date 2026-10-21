import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { Chapter } from '../../core/book-content';

/**
 * One chapter of the reader's text: the opener ("Chapter N", the name, an amber rule) and the
 * paragraphs, the first with a drop cap. It sits in alc-book-spread's column flow, so it starts
 * on a new page. The heading and paragraphs are `data-block`s, the places focus can land.
 */
@Component({
  selector: 'alc-chapter-text',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <h2 class="opener" data-block data-chapter-start tabindex="-1">
      <span class="number">Chapter {{ chapter().number }}</span>
      <span class="alc-visually-hidden">: </span>
      <span class="name">{{ chapter().name }}</span>
    </h2>
    <span class="rule" aria-hidden="true"></span>
    @for (paragraph of chapter().paragraphs; track $index) {
      <p data-block tabindex="-1">{{ paragraph }}</p>
    }
  `,
  styles: `
    :host {
      display: block;
      padding-top: var(--alc-space-6);
      break-before: column;
    }
    .opener {
      display: flex;
      flex-direction: column;
      gap: var(--alc-space-2);
      margin: 0;
      break-after: avoid;
      font-weight: inherit;
    }
    .number {
      color: var(--alc-page-muted);
      font: var(--alc-type-caption);
      letter-spacing: var(--alc-tracking-caption);
      text-transform: uppercase;
    }
    .name {
      font: var(--alc-type-chapter);
    }
    .rule {
      display: block;
      width: var(--alc-chapter-rule);
      height: var(--alc-chapter-rule-weight);
      margin-block: var(--alc-space-4);
      background: var(--alc-page-accent);
    }
    p {
      margin: 0;
      text-indent: 1.5em;
      text-wrap: pretty;
    }
    .rule + p {
      text-indent: 0;
    }
    .rule + p::first-letter {
      float: left;
      margin: 0.06em var(--alc-space-2) 0 0;
      color: var(--alc-page-accent);
      font-family: var(--alc-font-display);
      font-size: calc(var(--alc-drop-cap-lines) * 1lh * 0.84);
      line-height: 1;
    }
    @supports (initial-letter: 3) {
      .rule + p::first-letter {
        float: none;
        margin: 0 var(--alc-space-2) 0 0;
        font-size: inherit;
        initial-letter: var(--alc-drop-cap-lines);
      }
    }
    /* Focus lands here to mark the reading position; it isn't a control, so no ring. */
    [data-block]:focus {
      outline: none;
    }
  `,
})
export class ChapterText {
  readonly chapter = input.required<Chapter>();
}
