# Alcove · build spec v1.0

This is the written spec for building Alcove in Angular (PWA) and on Android through Capacitor. Everything is one shared UI. Values come from [`tokens.css`](tokens.css) (`--alc-*`) and [`tokens.json`](tokens.json). The visual reference is the Alcove design canvas, starting with its **Design system · v1.0** board.

Chosen directions: **Library A** (built-in bookcase), **Reader A** (an open book on its shelf, two-page spread on wide screens), **Book detail A** (cover in its own bay).

---

## 1. Principles

1. **The objects are the interface.** Shelves, spines, covers and pages carry the navigation. Chrome uses the same materials: wood, paper and cloth.
2. **One lamp, upper left.** Highlights fall on top-left edges and shadows fall down and to the right, everywhere, in both themes.
3. **Quiet until needed.** Surfaces are matte, dividers are hairlines, and there is one accent colour (sage). Amber is reserved for progress and anything that needs your attention.
4. **A book always knows where it lives.** Its slot on the shelf stays empty while you read it. The reader's back control names that shelf and shows the book's spine.

## 2. Theming

| Attribute | Values | Default | Notes |
|---|---|---|---|
| `html[data-theme]` | `dark`, `light`, `system` | `dark` | Walnut and Oak. `system` follows `prefers-color-scheme`. |
| `[data-paper]` on the reader | `paper`, `sepia`, `slate`, `night` | `slate` | Changes only the page. The cloth boards, the shelf and the room stay. |
| Lamp light | on, off | on | Off sets `--alc-glow` to transparent. |
| Density | comfortable, compact | comfortable | Compact multiplies spine heights by 0.85 and shelf padding by 0.75. |

- The app theme and the reading theme are independent of each other.
- Every text pair meets **4.5:1**. The ratios are noted in `tokens.css`.
- In light mode the lamp colour is `#A64B30`, not the brief's `#B5573A`, which only reaches 4.3:1.

## 3. Layout

- Breakpoints: **phone ≤ 599 px**, **tablet 600–1023 px**, **desktop ≥ 1024 px**.
- **Desktop:** a 72 px side rail with Library, Collections, Search and Import at the top and Sync and Settings at the bottom. A collections sidebar (248 px) appears on the Library and Search screens.
- **Phone:** a 64 px bottom bar plus the safe-area inset, with Library, Collections, Search, Sync and Settings. Import opens from a **+** in the Library header.
- **Tablet:** the side rail with no sidebar. The reader shows one page in portrait and two in landscape when the window is at least 960 px wide. *Tablet frames are not drawn yet.*
- Screen gutters are 16, 24 and 40 px (phone, tablet, desktop). All spacing uses an 8 px grid.

## 4. Components

Component names match the Angular selectors. Each one is standalone, uses OnPush, and takes signal inputs. Anything a pointer can do, keyboard and touch can do too.

### 4.1 `alc-spine`
The spine is generated in the UI. It never uses an image.

- **Inputs:** `book` (title, author, pages, status, progress, offline state, series number), `style` (`cloth`, `paper`, `bold`, `band`, `series`), `color`, `scale = 1`.
- **Width:** `round((16 + pages × 0.034) × scale)` px. For example, 118 pages → 20 px and 1023 pages → 51 px.
- **Height:** 160–206 px. It is seeded from the book id, so a book's height never changes between visits.
- **Title fitting:**
  - The title runs vertically, top to bottom (`writing-mode: vertical-rl`).
  - The font size is the style's base size, capped at 0.56 × width and never below 8 px.
  - If the title and author together don't fit, drop the author first, then shrink the title.
  - Character width factors for the fit: 0.56 for serif styles, 0.82 for the caps styles.
- **Style details:**
  - `cloth` has two thin foil rules near the head and a woven texture.
  - `band` has a colour band covering the top 20%.
  - `series` has a numeral in a circle near the head.
  - Every style gets a subtle rounded-shading gradient.
- **States** (a mark at the foot of the spine):
  - New: a 6 px sage dot.
  - Reading: a 2 px amber line from the foot up, matching the share read.
  - Finished: a check mark.
  - Downloading: a progress ring, with the spine at 72% opacity.
  - Not on device: a cloud.
