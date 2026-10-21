# Alcove

A book library and EPUB reader that looks and feels like a built-in bookcase. Your books stand on wooden shelves as generated spines, open into a two-page spread on their own shelf, and go back to the same slot when you close them.

Alcove is one shared UI built in **Angular** as a **PWA**, and shipped to **Android** through **Capacitor**.

> **Status:** design phase. The build spec v1.0 and the design tokens are done; there is no application code yet.

## Design principles

1. **The objects are the interface.** Shelves, spines, covers and pages carry the navigation. Chrome uses the same materials: wood, paper and cloth.
2. **One lamp, upper left.** Highlights fall on top-left edges and shadows fall down and to the right, in both themes.
3. **Quiet until needed.** Matte surfaces, hairline dividers, one accent colour (sage). Amber is only for progress and things that need your attention.
4. **A book always knows where it lives.** Its slot stays empty while you read it, and the reader's back control names that shelf.

## What's in v1

| Area | What it covers |
|---|---|
| **Library** | A bookcase of shelves with generated spines (or a covers view), a "currently reading" ledge, status chips, sort, filter and a collections sidebar. |
| **Reader** | An open book with cloth boards and page-edge stacks. Paginated, with a two-page spread on wide screens, one page on phone, and an optional scroll mode. Contents and typography (Aa) panels. A shelf-edge progress slider. |
| **Book detail** | The cover in its own bay with reading progress and actions. |
| **Collections** | Your own shelves plus three automatic ones: Currently reading, Finished and Unshelved. Grid or list, with an Arrange mode. |
| **Search** | Live search over title and author, with filters for status, tags, series, format and on-device. |
| **Import** | Drag-and-drop EPUB import with a queue, duplicate handling (Replace, Keep both, Skip) and a live spine and cover preview. |
| **Sync & offline** | Devices shown as small shelves, per-book offline controls, queued reading positions and a conflict card when two devices disagree. |
| **Settings** | App theme, density, lamp light, motion, reading defaults, library defaults and account. |

Highlights and notes are out of scope for v1; space is reserved for them in the reader.

## Theming

- **App theme:** `html[data-theme="dark|light|system"]`. Dark (Walnut) is the default; light is Oak.
- **Reading theme:** `[data-paper="paper|sepia|slate|night"]` on the reader, chosen independently of the app theme. It changes only the page.
- **Lamp light** on or off, and **density** comfortable or compact.
- Every text pair meets WCAG **4.5:1** contrast in both app themes and all four papers.

Fonts: **Fraunces** (display), **DM Sans** (UI) and **Literata** (reading), with Source Serif 4, Atkinson Hyperlegible and DM Sans as reading alternatives.

## Layout

| Breakpoint | Width | Navigation |
|---|---|---|
| Phone | ≤ 599 px | 64 px bottom bar; Import opens from **+** in the Library header |
| Tablet | 600–1023 px | Side rail, no sidebar; spread in landscape at ≥ 960 px |
| Desktop | ≥ 1024 px | 72 px side rail plus a 248 px collections sidebar on Library and Search |

Gutters are 16 / 24 / 40 px, and all spacing sits on an 8 px grid.

## Building guidelines

- Components are **standalone**, **OnPush** and use **signal inputs**. Selectors use the `alc-` prefix (`alc-spine`, `alc-bookcase`, `alc-book-spread`, …).
- Take every colour, size and timing from the tokens (`--alc-*`). Don't hard-code values.
- Spines are generated in the UI, never images. Width scales with page count; height is seeded from the book id so it never changes.
- Shelves are virtualised by row with the CDK virtual scroll. No more than two shadow layers per book, and no `backdrop-filter`.
- Animate **transform and opacity only**. The open/close-a-book transition uses FLIP, with `withViewTransitions()` where supported and an overlay layer elsewhere.
- Everything a pointer can do, keyboard and touch can do too. Real `<button>`/`<a>`/`<input>` elements, 44 px hit areas, a visible focus ring, and status never shown by colour alone.
- Respect `prefers-reduced-motion`: every movement becomes a 200 ms crossfade.

## Repository layout

```
design/
  SPEC.md       Build spec v1.0: components, motion, screens, accessibility, offline
  tokens.css    Design tokens as CSS custom properties (source of truth for the build)
  tokens.json   The same tokens for tooling (Style Dictionary, Figma import, tests)
```

Start with [design/SPEC.md](design/SPEC.md). Values come from [design/tokens.css](design/tokens.css) and [design/tokens.json](design/tokens.json); keep the two in sync.

## Open items

- **Tablet frames** (820 px) are not drawn yet; the layout rules above apply.
- **Default paper:** the brief says Slate, the reader boards preview Paper. To be confirmed before building.
- **Highlights and notes:** space is reserved, nothing designed yet.
