# Personal Website Plan — sean-mcconnell.com

Live at `sean-mcconnell.com`. **Deferred work:** `todo.md`

## Stack

| Layer | Choice |
|---|---|
| Framework | Astro 5 (static output) |
| Runtime / PM | Bun |
| Animations | GSAP 3 + ScrollTrigger |
| Styling | Tailwind CSS 4 |
| Hosting | Firebase Hosting |
| Backend | Cloud Functions, Firestore, Firebase Auth, Firebase Storage |

## Done

**Phases 1–25:** Site scaffold, layout, theming, nav, hero, about, skills, footer, animations, responsive polish, SEO, content, Firebase deploy, CI/CD, live experience timer, skills rewrite, presentations, highlight cards, Buy Me a Coffee, blog (Tiptap + Firestore + Cloud Functions + admin).

**Phases 27–29:** PR code review agent — Claude Code in GitHub Actions reviews PRs automatically via `code-review.yml`.

**Phase 30:** PR review agent docs — updated `CLAUDE.md` CI/CD section, added code review agent docs, cleaned up `todo.md`.

**Phase 31:** Latest blog post on homepage — `LatestPost.astro` component fetches most recent published post from `/api/blog`, renders as a card between Skills and Footer with GSAP scroll animations, loading spinner, and error handling (303 tests).

## Phase 32 — Tools Page & Flowstate Timer

### Tools index (`/tools`)

- Card grid layout listing available tools, each with title, description, and link
- Establishes the pattern for future tools (CV builder, file writer from `todo.md`)
- "Tools" link added to main nav (desktop + mobile) between Blog and Admin

### Flowstate Timer (`/tools/flowstate-timer`)

**Core loop:** Focus → alarm → fun phrase + "Take a Break" button → Break → alarm → fun phrase + "Start Focus" button → repeat

**Timer display:**
- Circular SVG progress ring with large digits centered inside (Google Timer inspired but unique)
- Ring draws itself on with a theatrical GSAP entrance when timer starts (controls fade, ring animates in, digits scale up)
- At zero: ring pulses and shifts to red, synchronized with the alarm

**Controls:**
- Preset duration buttons + custom input. Focus presets: 25, 60, 90 (default), 120 min. Break presets: 5, 15, 30 (default) min
- Start button (big, prominent), Pause/Resume and Reset appear as secondary pill-shaped buttons after starting

**Alarm:**
- Web Audio API generated tone — no audio files
- Repeats until user clicks dismiss

**Fun phrases:**
- 8–12 per set, two sets: post-focus (relaxation) and post-break (motivation)
- Displayed as a large headline after alarm dismissal, above the next mode's start button

**Star field background (canvas):**
- Full northern hemisphere night sky with real constellation positions and connecting lines
- Fades in on first timer start, persists through entire session (focus, transitions, break)
- **Focus mode:** slow auto-rotation, no user interaction
- **Break mode:** dawn ambiance — background lightens, warmer tint. Stars become click-and-drag interactive (touch-drag on mobile)

**Break mode visual distinction:**
- SVG ring color shifts (accent indigo → break color)
- Canvas background transitions to dawn-like warmer/lighter palette

**State persistence:**
- Timer state saved to localStorage
- On page return with an active session: prompt "You had X minutes left, resume?" with yes/no

**Mobile:**
- Full support — responsive ring/digit sizing, touch-drag for star rotation during break, canvas star field renders on mobile

### Implementation Todo

Page scaffolding (1-3):
1. [x] Create /tools index page with card grid layout
2. [x] Add "Tools" link to Nav.astro (desktop + mobile)
3. [x] Create /tools/flowstate-timer page with Layout and Nav

