# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Critical Rules

- **Never push anything to main directly** — Sean reviews before merging to main
- **At session start, check the branch** — if on `main`, pull it; if not, ask Sean before doing any work
- **Never use npm** — always use Bun (`bun install`, `bun add`, etc.) for all package management
- **Never read, cat, or access credential/secret files** — this includes `~/.claude/.credentials.json`, `.env`, API keys, tokens, or any file that may contain secrets. If credentials are needed, ask Sean to provide or configure them manually.
- Keep `CLAUDE.md` current — update the tests list, architecture, and key implementation details whenever a phase completes or significant changes are made
- **Tests assert behaviour, not source text** — never write `readFileSync` + `toContain` over `src/**` or `api/**`. Put the logic in a pure module under `src/lib/<domain>/` and test its interface. `readFileSync` is only for files whose content *is* the artifact (rules, `vercel.json`, workflows, `package.json`). See `docs/adr/0001-tests-assert-behaviour-not-source-text.md`

## Project

Personal portfolio site for Sean McConnell. Live at `sean-mcconnell.com`, hosted on Vercel.

**Completed build plan:** `plan.md`
**Deferred work (blog, projects, bugs):** `todo.md`

**RPS Royale artwork:** `public/images/rps-royale/sheet.png` is the production
128 px-cell atlas. When replacing or validating it, see
`docs/art/rps-royale/README.md` for the source art, animation preview, and
`python3 scripts/assemble-rps-sprites.py` artifact checks.

**RPS Royale logic:** every rule lives in pure modules under `src/lib/rps-royale/` —
`arena.ts` (the game: seeding, Fighter size, Duels, Shockwaves, `playOut`), `lineup.ts` (the
viewer's Lineup, device caps, and what is saved), `sprites.ts` (the sheet's grid). The page
`src/pages/tools/rps-royale.astro` only draws and wires the DOM. Tests: `tests/lib/rps-*.test.ts`.

