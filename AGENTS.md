# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Critical Rules

- **Never run any git commands** — Sean handles all git operations manually
- **Never use npm** — always use Bun (`bun install`, `bun add`, etc.) for all package management
- **Never read, cat, or access credential/secret files** — this includes `~/.claude/.credentials.json`, `.env`, API keys, tokens, or any file that may contain secrets. If credentials are needed, ask Sean to provide or configure them manually.
- Keep `CLAUDE.md` current — update the tests list, architecture, and key implementation details whenever a phase completes or significant changes are made

## Project

Personal portfolio site for Sean McConnell. Live at `sean-mcconnell.com`, hosted on Vercel.

**Completed build plan:** `plan.md`
**Deferred work (blog, projects, bugs):** `todo.md`

## Stack

- **Framework:** Astro 5 (static output, no SSR)
- **Styling:** Tailwind CSS 4 (via `@tailwindcss/vite` plugin — no `tailwind.config.ts`, config lives in `src/styles/global.css` using `@theme`)
- **Animations:** GSAP 3 + ScrollTrigger
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

Two workflows in `.github/workflows/`:

### `deploy.yml` — Build Validity (tests-only)

```
PR / push to main
  └─→ GitHub Actions: bun install → bun run test → bun run build
```

- No Firebase/Vercel deploy step — Vercel handles deploys directly via its GitHub app
- A failing test blocks the PR check (not the deploy — Vercel deploys independently)

### Rules deploy (manual)

Firestore and Storage security rules are not touched by the Vercel deploy or by `deploy.yml`. When `firestore.rules` or `storage.rules` changes, deploy them manually:

```bash
firebase deploy --only firestore:rules,storage
```

This is rare and intentional — the automated Firebase deploy path is gone with the Vercel migration.

### `code-review.yml` — AI Code Review

Runs `anthropics/claude-code-action@v1` on every PR targeting `main`. Claude reviews the diff using the skill file at `.claude/skills/pr_review/SKILL.md` and posts a structured comment.

- **Trigger:** `pull_request` (opened, synchronize) to `main`
- **Secret:** `ANTHROPIC_API_KEY` (Anthropic API key stored in GitHub repo secrets)
- **Model:** Claude Sonnet (default for the action)
- **Self-improving:** reply `@claude <feedback>` on the PR to teach it preferences (requires `issue_comment` trigger — not yet enabled)
- Workflow file must match `main` exactly — changes require merging to `main` first (OIDC validation)

## Architecture

Static site + dynamic blog. `bun run build` outputs HTML/CSS/JS to `dist/`, Vercel serves static pages, Vercel Serverless Functions in `api/` serve the blog API.

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
api/
  blog/index.ts              ← Vercel Serverless Function — GET /api/blog (list published posts)
  blog/[slug].ts             ← Vercel Serverless Function — GET /api/blog/:slug (single post)
  _lib/firebase.ts           ← shared firebase-admin init, CORS helper, readingTime calc
  tsconfig.json              ← TypeScript config for the api/ project
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
- `vercel.json` handles static hosting config: rewrite `/blog/:path` → `/blog/post/index.html`, cache headers for `/_astro/**` (1yr immutable), `/images/**` + favicons (7 days). `/api/**` is native Vercel Functions — no rewrite needed. `firebase.json` retains only Firestore + Storage rules blocks.
- `site: 'https://sean-mcconnell.com'` set in `astro.config.mjs`
- Blog admin: Google sign-in only, allowlisted to `seanmac11741@gmail.com`. Auth state toggles Admin nav link visibility
- Blog editor: Tiptap with StarterKit, Image, Link, CodeBlockLowlight extensions. Debounced auto-save (3s) to Firestore `posts/{slug}`
- Blog posts in Firestore: `{ title, slug, description, tags, content (Tiptap JSON), status (draft|published), createdAt, updatedAt, publishedAt }`
- Public blog: static Astro pages fetch from the `/api/blog` Vercel Serverless Functions client-side. Tiptap JSON → HTML via `generateHTML`. The `api/` routes read Firestore via `firebase-admin` with the service account JSON in `FIREBASE_SERVICE_ACCOUNT_JSON` (Vercel env var). CORS is an origin-allowlist (`https://sean-mcconnell.com`, `http://localhost:4321`) — not wildcard.
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