Timer core (4-9):
4. [x] Build preset duration buttons (focus: 25/60/90/120, break: 5/15/30) + custom input
5. [x] Build the big Start button for focus mode
6. [x] Build SVG circular progress ring with large centered digits (MM:SS)
7. [x] Implement countdown timer logic (requestAnimationFrame-based)
8. [x] Add Pause/Resume and Reset pill-shaped buttons after starting
9. [x] GSAP theatrical entrance animation: ring draws itself on, digits scale up, controls fade

Alarm (10-12):
10. [x] Implement Web Audio API repeating alarm tone at zero
11. [x] Add dismiss button to stop the alarm
12. [x] Ring pulses red and syncs with alarm beep at zero (GSAP)

Focus/Break cycle (13-17):
13. [x] Post-focus flow: dismiss alarm → fun phrase + "Take a Break" button
14. [x] Build break timer: same ring/digits, different accent color, break presets default 30 min
15. [x] Post-break flow: dismiss alarm → fun phrase + "Start Focus" → loops back
16. [x] Write 8-12 post-focus fun phrases (relaxation)
17. [x] Write 8-12 post-break fun phrases (motivation)

Persistence & responsive (18-20):
18. [x] Save timer state to localStorage
19. [x] On page load with saved state: "You had X minutes left, resume?" prompt
20. [x] Responsive layout for mobile

Errors resolved
* [x] Hitting reset button just makes the whole thing disappear — fixed: gsap.set restores opacity/scale on presets container
* [x] Need a button to switch between work and break mode — fixed: added Focus/Break toggle on preset screen

Star field — last (21-26):
21. [x] Build canvas star field with full northern hemisphere constellations + lines
22. [x] Star field fades in on first timer start, persists through session
23. [x] Focus mode: slow auto-rotation, no interaction
24. [x] Break mode: dawn ambiance transition (lighter, warmer palette)
25. [x] Break mode: click-and-drag to rotate star field (mouse)
26. [x] Mobile touch-drag support for star field

## Star Field Bugs

Bug A — Rotate around Polaris, not canvas center
* Current rotation pivots around the center of the canvas. Should pivot around Polaris (the North Star) so the sky rotates realistically.

Bug B — Flat rectangular projection looks wrong on rotation
* Stars are mapped to a flat rectangle and rotated in 2D, so edges clip and the field looks like a spinning sheet of paper instead of a sky. Need a polar/stereographic projection from a sphere so the field is circular and natural.

Bug C — Window resize skews and stretches stars
* Currently the full sky is squeezed into the window dimensions. Resizing stretches everything. Instead, the canvas should be a viewport into a much larger virtual sky — resizing reveals more or less sky, not stretches it. Tightly coupled with Bug B's projection rewrite.

Bug D — Spins too fast
* Current ROTATION_SPEED = 0.00008 is noticeably fast. Slow it down to ~0.00003.

Bug E — Constellation names should show on mouse hover
* No hover labels exist. Add a mousemove listener that checks proximity to each constellation's center and draws the name on the canvas when the mouse is nearby.

Bug F — Can't click-and-drag the star field during break mode
* The drag handlers exist but don't work in practice. The canvas is behind the main content (z-0 vs z-10), so pointer events never reach it. Need to enable pointer-events on the canvas during break mode and disable during focus.

### Bug Fix Todo

Projection rewrite (fixes A, B, C together):
28. [x] Replace flat 2D projection with stereographic projection centered on Polaris
29. [x] Convert constellation RA/Dec data to proper spherical coordinates (radians)
30. [x] Make canvas a viewport into a larger virtual sky (uniform pixel scale, no stretching on resize)
31. [x] Rotation pivots around Polaris — auto-rotate and drag both rotate the view around the pole

Individual fixes:
32. [x] Slow down auto-rotation speed (Bug D)
33. [x] Draw constellation names on canvas near their center when mouse hovers close (Bug E)
34. [x] Fix pointer-events: enable on canvas during break mode, disable during focus so timer controls stay clickable (Bug F)

Wrap-up (35):
35. [x] Update CLAUDE.md with tools page architecture