- **Interaction:** it is a `<button>`. Hover, focus and press lift it `--alc-lift` over 180 ms, animating transform only. Focus shows the standard ring.
- **Screen readers:** the `aria-label` is "{title} by {author}, {pages} pages, {status}".

### 4.2 `alc-cover`
- 2:3 box, `object-fit: cover`, lazy-loaded with `loading="lazy"`, `decoding="async"` and a blurred-colour placeholder taken from the dominant colour.
- Inner left shade of 2 px, then shadow `--alc-elev-1`.
- **Fallback when the EPUB has no cover:** the raised surface with a 1 px frame, the Alcove arch mark in lamp colour, the title in Fraunces and the author in small caps.
- **Progress:** a 3 px amber bar along the bottom edge.
- **Badges** (light theme covers view): a 20 px paper circle at the bottom-right showing the state.

### 4.3 `alc-bookcase` and `alc-shelf-row`
- **Cabinet:** wood side panels 14 px wide and a 14 px top board.
- **Bays:** sit in a grid with 12 px wood dividers, using the column template `1.35fr 1fr 1fr` on desktop.
- **Inside a bay:** the bay colour, the lamp radial from the top-left, and an inset shadow under the board above.
- **Spines in a bay:** bottom-aligned with 2 px between them, followed by a bookend (5 px wide, matte metal).
- **Board:** 16 px tall, made of a 3 px lit top, a 9 px front and a 4 px shadowed underside, with `--alc-board-shadow` below it.
- **Shelf label:** inside the bay at the top-left, in the shelf-label type, with the book count in muted ink. The label is a link to the collection.
- **Empty bay:** only the bookend, plus a dashed `--alc-hairline-strong` slot and one line of text.
- **Performance:**
  - Virtualise by shelf row with the CDK virtual scroll; a row is one unit.
  - Never put more than two shadow layers on a book.
  - Never use `backdrop-filter`.

### 4.4 Currently reading ledge
- Covers stand face-out on a single board above the bookcase, 104 px wide on desktop and 80 px on phone.
- Desktop shows the meta to the right of each cover: title, author, a 3 px progress bar, "{pct}% · {time left}" and a **Continue** link.
- Phone shows the percentages under the board.

### 4.5 `alc-book-spread` (reader)
- **Cloth boards:** the book's own spine colour with the cloth texture, 14 px on desktop and 7 px on phone.
- **Pages:** each page has a 10% gutter shade on its inner edge and a faint darkening toward the bottom-right.
- **Page-edge stacks:**
  - Alternating 1 px lines of `--alc-page-edge` and `--alc-page-edge-dark`.
  - The read side (left) has `max(1, round(read × 8))` layers; the unread side (right) has the rest, up to 8.
  - There is no ribbon bookmark.
- **Page furniture:**
  - Running heads in 10 px caps with 0.22em tracking: the book title on the left page, the chapter on the right.
  - Folios in Fraunces italic.
  - The chapter opener is "Chapter N" in caps, then the name in Fraunces italic, a 36 px amber rule, and a drop cap in the accent colour.
- **Layout:** paginated by default with a 60–75 character measure. Two pages side by side when wide; one page on phone. Scroll mode is a setting.
- **Reserved, not shown in v1:** a quiet right-hand gutter on desktop and a long-press menu on phone, both for highlights and notes later.

### 4.6 `alc-shelf-progress`
- A `role="slider"` on the front edge of the board the book rests on.
- 2 px track in `rgba(0,0,0,.38)`, the read part in lamp amber, 1 px notches for chapter starts, and a 14 px amber knob with a 3 px halo.
- 44 px tall hit area. Drag to scrub; the arrow keys move a page and Page Up/Down move a chapter.
- `aria-valuetext` is "Page {n} of {total}, chapter {c}, {name}".
- Always visible, even when the reader is at rest.
- Labels sit under the board and only appear while the controls are revealed: chapter name, page, and time left in the chapter.

