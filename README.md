# Sapawoo

A lightweight clone of the main TaskFord surfaces: **Site → Board → View → Task**.
Frontend only — every mutation is kept in `localStorage`, there is no API, no database and no auth.

## Run

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # tsc -b && vite build
npm run test       # vitest
npm run lint       # oxlint
```

## What is cloned

**App shell** — sidebar (site header, nav, starred boards, all boards with star toggle), top bar with
breadcrumbs and light/dark toggle.

**Dashboard** — total / in progress / done / overdue stat cards, tasks-by-status pie,
open-tasks-per-assignee bar, "Due soon" list.

**Boards** — board grid with per-board progress, create-board dialog (seeds the 5 default statuses and
both views).

**View toolbar** (shared by both views, mirrors TaskFord's `view-settings`):
`New task · avatar filter · search · Filters · Sort · Group · Display · Collapse all`, plus a row of
removable filter chips with a "showing X of Y" count.

- **Search** — debounced, matches key, summary and description; `/` focuses it from anywhere.
- **Filters** — multi-select status / assignee (with an *Unassigned* bucket) / priority, and a due-date
  preset (overdue, today, this week, this month, no due date). Fields combine with AND.
- **Sort** — multi-rule sorting (key, summary, status, priority, due date, created, updated), each rule
  asc/desc; table headers drive the same rules.
- **Group** — status, assignee, priority (and *none* in the table).
- **Display** — per-view visible fields/columns, comfortable/compact density, show or hide empty groups.

Every setting is stored **per view** (board × kanban/table) and survives a reload, the way
`BoardView` config does in TaskFord.

**Kanban** — drag & drop on `@atlaskit/pragmatic-drag-and-drop` (same library TaskFord uses): cards
drag between and within columns with a closest-edge drop indicator, auto-scroll on the board and inside
columns, and columns themselves reorder by their grip handle (persisted as `BoardStatus.rank`).
Columns collapse individually or all at once, carry a WIP limit that turns the header red when
exceeded, an action menu, and inline composers at the top and bottom.

**Table** — rows grouped by the current group-by, collapsible per group, sortable headers, inline edit
of summary (double-click), status, priority, assignees and due date, row drag-and-drop to reorder or
move across groups, per-row action menu, and multi-select with a floating bulk bar (set status, set
priority, delete).

**Task detail** — dialog with summary, description, status, priority, due date, multi-assignee toggle,
comments and delete.

**Sapa (AI assistant)** — a floating launcher that opens as a docked side panel, a floating panel or a
full-screen page at `/assistance`. Threads and layout are remembered; each reply streams token by token.
Sapa reads the board you are looking at (statuses, members, every task with status, priority, assignees
and due date) and answers with task keys. When you ask it to change the board it does not act silently —
it returns a **proposed-changes card** listing each create/update/delete, which you review and apply
yourself. Suggested prompts cover risks and blockers, a status update and sprint planning.

**AI filter** — the toolbar's *AI filter* takes plain language ("overdue work assigned to An that is not
done") and turns it into the same status / assignee / priority / due-date filters you can set by hand,
so the result is transparent and editable as chips.

Both run on the [Groq](https://groq.com) API through `api/chat.ts`, a serverless function that holds the
key server-side and streams the response back — the browser only ever talks to `/api/chat`, so the key
never reaches the client bundle. Copy `.env.example` to `.env.local` and set `GROQ_API_KEY` (optionally
`GROQ_MODEL`, default `openai/gpt-oss-120b`); `npm run dev` serves the same endpoint through a Vite
middleware, and on Vercel the values are project environment variables. `gpt-oss` models reason before
they answer, so requests ask for hidden, low-effort reasoning. Without a key the assistant says what is
missing and the AI filter button stays hidden.

**Settings** — workspace (name, subdomain, icon), appearance, member list, export JSON and reset demo
data. Per board: general (name, key, description, color), status editor (rename, recategorise, reorder,
delete with reassignment) and a confirm-to-delete danger zone.

## Domain model

`src/types/index.ts` keeps TaskFord's naming so the store can later be swapped for the real API:
`Site`, `User`, `Board`, `BoardStatus`, `BoardPriority`, `Task`, `TaskComment`, `BoardView`.

Two ordering schemes mirror the original:

- `Task.rank` is a LexoRank-style string (`src/lib/rank.ts`), so a drop only rewrites the dragged row.
- `BoardStatus.rank` / `BoardView.rank` are integers.

Task keys are `{BOARD_KEY}-{sequenceNumber}` (`ENG-12`), with the counter held per board.

## Deliberately left out

Auth, permissions (CASL, 4 scopes), custom fields, task types, groups/swimlanes, portfolios,
configurable dashboards and widgets, documents/rich text, timesheets, attachments, notifications,
audit log, imports, realtime sync, gantt/scheduler/calendar views, i18n, soft delete and archiving.

## Structure

```
api/             serverless Groq proxy (chat + configured check), shared by `vercel dev` and Vite
src/
├── components/
│   ├── assistance/ Sapa launcher, panel, thread, composer, proposed-changes card
│   ├── dnd/        drop indicator
│   ├── layout/     app shell, sidebar, top bar
│   ├── task/       task card, task detail dialog, priority + assignee primitives
│   ├── ui/         local shadcn-style primitives over Radix
│   └── views/      toolbar/ (search, filters, sorts, group-by, display, chips), kanban/, table/
├── lib/            ai/ (groq client, board context, actions, filter agent), rank, task-query (filter/sort/group), dnd payloads, view-settings defaults, seed
├── routes/         dashboard, boards, board detail, board settings, settings
├── store/          zustand app store (persisted) + ui store + view-settings hook + selectors
└── types/
```

## Tests

`npm run test` runs four suites: smoke tests that render the real router at `/`, `/boards` and both
board views; unit tests for the store (sequence numbers, ranking, cascade delete); unit tests for
filtering, sorting, grouping and drop-target maths; and unit tests for the assistant's action parsing
and for applying its proposed changes to the store.

## Theme

All colors come from the CSS variables in `src/index.css` (`--primary`, `--sidebar`, `--chart-*`, …)
in both light and `.dark`. Components never hardcode a hex or a generic Tailwind color.
