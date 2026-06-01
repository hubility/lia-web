## Session: Agenda views (week/day/month) + brand color correction + flat layout
Date: 2026-05-28
Project: lia-web (.worktrees/lia-web-platform)

## Goal
Build the full agenda with week/day/month views matching the screenshot mockup, then correct
the design system after discovering the previous session had baked in amber tokens that
contradicted the actual Dr. Darcy Mavignier brand (red `#D32F2F` + gray + Montserrat).

## Decisions
- **TimeBlock as first-class model** (kind: lunch | block) instead of hardcoding lunch/break
  rows in the UI. Bloqueios cirúrgicos (the amber tinted "+blocked" cards in the original
  mockup) needed a real entity since they have variable start/end and labels.
- **Color identity = `#D32F2F` (rojo) — full app rebrand.** Previous session's amber
  (`#f59e0b`) tokens came from a generic agenda HTML mockup, not from the client's actual
  brand. Fixed in: light + dark globals.css, deleted the redundant `--amber` token entirely,
  swapped `*-amber` → `*-primary` across 7 component files. Verified PDFs (`lib/pdf/styles.ts`)
  were already using `#D32F2F` — confirming the rest of the app needed to match, not the PDFs.
- **Fonts (Outfit + JetBrains Mono) intentionally diverge from the brand's Montserrat.**
  User preference: app web uses Outfit (more web-native, less print-leaning) and JetBrains
  Mono for tabular nums (hours, GMT, counters). PDFs keep Helvetica + Montserrat-style for
  institutional identity. Documented in memory for future sessions.
- **Procedure color via stable hash of `catalogItem.id` → `chart-1..8`.** Same procedure type
  always gets the same color across sessions and views. Falls back to hashing `title` if no
  catalog item.
- **6-day week (Mon–Sat), 08:00–18:00, `PX_PER_HOUR=48`.** Final values after iteration: user
  initially picked 5 days + 08-20h, then corrected to 6 days + 10h range to fit 720p without
  internal scroll.
- **Agenda is "flat" — no card wrapper, no `overflow-x-auto`, no `min-w`.** If the page needs
  to scroll, it does so at the viewport level. Each view component returns a single `<div>`
  wrapper so the page's `gap-6` flex doesn't insert spacing between sub-sections.
- **Hour gradient line at `y=0` of each hour, not `y=47`.** Original gradient drew a line
  1px before each hour mark, leaving the 08:00 row top with no horizontal line and creating
  a visual gap. Now `repeating-linear-gradient(... var(--border) 0, var(--border) 1px,
  transparent 1px, transparent PX_PER_HOUR)` puts a line exactly at each hour position.
- **Single AppointmentSheet for create + edit.** Same component, `mode: 'create' | 'edit'`
  prop. Status changes are inline pill buttons inside the edit sheet (no separate dropdown).
- **Click-empty-to-create uses 15min snap from `clientY - rect.top`.** Standard calendar UX.
  Ghost preview during hover shows the exact 60min slot that would be created with
  `pointer-events: none` so it doesn't interfere with the move/click handlers.
- **Existing appointments and TimeBlocks have `stopPropagation` on click and hover-clear via
  `e.target !== e.currentTarget`** — without this, hovering or clicking an existing card
  triggers the column-level create handler.

## Work Done
- `prisma/schema.prisma`: `TimeBlock` model + `TimeBlockKind` enum + migration
  `20260528034043_add_timeblock` applied
- `lib/modules/timeblocks/service.ts`: list/create/delete
- `lib/agenda/range.ts`: view + date parsing, week/day/month range boundaries, 6-day week
- `lib/agenda/colors.ts`: stable hash → `var(--chart-N)`
- `app/(dashboard)/agenda/actions.ts`: extended with `createTimeBlockAction` and
  `deleteTimeBlockAction`
- `app/(dashboard)/agenda/page.tsx`: rewritten as server component reading `?view&date`,
  loading appointments + timeblocks + patients + catalog in range
- `components/agenda/agenda-header.tsx`: navigation arrows, range label, HOJE button,
  view tabs (DIA/SEMANA/MÊS), `+ Nova consulta` CTA opening the sheet
- `components/agenda/week-view.tsx`: 6-column grid with hour gutter, day headers with
  today highlight, appointment cards, TimeBlock cards (lunch with stripes, block with
  primary tint), hover ghost preview, click-to-create on empty cells
- `components/agenda/day-view.tsx`: same patterns in single-column layout
- `components/agenda/month-view.tsx`: 7-column calendar grid with appointment dots,
  navigates to day view on click
- `components/agenda/appointment-sheet.tsx`: unified create/edit sheet with status pills
- `app/globals.css`: full color rebrand amber → red, deleted `--amber` token
- 7 component files: `text-amber` / `bg-amber/N` / `border-amber` / `var(--amber)`
  → primary equivalents (`notification-trigger`, `activity-event`, all agenda views,
  `agenda-header`)
- Deleted obsolete `appointment-form.tsx` (replaced by AppointmentSheet)

## Learnings
- **Fragment returns + flex `gap-6` is a footgun.** Returning `<>...</>` with multiple
  divs makes them direct children of the flex parent → the parent's gap applies between
  them. Took two iterations to diagnose (user pointed it out). Lesson: if a component
  returns multiple top-level elements and its parent uses `gap`, wrap in a single `<div>`.