### 4.7 Reader controls
- Hidden at rest. Tapping the middle third of the page shows or hides them. The left and right edges, the arrow keys and swipes turn pages.
- **Left:** a back pill showing the book's spine, reading "Back to {shelf}".
- **Centre:** the title in Fraunces with the author.
- **Right:** one paper pill containing **Contents** and **Aa**.
- Phone uses the same controls, as a single floating paper bar at the top.

### 4.8 `alc-popover` and `alc-sheet`
- **Popover (desktop):** 360–380 px wide, `--alc-paper`, `--alc-elev-3`, 10 px radius, with an arrow pointing to its trigger. Only one is open at a time. It closes on Escape, an outside click, or pressing its trigger again, and focus goes back to the trigger.
- **Sheet (phone):** the same content in a bottom sheet with a 36 × 4 px handle and the scrim. It closes when you drag it down, tap the scrim, or tap Close. It traps focus and has `aria-modal="true"`.
- **Contents:** chapter rows at least 44 px tall, with the number in Fraunces italic, the title in Literata, and the page on the right. The current chapter gets an amber ribbon tab, a lamp-soft fill and "You're here". Picking a chapter closes the panel.
- **Typography:**
  - Sample (desktop only): a live sample page in the current paper. On phone, the book behind the sheet is the live preview.
  - Paper swatches.
  - Typeface, in four tiles.
  - Size: a slider from 14 to 28 px.
  - Line height: compact 1.4, normal 1.6, loose 1.8.
  - Margins: narrow, medium, wide (16, 24 and 34 px on phone).
  - Alignment: left or justified.
  - Layout: one page, spread or scroll.
  - Hyphenation switch.

### 4.9 Controls
| Component | Spec |
|---|---|
| `alc-button` | 44–48 px tall, 8 px radius. Primary is accent on on-accent. Secondary is a `--alc-hairline-strong` border on transparent. Ghost is accent text. Danger is a danger border with danger text, and only for destructive actions. Pressed moves 1 px down. Disabled uses raised with 55% ink. |
| `alc-segmented` | 3 px inset track on paper with a hairline. The selected segment is `--alc-seg-on` with ink text; the others are muted. Each segment is 36–38 px tall inside a 44 px hit area. Uses `role="radiogroup"`. |
| `alc-switch` | 36 × 22 px track and a 16 px knob, accent when on. It is a `<button role="switch">` with the whole row as its label. |
| `alc-chip` (filter) | 36 px tall, 6 px radius. Selected adds an accent border, a 12–14% accent fill and a check icon. Shows a count in muted ink. Uses `aria-pressed`. |
| `alc-tag` | 26–28 px tall, raised fill, 12 px text. |
| `alc-status-badge` | Reading has a mini amber bar plus "Reading 38%". New has a sage dot. To read has a hollow dot. Finished has a check. Downloading has a ring. Not on device has a cloud. Never shown by colour alone. |
| `alc-search` | 44 px (60 px on the Search screen), paper fill. Focus adds an accent border and a 3 px accent halo at 16–18%. Has a `/` shortcut hint and a clear button. Matches are wrapped in `<mark>` with a lamp tint at 28%. |
| `alc-side-rail` / `alc-bottom-bar` | Icon plus an 11 px label. The active item gets accent, `aria-current="page"` and, on the rail, a raised pill. Sync shows an amber dot when offline or when something needs you. |
| `alc-collection-tile` | A miniature bay with the collection's real spines at 0.66 scale, then the name in Fraunces 20 and the count. Arrange mode adds a 44 px drag handle; the arrow keys move a focused handle. |
| `alc-alert-card` | Lamp-soft fill with a lamp-line border, an icon plus a short heading in amber, one sentence, and two or three answers as buttons. Used for sync conflicts and import duplicates. Never a modal. |
| `alc-toast` | Raised fill, `--alc-elev-3`, sits above the bottom bar. `role="status"`. Disappears after 6 s, pausing on hover or focus. Has at most one action, such as Undo or OK. |
| `alc-empty-bay` | An empty bay with the leaning bookend and a dashed slot, a Fraunces line, one sentence and one primary action. Used for first run, an empty shelf and no search results. |

Icons are line icons on a 24 px grid with a 1.5 px stroke and round caps. Icon-only buttons always have an `aria-label`.

