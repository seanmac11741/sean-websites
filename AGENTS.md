# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Critical Rules

- **Never run any git commands** — Sean handles all git operations manually
- **Never use npm** — always use Bun (`bun install`, `bun add`, etc.) for all package management, including in subdirectories like `functions/`
- **Never read, cat, or access credential/secret files** — this includes `~/.claude/.credentials.json`, `.env`, API keys, tokens, or any file that may contain secrets. If credentials are needed, ask Sean to provide or configure them manually.
- Keep `CLAUDE.md` current — update the tests list, architecture, and key implementation details whenever a phase completes or significant changes are made

## Project

Personal portfolio site for Sean McConnell. Live at `sean-mcconnell.com`, hosted on Firebase Hosting.

**Completed build plan:** `plan.md`
**Deferred work (blog, projects, bugs):** `todo.md`

## Stack

- **Framework:** Astro 5 (static output, no SSR)
- **Styling:** Tailwind CSS 4 (via `@tailwindcss/vite` plugin — no `tailwind.config.ts`, config lives in `src/styles/global.css` using `@theme`)
- **Animations:** GSAP 3 + ScrollTrigger
- **Runtime / PM:** Bun
- **Testing:** Vitest
- **Hosting:** Firebase Hosting (`dist/` → Firebase)
- **Backend:** Firebase Cloud Functions (TypeScript, Node 22), Firestore, Firebase Storage
- **Auth:** Firebase Auth (Google sign-in only)
- **Editor:** Tiptap (WYSIWYG, ProseMirror-based)
- **Domain:** `sean-mcconnell.com` (registered on Squarespace, DNS pointing to Firebase)

## Commands

```bash
bun run dev        # dev server at localhost:4321
bun run build      # builds to dist/
bun run preview    # preview the dist/ build locally
bun run test       # run vitest tests
```

## CI/CD

Two workflows in `.github/workflows/`:

### `deploy.yml` — Build, Test & Deploy

```
git push origin main
  └─→ GitHub Actions: bun install → functions bun install → test → build → functions tsc → firebase deploy
git push origin issue/<branch>
  └─→ GitHub Actions: test + build only (no deploy)
```

- **Secret:** `FIREBASE_SERVICE_ACCOUNT` (service account JSON stored in GitHub repo secrets)
- **Action:** `w9jds/firebase-action@v13.29.1` runs `firebase deploy` (hosting + functions + firestore rules + storage rules)
- A failing test blocks the deploy

### `code-review.yml` — AI Code Review

Runs `anthropics/claude-code-action@v1` on every PR targeting `main`. Claude reviews the diff using the skill file at `.claude/skills/pr_review/SKILL.md` and posts a structured comment.

- **Trigger:** `pull_request` (opened, synchronize) to `main`
- **Secret:** `ANTHROPIC_API_KEY` (Anthropic API key stored in GitHub repo secrets)
- **Model:** Claude Sonnet (default for the action)
- **Self-improving:** reply `@claude <feedback>` on the PR to teach it preferences (requires `issue_comment` trigger — not yet enabled)
- Workflow file must match `main` exactly — changes require merging to `main` first (OIDC validation)

## Architecture

Static site + dynamic blog. `bun run build` outputs HTML/CSS/JS to `dist/`, Firebase Hosting serves static pages, Cloud Functions serve blog API.

```
src/
  layouts/Layout.astro       ← HTML shell, Inter font, OG tags, canonical URL, GSAP
  lib/firebase.ts            ← Firebase client SDK init (app, auth, db, storage, googleProvider, ADMIN_EMAIL)
  pages/
    index.astro              ← portfolio single page, imports all section components
    admin/index.astro        ← admin dashboard (auth-gated, posts list, CRUD)
    admin/editor.astro       ← Tiptap WYSIWYG editor (create/edit posts, auto-save, image upload)
    admin/preview.astro      ← post preview (renders Tiptap JSON → HTML)
    blog/index.astro         ← public blog listing (fetches from /api/blog)
    blog/post.astro          ← public blog post (fetches from /api/blog/:slug, served via rewrite for /blog/**)
  components/
    Nav.astro                ← sticky nav, scroll-triggered bg, mobile hamburger, Blog/Tools links, hidden Admin link (auth-toggled)
    Hero.astro               ← full-viewport, GSAP text reveal, typewriter titles
    About.astro              ← two-column bio + photo, live experience timer, highlights
    Presentations.astro      ← conference talks, data-driven frontmatter array, title slide images
    Skills.astro             ← categorized grid with experience bars, 6 categories, 23 skills
    LatestPost.astro         ← most recent blog post card, fetched client-side from /api/blog, GSAP scroll animation
    Footer.astro             ← email CTA, social links, "Request a website" + "Buy me a coffee" CTAs, copyright
  pages/
    tools/index.astro        ← tools landing page, card grid linking to individual tools
    tools/flowstate-timer.astro ← focus/break timer with star field (see Tools section below)
  styles/global.css          ← Tailwind @import, @theme tokens, base styles
functions/
  src/index.ts               ← Cloud Function: `api` — /api/blog (list) and /api/blog/:slug (detail)
  tsconfig.json              ← TypeScript config for functions
  package.json               ← Functions deps (firebase-admin, firebase-functions, typescript)
public/
  images/                    ← profile photos, logo, QR code
  favicon.ico                ← converted from Gemini logo image
  apple-touch-icon.png       ← 192x192 from same logo
tests/
  phase14-25.test.ts         ← vitest tests for phases 14–25
  phase28.test.ts            ← vitest tests for phase 28 (PR review agent)
  phase31.test.ts            ← vitest tests for phase 31 (latest blog post on homepage)
  phase32.test.ts            ← vitest tests for phase 32 (tools page + flowstate timer)
```

