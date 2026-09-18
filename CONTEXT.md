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

**Wakeup** — the single timeout armed at a running Session's Deadline (`wakeDelay`), so the
Session rings on time in a tab nobody is looking at. The animation frames that drive the display
are suspended while a tab is hidden, so they cannot be what notices a Deadline has passed — the
alarm used to wait for the viewer to click back. The Wakeup fires an ordinary tick, leaving
exactly one path by which a Session becomes `ringing`.

It is *derived*, not an **Effect**: the page re-arms it after every dispatch from the Session's
status and Deadline, and everything that is not a running Session asks for no Wakeup at all. That
is what disarms it on pause, reset and dismissal without those transitions each having to
remember to say so — the failure an Effect would invite is a timeout surviving a pause and
ringing mid-break.

One timeout, never a repeating interval: Chrome throttles *chained* timers in a hidden tab to one
run a minute, and their periodic wakeups are the CPU signature that gets a background tab frozen
outright. An unchained timeout is exempt however long its delay.

**Remembered Focus** — the focus duration last chosen (`lastFocusSeconds`), and what a focus
Session starts at whenever the viewer has not just picked one. Written the moment a focus
Session *starts*, not when it completes, so a duration abandoned mid-Session is still the last
answer; a break start leaves it alone. Both **Repeat Focus** and the **Start Focus** that
follows a break read it, which is what keeps the two paths from disagreeing — they were two
hardcoded defaults before. A first Session, having chosen nothing, gets `DEFAULT_FOCUS_MINUTES`.

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

## RPS Royale

**Type** — which of rock, paper or scissors a **Fighter** currently is. The only thing about a
Fighter that a Duel can change.

**Fighter** — one character in the **Arena**: its Type, position, heading, facing, hop phase,
**Activity** and **Cooldown**.

**Roster** — the full population of Fighters, seeded from the **Lineup**: exactly that many of
each Type, from three Fighters to three hundred. The Types are shuffled across a jittered grid with
the Arena's injected random source, so every Type starts mixed into the board and a seeded round
always places the same way. Its size is constant for the whole round: **Conversion** never changes
it, so the board never thins out. It used to be split exactly evenly as a fairness rule. That was
dropped when the viewer got to choose — see `docs/adr/0002-rps-royale-drops-the-even-split.md`.

**Lineup** — how many Fighters of each Type start a round: one to a hundred each, set with three
sliders under the fighter buttons. A wide viewport defaults to twenty each; a phone to ten each,
with a **cap** of forty per Type. Saved in `localStorage`, and Rematch reuses it. The sliders show
it clamped to the device's cap, but the saved value only changes when a slider moves, so a phone
visit does not quietly shrink a Lineup saved on a desktop. The device, and so its cap, is decided
when a round starts. **Even it out** restores the device default. Owned by the **Lineup module**
(`src/lib/rps-royale/lineup.ts`), which is pure: the page hands it the raw saved string.

**Fighter size** — how big a Fighter is, in arena pixels, fixed for the round:
`clamp(k · √(board area / total Fighters), 32, max)`. `max` is the device's largest sprite, 69 wide
and 57 on a phone, and `k` puts sixty Fighters on a 960 × 540 board at exactly 69, so the classic
round looks as it always did. The Duel radius, the **Clearing**, the post-Duel push apart and the
same-Type spread are all stated at full size and scale with it. The Arena decides it because the
rules are measured in it; the page only draws at it.

**Spread** — same-Type Fighters that are roaming or spectating push gently apart within about one
and a half Fighter widths, so a Type reads as a crowd of characters rather than a stack of one sprite.

**Arena** — one run of the game: the Roster, the **Duels** and **Shockwaves** in flight, the
elapsed time, the **Tempo**, and the **Champion** once there is one. Owned by the **Arena module**
(`src/lib/rps-royale/arena.ts`) — seeding, movement, proximity, the Duel lifecycle, the Upset roll,
Conversion, Tempo and Champion detection. Pure: no canvas, no DOM, no timers, no storage, and no
`Math.random` — the random source is injected, which is what makes the ninety-ten split assertable.
It exposes no drawing concept at all: no colours, no sprite indices, no screen coordinates beyond
its own.

