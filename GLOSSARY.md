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

**Shockwave** — the outward push from an **Upset**, and from an Upset alone: an explosion on every
Conversion is constant, and constant is what stopped the Upset reading as anything. For about 0.4 s
(`SHOCKWAVE_SECONDS`), fading as it goes, it shoves every roaming and spectating Fighter of any Type
away from where the Duel landed, out to about three and a half Clearings. Nobody is immune. The page
draws it as a gold ring. It keeps a crowded board from settling into clumps around old fights. The
flash, the particle puff and the rebirth pop are not this: they still play on every Conversion.

**Cooldown** — the short immunity a Fighter carries out of a Duel. With the pair pushed apart on
release, it is what makes one encounter produce exactly one Conversion rather than re-rolling the
Outcome every frame while the two still overlap.

**Clearing** — the radius around an active Duel that pushes non-duelling Fighters outward and
admits no new Duel. It expires with its Duel, and only Fighters genuinely close to one react, so a
crowded board cannot deadlock on everyone spectating everyone else.

**Spectator** — a Fighter inside a Clearing: takes a place on the ring just inside it and turns to
watch, playing its own Type's idle business. Not a garnish — it is the feature. It commits to that
one Duel and watches it out rather than re-deciding every frame whether it is still inside the
Clearing, which is what keeps the crowd — and each sprite's animation — steady; a Shockwave that
knocks it off the ring leaves it watching, and it walks back. When the Duel ends the whole crowd is
released facing outward, so it breaks up instead of converging on the spot the fight just vacated.

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

## Speed Cubing

**Cube** — the state of a 3×3 puzzle: its 54 **Stickers**. Owned by the **Cube module**
(`src/lib/speed-cubing/cube.ts`), which is pure: no DOM, no three.js. The page's renderer draws
whatever Stickers the Cube module hands it and decides nothing about where they are.

**Sticker** — one coloured square: a **Colour**, the position of the piece it sits on (each axis
−1, 0 or 1), and the outward normal it faces along. Axes are the viewer's: x right, y up, z towards
them. A Sticker is located by where it is, not by which piece it belongs to, so every kind of move
is the same operation — rotate the Stickers in some layers about one axis.

**Colour** — one of the six sticker colours, by name: yellow, white, green, blue, orange, red.

**Scheme** — which Colour starts on which face, as the viewer holds the cube: yellow up (U), white
down (D), green front (F), orange right (R), red left (L), blue back (B). Colours are names in the
Cube module; their paint (the hex values) belongs to the renderer.

**Move** — one token of standard notation, applied with `applyMoves(cube, "R U R' U'")`. A **face
turn** (`U D L R F B`) turns one outer layer clockwise as seen looking at that face. A prime (`R'`)
turns it back; a double (`R2`) turns it twice. A **two-layer turn** (`r u l d f b`) is the face and
the slice behind it. The **slice** `M` is the middle layer between L and R, turning the way L does.
A **rotation** (`x y z`) turns the whole cube the way R, U and F do, which relabels the faces: after
`x`, green is on top. Anything else throws.

**Turn** — what one Move does, read with `parseMove("R'")`: the axis, the layers along it, and the
number of quarter turns about the positive axis by the right-hand rule. The renderer animates
exactly this, then hands the Move to the model and redraws from it. Every Move animates: it eases
in, swings slightly past and settles back (`easeTurn`); under reduced motion it lands instantly.

**Scramble** — 100 random face turns (`scramble(random)`), never the same face twice in a row,
played at 0.04 s a Move. Owned by the pure **Scramble module** (`src/lib/speed-cubing/scramble.ts`);
the random source is injected. Afterwards the page shows the count and, behind "show moves", the
exact sequence it applied.

**Solve** — the cube solving itself on screen, beginner-CFOP style, white on the bottom: the
**Cross**, then the four **F2L pairs**, then 2-look **OLL** and 2-look **PLL**, as labelled **Stages**
(`solve(cube)`). Owned by the pure **Solve module** (`src/lib/speed-cubing/solve.ts`), with the last
layer in `src/lib/speed-cubing/last-layer.ts`. The Cross and each pair is the shortest run of face
turns that solves that Stage alone while keeping every earlier one solved, so it reads like a real
solve rather than a machine's optimal answer: about six turns each. The next pair is whichever
unsolved one is quickest, as a solver looking ahead picks it. Played at 0.5 s a Move
(`SOLVE_TURN_SECONDS`) with a short pause between Stages, beside the stage list (below the cube on a
phone), which highlights the current Stage and Move. Once the cube comes out solved, the
**Celebration** plays.

**Stage** — one labelled step of a Solve and its Moves: "Cross", "F2L pair 1 of 4" to "F2L pair 4 of
4", then one per **Look**, named for the case it found ("OLL: Sune", "PLL: Adjacent Corner Swap"), or
for the Look itself ("OLL: Yellow cross") when there was nothing to do. A Stage already solved has no
Moves. White is on the bottom between Stages.

**Cross** — the four white edges home around the white centre on the bottom.

**F2L pair** — a white corner and the edge above it, home in one of the four slots between the
bottom layer and the middle one. All four pairs and the Cross make the first two layers (F2L).

**Look** — one part of the last layer: a goal and the **Algorithms** for its cases. Four, in order:
OLL's yellow cross, then yellow corners (the whole top yellow), then PLL's corners, then its edges.
Each goal ignores a turn of the top layer; the last Stage ends with the U-turn that brings it home.
**Recognising** a case (`recognise(cube, look)`) finds the Algorithm, and the U-turn lining it up,
that reaches the Look's goal.

**Algorithm** — a named sequence from Sean's CFOP notes, kept as written (`f (R U R' U') f'`,
`F (R U R' U')x3 F'`) and expanded into Moves by `algorithmMoves`. One that starts with a whole-cube
`x` gets an `x'` at the end, so the view turns back before the next Stage. Only these sixteen are used.