**Page flow:** Hero → About → Presentations → Skills → LatestPost → Contact/Footer
**Blog flow:** /blog (listing) → /blog/:slug (post detail)
**Admin flow:** /admin (login/dashboard) → /admin/editor (create/edit) → /admin/preview (preview)
**Tools flow:** /tools (card grid index) → /tools/flowstate-timer

## Design Tokens

All defined in `src/styles/global.css` via Tailwind 4 `@theme`:

- **Accent color:** `#818CF8` (electric indigo) — `--color-accent`
- **Background:** `#0A0A0F` (near-black) — `--color-dark`
- **Font:** Inter (Google Fonts)
- **Dark theme only** (no light/dark toggle)

## Key Implementation Details

- GSAP ScrollTrigger animations use `immediateRender: false` + `once: true` — safe when page loads already scrolled to a section
- Skills section uses a frontmatter array of categories (each with a title and array of `{ name, years }` skills) — no external icon package
- `@astrojs/sitemap` generates sitemap on build
- `firebase.json` deploys hosting + functions + firestore rules + storage rules. Rewrites: `/api/**` → Cloud Function `api`, `/blog/**` → `/blog/post/index.html`
- `site: 'https://sean-mcconnell.com'` set in `astro.config.mjs`
- Blog admin: Google sign-in only, allowlisted to `seanmac11741@gmail.com`. Auth state toggles Admin nav link visibility
- Blog editor: Tiptap with StarterKit, Image, Link, CodeBlockLowlight extensions. Debounced auto-save (3s) to Firestore `posts/{slug}`
- Blog posts in Firestore: `{ title, slug, description, tags, content (Tiptap JSON), status (draft|published), createdAt, updatedAt, publishedAt }`
- Public blog: static Astro pages fetch from Cloud Function API client-side. Tiptap JSON → HTML via `generateHTML`
- Firestore rules: public read for published posts, write restricted to admin email. Storage: public read for `/blog/**`, write restricted to admin
- About section has a live experience timer (YRS/MO/DAYS/HRS/MIN/SEC) counting from April 23, 2015 — server-rendered initial values + client-side `setInterval` for live ticking. Uses `tabular-nums` to prevent digit width shifting.
- Hero heading uses graduated responsive sizing (`text-5xl sm:text-6xl lg:text-7xl xl:text-8xl`) to prevent "McConnell" from clipping in the two-column layout
- Social links (GitHub, GitLab, LinkedIn, Strava) appear in Nav, Hero, and Footer
- Footer "Request a website" CTA links to Google Form: `https://forms.gle/fFCFyQH7dG6xXtkVA`

## Tools Page

`/tools` — card grid index listing available tools. "Tools" link in Nav between Blog and Admin.

### Flowstate Timer (`/tools/flowstate-timer`)

Focus/break pomodoro timer with ambient star field.

- **Core loop:** Focus → alarm → fun phrase + "Take a Break" → Break → alarm → fun phrase + "Start Focus" → repeat
- **Timer:** SVG circular progress ring (`stroke-dasharray`/`stroke-dashoffset`) with large MM:SS digits. GSAP theatrical entrance animation on start. Ring pulses red at zero (synced with alarm).
- **Controls:** Preset duration buttons (focus: 25/60/90/120 min, break: 5/15/30 min) + custom input. Focus/Break toggle on preset screen. Pause/Resume and Reset appear after starting.
- **Alarm:** Web Audio API generated tone (`OscillatorNode`, square wave 880→660Hz). Repeats via `setInterval` until dismissed.
- **Fun phrases:** 10 post-focus (relaxation) + 10 post-break (motivation), displayed as headline after alarm dismiss.
- **Star field:** Full-viewport `<canvas>` behind timer (`z-0`). 13 real northern hemisphere constellations (Ursa Major, Ursa Minor, Orion, Cassiopeia, Cygnus, Leo, Lyra, Gemini, Bootes, Draco, Auriga, Perseus, Corona Borealis) with connecting lines + 400 random background stars. Stereographic projection centered on Polaris (`POLARIS_DEC ≈ 1.558 rad`). Star positions use RA/Dec in radians. Fixed `SCALE = 600` — canvas is a viewport into the sky, not sky squeezed into the window.
- **Focus mode:** Slow auto-rotation (`ROTATION_SPEED = 0.00003`), no user interaction with stars.
- **Break mode:** Auto-rotation stops. Dawn ambiance (background lightens via `dawnAmount` gsap tween). Click-and-drag to rotate star field (mouse + touch). `main` gets `pointer-events: none` so canvas receives clicks; `timer-container` has `pointer-events-auto` to keep controls clickable.
- **Constellation labels:** `window` mousemove listener computes each constellation's screen center, shows name via `ctx.fillText` when mouse within `HOVER_RADIUS = 50px`.
- **Persistence:** Timer state saved to `localStorage` (`flowstate-timer-state`). On page return with active session: "You had X minutes left, resume?" prompt.
- **Responsive:** SVG ring uses `viewBox` + `max-w-[280px]`. Touch-drag for mobile star rotation during break.