**Activity** — what a Fighter is doing, exactly one at a time: `roaming`, `spectating`, `duelling`,
`transforming`, `celebrating`. The transitions between them are the Arena's whole state machine.

**Duel** — a locked encounter between two Fighters of different Types at a fixed point. Three
seconds at flat **Tempo**: a windup, three **Bonks**, then the loser's transform. It is the thing
the tool exists to be watched, so it is paced as a beat of animation rather than as a state change
that happens to be drawn. Its **Outcome** is rolled when the Duel is *created*, not when it ends,
so every later beat reads a value already decided and the animation can telegraph the result
instead of contradicting it.

**Bonk** — one clash within a Duel. The third is the one that lands the result. Between Bonks a
Duel rears back again rather than holding a pose, and each clash is *centred* on its Bonk, so the
contact frame lands with the hit instead of trailing it (`duelBeat`). Duels escalate with Tempo
along with everything else — a Duel holds two Fighters and a **Clearing** for as long as it runs,
so keeping them three seconds long all round would be what made a round grind.

**Outcome** — which Fighter wins a Duel: nine times in ten the standard rock-paper-scissors result,
one time in ten the **Upset**.

**Upset** — a Duel that goes the other way: scissors beats rock, rock beats paper, paper beats
scissors. Ten percent, and load-bearing: at zero percent whichever Type gets an early lead wins
deterministically and there is nothing left to watch, while ten percent is enough that a Type down
to a handful can genuinely come back.

**Conversion** — the losing Fighter becoming the winner's Type. The only way a Type's count ever
changes. Nobody dies, though it is staged as a death and rebirth: the loser transforms for about
1.2 seconds (`TRANSFORM_SECONDS`), and a Fighter mid-transform is not prey and cannot be targeted.
On the page, the transform art plays at its native 0.5 s and then holds a neutral silhouette. When
the Arena reports the **rebirth**, the page adds a flash, a puff of particles in the loser's colour,
and a squash-and-stretch pop into the new Type.

**Shockwave** — the outward push from each Conversion. For about 0.4 s
(`SHOCKWAVE_SECONDS`), fading as it goes, it shoves every roaming and spectating Fighter of any Type
away from where the Duel landed, out to about two and a half Clearings. Nobody is immune. An
**Upset** sends a bigger, harder one. The page draws it as a faint ring in the winner's colour, and
a gold one on an Upset. It keeps a crowded board from settling into clumps around old fights.

**Cooldown** — the short immunity a Fighter carries out of a Duel. With the pair pushed apart on
release, it is what makes one encounter produce exactly one Conversion rather than re-rolling the
Outcome every frame while the two still overlap.

**Clearing** — the radius around an active Duel that pushes non-duelling Fighters outward and
admits no new Duel. It expires with its Duel, and only Fighters genuinely close to one react, so a
crowded board cannot deadlock on everyone spectating everyone else.

**Spectator** — a Fighter inside a Clearing: backs off to its edge and turns to watch, playing its
own Type's idle business. Not a garnish — it is the feature.

**Tempo** — the escalation factor on movement speed and seek bias: flat for the first stretch of a
round, then ramping to a ceiling. There is no hard time cap and no skip button; the ramp is what
guarantees a round ends, and the ceiling is what stops a Fighter moving further in one step than a
Duel's radius and tunnelling past its opponent.

**Champion** — the one Type left when it owns the entire Roster. Ends the round. A round played out
without being drawn (reduced motion, `playOut`) also has a time limit: if it runs out first, the
Type with the most Fighters wins (`leaderOf`), with a tie broken by the injected random source.

**Pick** — the Type the viewer chose before starting. Marked in the tally and on the board.

**Record** — the viewer's running wins and losses across rounds, two integers in `localStorage`,
resettable from the picker. It counts every round, uneven Lineups included. The result card shows
the starting Lineup ("Started 100 · 5 · 5") so the context is visible.

**Sheet module** — `src/lib/rps-royale/sprites.ts`. The one place that knows the spritesheet's grid:
which row is which Type-and-state, how many frames it has, its frame rate, whether it loops, and
which source rectangle a given frame occupies. Row indices are load-bearing. Pure. The art contract
it implements is `docs/rps-royale-spritesheet-spec.md`, and the real artwork is a drop-in
replacement at the same path.