**Celebration** — a quick whole turn of the cube with a glow pulse behind it, when a Solve leaves the
cube solved (`isSolved`). The spin is skipped under reduced motion.

**Step** — one item of a Solve's playback (`playback(stages)`): a Move or a pause, tagged with its
Stage and its place in it, so the stage list is highlighted from the same Step the cube is turning.

**Playhead** — where a Solve's playback stands: a position in its Steps, those before it played and
the one at it next (`0` is the scrambled cube, the number of Steps the end; a Stage starts at its
pause). The step controls move it: **⏮ / ⏭** one Move back or on (`back`, `forward`; going back turns
the inverse Move, `inverseMove`), **Play / Pause** through the Steps at the speed slider's pace
(`playNext`; 1× is 0.5 s a Move), and clicking a Stage fast-plays forwards or backwards to its start
(`seekStage`, `SEEK_TURN_SECONDS`) rather than jumping. Each returns the **Beats** to animate — the
Step shown, the Move turned, and how long — and where the Playhead lands, so the stage list follows
the cube whichever way it goes. Owned by `src/lib/speed-cubing/playback.ts`.

**Faces** — a Cube read out face by face (`faces(cube)`): each face's nine Colours in reading order
as laid out in the standard net — side faces with U at the top, U with B at the top, D with F at the
top. This is what the tests compare.

**Play / Learn** — the page's two modes. **Play** is the cube to scramble and solve. **Learn** teaches
on the viewer's own cube, starting with entering it; its panels are where later lessons go. "Teach me
this scramble" opens Learn with the Play cube already entered.

**Entry** — the viewer's real cube as entered in Learn: six sides of nine Stickers each, blank until
painted, with centres fixed to the Scheme, and whether its white side is confirmed. Held yellow up
throughout: the yellow side is entered first, green towards the viewer, then green, orange, blue and red,
each facing them with yellow up. Owned by the pure **Entry module** (`src/lib/speed-cubing/entry.ts`);
saved in `localStorage`, and the page carries on without it. Changing any of the five sides forgets the
white side.

**Worked-out white side** — the white side is never entered: it is worked out from the other five
(`workOutWhite`), as every way of painting it that makes a cube that could be solved. Usually there is
one, and the viewer confirms it matches. Rarely there are several (three or four bottom edges with their
white sticker facing sideways), and the viewer taps in only the stickers that differ between them.

**Walkthrough** — Learn teaching the viewer to solve their own entered cube, one **Lesson** at a time
(`walkthrough(cube)`), held yellow up, green in front, orange on the right throughout. Owned by the pure
**Walkthrough module** (`src/lib/speed-cubing/walkthrough.ts`). The viewer does each Lesson on their real
cube, then presses Next.

**Lesson** — one Stage of the cube's Solve, taught: its title ("Cross", "F2L pair 1 of 4", "OLL: yellow
cross", "OLL: yellow corners", "PLL: corners", "PLL: edges"), exactly the Stage's Moves, the cube as the
Lesson finds it, and a **goal** in plain English chosen for that cube — for the Cross, which white edges to
bring down next to which centres; for an F2L pair, which corner and edge to pair and which slot they go in
(or just the missing one, or nothing to do). For OLL and PLL it also names the **case** ("This is a Sune."),
its **hold** and its Algorithm. When the Lesson's first move is a U-turn that lines the case up, the hold
says to do that turn first, and then gives the Gallery's hold as how the case looks once lined up. Next, Back and Replay slowly
each redraw the cube as that Lesson finds it and play the Lesson on it (slowly, for a replay), so the cube
on screen is always the one the viewer is holding. After the last Lesson, the cube is solved and the
Celebration plays.

**Hold** — how to hold the cube, yellow up, green in front and orange on the right, for an Algorithm's
case to be ready to start, from Sean's CFOP notes ("One corner yellow on top: turn the top so yellow shows
on the front face's top right."). Pi's says the two yellow stickers are on the left, where the algorithm
wants them; the notes said the front. Kept once, in the **Gallery**, and it describes the case lined up; a Lesson shows the same one, after
the U-turn that lines it up when there is one.

**Problem** — something about an Entry no real cube could have (`check`): more than nine of a colour (the
sides holding it turn red); a piece that doesn't exist, or exists twice; and, once all 54 Stickers are in,
a twisted corner, a flipped edge, or a single swapped pair (those Stickers turn red). Nothing can continue
while there is a Problem. A twist, flip or swap could be blamed on any of several pieces; the first one
out of true is named, which on a cube that is otherwise right is the one that is wrong.

**Notation guide** — Learn's list of every Move the method uses (`NOTATION`): a face turn, a prime, a
double, the two-layer turn `f`, the slice `M` and the rotation `x`, each with what it does. Tapping one
turns it on a solved cube. Owned by the pure **Reference module** (`src/lib/speed-cubing/reference.ts`).

**Gallery** — Learn's list of every OLL and PLL case (`GALLERY`), one per Algorithm, grouped by its
Look's step, each with its **Hold**: how to hold the cube, yellow up, for that algorithm. A case's
starting cube (`caseStart`) is a solved cube with its algorithm undone, so its earlier Looks are done and
the algorithm, played with no U-turn first, completes its step. Picking a case puts that cube on screen,
pauses on it, then plays the algorithm; Replay plays it again. Owned by the Reference module.

**Standard view** — the renderer's resting orientation: tipped forward and turned so U, F and R all
show. Before the viewer touches it the cube spins slowly (the **idle spin**; not under reduced
motion). A drag turns it, a release throws it with momentum, and once that dies away it eases back
to the Standard view by the shortest way round and rests.