## 5. Motion

| Moment | Spec |
|---|---|
| Lift | `translateY(-4px)` over 180 ms with `--alc-ease`, on hover, focus and press. |
| **Open a book** | About 780 ms in three overlapping steps. **Lift** runs 0–180 ms. **Forward** runs 120–540 ms: the spine turns to its cover, grows toward the centre, and the room dims to 92%. **Spread** runs 400–780 ms: the front board swings open and the pages fade in after a 120 ms delay over 320 ms. The reader's shelf board fades in. |
| **Close a book** | About 640 ms. **Fold** to the cover runs 0–300 ms. **Home** runs 220–640 ms: the book shrinks into its empty slot, the slot's hairline brightens to sage just before it lands, and the spine's progress line updates. |
| Page turn | 200 ms fade plus a 24 px slide. Swipes follow the finger. |
| Sheet | 280 ms slide up, with the scrim fading in over 200 ms. |
| Reduced motion | Every movement becomes a 200 ms crossfade. Lifts are removed. |

**How to build the open and close animation:**
- Animate one element only: the travelling book. The shelf and the reader underneath stay still.
- Use FLIP. Render the reader at its final size, measure the spine's rectangle, then animate **transform and opacity only**. Never animate width or height.
- Use Angular `withViewTransitions()` where the browser supports it, and an overlay layer at `--alc-z-transition` everywhere else.
- Fetch the saved chapter when the press starts. The book opens at that position with no prompt. If the text isn't ready when the book finishes opening, keep the spread showing with a quiet shimmer on the page.
- Focus moves to the first line of text when the book opens and back to the spine when it closes. Announce "Opened {title}, chapter {n}" and "Back on {shelf}".

## 6. Screen inventory

| Screen | Boards | Notes |
|---|---|---|
| Library | Library A desktop and phone | Spines and covers toggle, status chips, sort, filter, collections sidebar on desktop and sheet on phone. |
| Reader | Reader A desktop, phone, typography sheet, themes | Contents and Aa are popovers on desktop and sheets on phone, hidden by default. |
| Book detail | Detail A desktop and phone | On phone the reading card is fixed above the bottom bar. |
| Collections | Overview, one shelf, phone | Grid or list, Arrange, and three automatic shelves: Currently reading, Finished, Unshelved. |
| Search | Desktop and phone | Live search over title and author. Filters for status, tags, series, format and on-device. Recent searches. Empty state. |
| Import | Desktop and phone | Empty, dragging, queue, duplicate card (Replace, Keep both, Skip), review with a live spine and cover preview. |
| Sync | Desktop and phone | Devices shown as small shelves, a reading-position conflict card, per-book offline controls. |
| Settings | Desktop and phone | App theme, density, lamp, motion, reading defaults, library defaults, account. |
| Empty states | First run, offline, empty shelf, first import, no results | |
| Transition | Storyboard and prototype | Timings as in section 5. |

## 7. Accessibility checklist

- Text contrast is at least 4.5:1 in both app themes and all four papers.
- Every control is a real `<button>`, `<a>` or `<input>`, with a 44 px hit area.
- Focus is a 2 px accent outline with a 3 px offset. Spines and covers get it too.
- Spines and covers have descriptive labels (see 4.1). Decorative wood, edges and texture are `aria-hidden`.
- Status is never shown by colour alone: there is always an icon, a word or a shape.
- Live regions: search result counts (polite), sync status, toasts.
- Reduced motion is handled as in section 5.

## 8. Offline

- Books not on the device are shown at 42% opacity with saturation at 0.4 and a cloud mark. They stay clickable, and tapping one explains that it will download when you're back online.
- Reading positions queue up and sync later.
- If two devices disagree on a reading position, show `alc-alert-card` with both positions. The one you don't choose is kept in the book's history for 7 days.

## 9. Open items

- **Tablet frames** (820 px) are not drawn yet. The layout rules are in section 3.
- **Default paper:** the brief says Slate. The reader boards preview Paper. Confirm before building.
- **Highlights and notes:** space is reserved (section 4.5), but nothing is designed yet.
