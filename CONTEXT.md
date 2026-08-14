# Context

Domain language for this repo. Use these terms exactly — in code, tests, issues and commits.
Decisions that shaped them live in `docs/adr/`.

## Blog

**Post** — a blog entry. Lives in Firestore under `posts/{slug}`, authored as Tiptap JSON.
Its shape is owned by the **Post module** (`src/lib/blog/post.ts`) — nothing else restates it.

**Post Summary** — a Post without its content: what the listing and the homepage card need.
This is what `/api/blog` returns.

**Post module** — `src/lib/blog/`. The one place that knows a Post's shape, its **Reading Time**,
how its date is formatted, and how it renders as a **Post Card**. Pure; the fetching adapter is
`client.ts` alongside it.

**Reading Time** — a Post's estimated minutes to read, at 200 words per minute
(`WORDS_PER_MINUTE`), never less than one minute. One rule, used by the API, the listing, the post
page and the **Preview**. Previously two rules that disagreed — see
`docs/adr/0001-tests-assert-behaviour-not-source-text.md`.

**Post Card** — the linked summary of a Post. Two variants: `list` on `/blog`, `latest` on the
homepage.

**Preview** — the admin's rendering of an unpublished Post at `/admin/preview`. It must agree with
the published page, so it takes its Reading Time and date format from the Post module.

## Flowstate Timer

**Session** — one run of the timer: its **Mode**, its length, and where it has got to.
Owned by the **Session module** (`src/lib/timer/session.ts`), which holds every decision the
timer makes — transitions, phrases, selectors, and the saved payload in both directions.
Pure: events in, a new Session and a list of **Effects** out. No DOM, no timers, no storage.

**Mode** — which half of the cycle a Session belongs to: **focus** or **break**.

**Status** — what a Session is doing: `idle`, `running`, `paused`, `ringing`, `transition`.
It is what the page's screen is derived from (`screen()`); running and paused share one screen,
which is why the two vocabularies are not the same list.

**Deadline** — the absolute instant a running Session ends (`endsAt`). Time remaining is
*derived* from it, never counted down, so a hidden tab, a sleeping machine or a page reload
cannot make the Session drift. Replaced a per-frame decrement plus a backup `setTimeout`.

**Effect** — something the page must do that a pure module cannot: `startAlarm`, `stopAlarm`,
`pulseRing`, `stopPulse`, `showStarfield`, `playEntrance`, `clearSaved`, `save`. The reducer
decides which Effects a transition produces; the page only knows how to perform each one, and
makes no decision of its own in doing so.

Only running and paused Sessions are saved. A restored Session comes back paused and waits
behind the resume prompt — a ringing alarm restored on load would beep at a page you just opened.
It comes back with the time genuinely left, not the time it was saved with.

**Resume Window** — how long after a Session was last live it is still worth offering back:
one hour (`RESUME_WINDOW_MS`). Last live means its Deadline while running, and the instant it was
saved while paused — a paused Session counts down no further, so what makes it stale is how long
ago it was left. Every saved payload carries a Deadline, a paused one included, where it is the
instant the Session would end had it kept running from the save; both instants are read off it.
Past the window the payload is dropped and the storage cleared, and the viewer lands on the
preset screen. There is no version field and no migration: a payload the
module does not recognise — junk, or one written before Sessions carried a Deadline — degrades
the same way, to a fresh start.

**Ambiance** — how the star field looks and behaves in a given mode. **Night** during focus,
**Dawn** during a break. Owned by the **Ambiance module** (`src/lib/flowstate/ambiance.ts`) —
nothing else states what night or dawn look like.

**Dawn Amount** — how lit the sky is, `0` at Night and `1` at Dawn. Everything the transition
changes (sky colour, star opacity) is a function of it.

**Ambiance module** — `src/lib/flowstate/ambiance.ts`. Pure: canvas painting, auto-rotation, the
gsap tween and the pointer-events handoff are injected as effects, so the two transitions are one
shared path. `toFocus` and `toBreak` are mirror images; each repaints on every frame.