**Speed Cubing:** `/tools/speed-cubing`. The cube's state and every move in standard notation live
in the pure Cube module `src/lib/speed-cubing/cube.ts` (Stickers with a position and an outward
normal; a move rotates the Stickers in some layers about one axis). The page
`src/pages/tools/speed-cubing.astro` renders it with three.js from geometry and materials only, no
image or texture assets, and owns the idle spin, drag-with-momentum and ease back to the standard
view. `parseMove` gives the Turn a move makes (axis, layers, signed quarter turns), which the page
animates on a pivot group before handing the move to the model and redrawing from it, so the drawing
never drifts. The Scramble (`src/lib/speed-cubing/scramble.ts`, injected random source) and the
turn easing (`src/lib/speed-cubing/ease.ts`) are pure too. The Solve (`src/lib/speed-cubing/solve.ts`)
returns labelled Stages — the Cross, then four F2L pairs — each the shortest face-turn sequence for that
Stage alone that keeps earlier Stages solved, by IDA* over sticker slots whose move tables are read off
the Cube module, bounded by BFS distance tables (built once, ~150 ms; the page builds them while idle via
`prepareSolve`). The last layer (`src/lib/speed-cubing/last-layer.ts`) is 2-look OLL then 2-look PLL using only the
sixteen algorithms from Sean's CFOP notes: each Look recognises its case by finding the algorithm that,
after at most one U-turn, reaches its goal; algorithms starting with `x` end with `x'` so white is on the
bottom between Stages. `solve(cube)` is the whole thing; the page celebrates (spin + glow) when it ends
solved. `src/lib/speed-cubing/playback.ts` flattens Stages into the Steps the page animates, so
the stage list's highlighting comes from the same Step as the turn, and owns the Playhead behind the step
controls (⏮ / ⏭ one move, Play / Pause, speed slider, click a stage to fast-play to its start): `forward`,
`back` (turning `inverseMove`), `playNext` and `seekStage` each return the Beats to animate and where the
Playhead lands; the page only queues them and waits its turn for anything asked mid-beat. A **Play / Learn**
toggle switches modes (`setMode`; `#learn` in the URL opens Learn): elements marked `data-mode="play|learn"`
show only in their mode, and Learn's panels are `<section data-learn-panel="…">` inside `#learn`, one shown
at a time by `showLearnPanel(name)` — add further Learn panels there. The first panel enters the viewer's
real cube: the pure Entry module `src/lib/speed-cubing/entry.ts` holds the sides painted so far
(`paint`, centres fixed; `fromFaces` in the Cube module turns them, blanks included, into Stickers the
renderer draws grey), `check(sides)` returns the Problems no real cube could have — too many of a colour
(whole sides red), a piece that doesn't exist or appears twice, and once all 54 are in a twisted corner,
flipped edge or single swapped pair (those stickers red) — and `workOutWhite(sides)` finds every white side
that makes a solvable cube: one to confirm (`confirmWhite`), several (only the differing stickers to tap
in), or none (and why). `readEntry` / `writeEntry` save it under `speed-cubing:entry`, guarded so the page
works without storage. "Teach me this scramble" loads the Play cube with `entryFromCube`; a cube confirmed
in Learn carries over into Play. Buttons above the panels (`data-learn-nav`, "Your cube / Notation /
Algorithms") switch between them. The two reference panels come from the pure module
`src/lib/speed-cubing/reference.ts`: `NOTATION` (each move the method uses — `R`, primes, `U2`, `f`, `M`,
`x` — with an explanation; tapping one turns it on a solved cube) and `GALLERY` (the sixteen Algorithms from
`last-layer.ts`, each with its step, hold instructions and Moves; `caseStart(c)` is a solved cube with the
algorithm undone by `undoMoves`, which picking a case puts on screen before its algorithm plays, with a
Replay button). Once the cube is confirmed, "Teach me to solve it" opens the walkthrough
panel: the pure Walkthrough module `src/lib/speed-cubing/walkthrough.ts` turns `solve(cube)` into one
Lesson per Stage (`walkthrough(cube)`) — exactly the solver's moves, the cube as the Lesson finds it
(`start`, which Next / Back / Replay slowly redraw from before playing it, so the cube never drifts), a
plain-English goal chosen for that cube (which Cross edges to bring down; which F2L corner and edge go in
which slot), and for OLL and PLL the case `recognise` found, with its name, the `hold` from
the gallery's `GALLERY`, the notation and the U-turn that lines it up. `lessonSteps` gives
the move Steps to animate at the Solve's pace or slowly. Tests: `tests/lib/speed-cubing-*.test.ts`.

## Stack

- **Framework:** Astro 5 (static output, no SSR)
- **Styling:** Tailwind CSS 4 (via `@tailwindcss/vite` plugin — no `tailwind.config.ts`, config lives in `src/styles/global.css` using `@theme`)
- **Animations:** GSAP 3 + ScrollTrigger
- **3D:** three.js (Speed Cubing)
- **Runtime / PM:** Bun
- **Testing:** Vitest
- **Hosting:** Vercel (`dist/` auto-deployed from GitHub on push to `main`)
- **Backend:** Vercel Serverless Functions (TypeScript, in `api/` at repo root), Firestore, Firebase Storage
- **Auth:** Firebase Auth (Google sign-in only)
- **Editor:** Tiptap (WYSIWYG, ProseMirror-based)
- **Domain:** `sean-mcconnell.com` (registered on Squarespace, DNS on Cloudflare → Vercel)

## Commands

```bash
bun run dev        # dev server at localhost:4321
bun run build      # builds to dist/
bun run preview    # preview the dist/ build locally
bun run test       # run vitest tests
```

## CI/CD

Deploys are owned by Vercel's GitHub integration: push to `main` triggers a production deploy at `sean-mcconnell.com`; push to any other branch triggers a preview deploy at `<project>-<hash>.vercel.app`. The `FIREBASE_SERVICE_ACCOUNT_JSON` env var is set in Vercel project settings (not GitHub secrets) and used by the `api/` routes at runtime.

One workflow in `.github/workflows/`:

### `deploy.yml` — Build Validity (tests-only)

```
PR / push to main
  └─→ GitHub Actions: bun install → bun run test → bun run build
```

## Design Tokens

All defined in `src/styles/global.css` via Tailwind 4 `@theme`:

- **Accent color:** `#818CF8` (electric indigo) — `--color-accent`
- **Background:** `#0A0A0F` (near-black) — `--color-dark`
- **Font:** Inter (Google Fonts)
- **Dark theme only** (no light/dark toggle)

## Agent skills

### Issue tracker

Issues live as GitHub issues in `seanmac11741/sean-websites`, managed via the `gh` CLI. See `docs/agents/issue-tracker.md`.

### Triage labels

The five canonical triage roles, each label string equal to its name. See `docs/agents/triage-labels.md`.

### Domain docs

Single-context — `GLOSSARY.md` + `docs/adr/` at the repo root. See `docs/agents/domain.md`.