- **`overflow-x: auto` implicitly creates a vertical scroll container in modern browsers.**
  When `overflow-x` is `auto` and `overflow-y` is `visible`, the spec promotes `overflow-y`
  to `auto`. This caused the original "double scrollbar" bug when the grid was slightly
  taller than the viewport — there was no actual horizontal overflow but Windows showed
  a persistent vertical scrollbar inside the calendar container.
- **`bg-color/[0.03]` and `bg-color/3` are equivalent in Tailwind v4** but the linter
  prefers the canonical scale form. The IDE auto-suggests the conversion.
- **The previous session's design tokens were built from a generic mockup, not the brand.**
  Always cross-reference against existing brand artifacts (PDFs, logo board, marketing
  materials) before committing to color tokens. The PDFs at `lib/pdf/styles.ts` had the
  correct `#D32F2F` the whole time — would have caught the mistake immediately if we'd
  checked them first.
- **`procedureColorVar` returns `var(--chart-N)` not a hex.** When using inline `style`
  with CSS variables for `borderLeftColor`, this works fine. Same for the dashed border
  ghost using `border-primary/50` (Tailwind handles the opacity on a CSS variable color
  via color-mix).
- **`e.target !== e.currentTarget` is the cleanest way to detect "hovering an empty area
  of the parent vs. one of its children"** without adding `pointer-events: none` or extra
  refs. Works for both click and mousemove.

## Key Files
.worktrees/lia-web-platform/prisma/schema.prisma
.worktrees/lia-web-platform/prisma/migrations/20260528034043_add_timeblock/migration.sql
.worktrees/lia-web-platform/app/globals.css
.worktrees/lia-web-platform/app/(dashboard)/agenda/page.tsx
.worktrees/lia-web-platform/app/(dashboard)/agenda/actions.ts
.worktrees/lia-web-platform/lib/agenda/range.ts
.worktrees/lia-web-platform/lib/agenda/colors.ts
.worktrees/lia-web-platform/lib/modules/timeblocks/service.ts
.worktrees/lia-web-platform/components/agenda/agenda-header.tsx
.worktrees/lia-web-platform/components/agenda/week-view.tsx
.worktrees/lia-web-platform/components/agenda/day-view.tsx
.worktrees/lia-web-platform/components/agenda/month-view.tsx
.worktrees/lia-web-platform/components/agenda/appointment-sheet.tsx
.worktrees/lia-web-platform/components/dashboard/activity-event.tsx
.worktrees/lia-web-platform/components/layout/notification-trigger.tsx

## Next Session — Drag & Drop on Appointments
Context for a fresh session to implement drag-and-drop on the agenda.

**Scope decisions to make at session start:**
- Library: `@dnd-kit/core` (recommended — works with React/Next 16, accessible, no jQuery)
- Drag scope: (a) move within same day, (b) move across days in WeekView, (c) resize bottom
  edge to change duration, (d) all of the above
- Snap: keep 15min (matches click-to-create snap)
- Collision: silently allow overlap, or block drop if overlaps an existing appointment /
  TimeBlock?
- Optimistic update vs. wait-for-server: optimistic recommended for snappy UX

**Implementation skeleton:**
1. Wrap each day column with `DndContext` + use `useDroppable` / `useDraggable` from dnd-kit
2. `AppointmentCard` becomes a draggable. Drag handle = the whole card. Transform via the
   `transform` prop returned by `useDraggable`
3. On `onDragEnd`: calculate new `startsAt` from the drop target's day + the dragged Y offset
   snapped to 15min. Compute new duration if resize handle was used
4. Wire to a new server action `moveAppointmentAction(id, startsAt, durationMinutes)` —
   reuses `updateAppointment` from service
5. Optimistic: maintain a local Map of `{ id → { startsAt, durationMinutes } }` overrides
   applied at render time. On server success, refresh route. On server error, revert + toast.
6. For resize: add a bottom resize handle to `AppointmentCard` (4px tall strip with
   `cursor-ns-resize`). Use `useDraggable` with a separate id pattern like `${apptId}::resize`.

**Files to touch:**
- `components/agenda/week-view.tsx` — main DndContext + droppable columns
- `components/agenda/day-view.tsx` — same patterns single column
- `components/agenda/appointment-card.tsx` — extract from week-view.tsx, make draggable
- `app/(dashboard)/agenda/actions.ts` — add `moveAppointmentAction`
- `package.json` — add `@dnd-kit/core` (and optionally `@dnd-kit/modifiers` for snap-to-grid)

**Watchouts:**
- Don't let drag trigger the column's click handler (it shouldn't, but verify with stopPropagation)
- Hover ghost must hide during drag — listen to `useDndMonitor` `onDragStart`
- Mobile/touch: dnd-kit supports it out of the box but test the long-press activation
- Existing `e.stopPropagation` and `e.target !== e.currentTarget` patterns should keep working

**Read first when resuming:**
- `components/agenda/week-view.tsx` to understand current structure (handlers, state, sub-components)
- This session record
- The brand memory at `~/.claude/projects/.../memory/project_branding.md`
