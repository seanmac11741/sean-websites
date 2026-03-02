# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

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
- **Domain:** `sean-mcconnell.com` (registered on Squarespace, DNS pointing to Firebase)

## Commands

```bash
bun run dev        # dev server at localhost:4321
bun run build      # builds to dist/
bun run preview    # preview the dist/ build locally
bun run test       # run vitest tests
```

## CI/CD

Pushing to `main` triggers a GitHub Actions workflow (`.github/workflows/deploy.yml`) that runs tests, builds, and deploys to Firebase Hosting automatically.

```
git push origin main
  └─→ GitHub Actions: bun install → bun run test → bun run build → firebase deploy
```

- **Secret:** `FIREBASE_SERVICE_ACCOUNT` (service account JSON stored in GitHub repo secrets)
- **Action:** `FirebaseExtended/action-hosting-deploy@v0` deploys `dist/` to production
- A failing test blocks the deploy

## Architecture

Single-page static site. `bun run build` outputs HTML/CSS/JS to `dist/`, which Firebase Hosting serves.

```
src/
  layouts/Layout.astro     ← HTML shell, Inter font, OG tags, canonical URL, GSAP
  pages/index.astro        ← single page, imports all section components
  components/
    Nav.astro              ← sticky nav, scroll-triggered bg, mobile hamburger
    Hero.astro             ← full-viewport, GSAP text reveal, typewriter titles
    About.astro            ← two-column bio + photo, live experience timer, highlights
    Skills.astro           ← responsive grid, 18 skills via simple-icons
    Footer.astro           ← email CTA, social links, "Request a website" CTA, copyright
  styles/global.css        ← Tailwind @import, @theme tokens, base styles
public/
  images/                  ← ProfilePictureSeanWhiteSweater.png, CasualMountainsSean.jpg,
                             Gemini_Generated_Image_SeanLogo.png (logo source),
                             sean-mcconnellcomQR.png (QR code for stickers)
  favicon.ico              ← converted from Gemini logo image
  apple-touch-icon.png     ← 192x192 from same logo
.github/
  workflows/deploy.yml     ← CI/CD: test → build → deploy on push to main
tests/
  phase14.test.ts          ← vitest tests for Phase 14 changes
  phase15.test.ts          ← vitest tests for Phase 15 (CI/CD workflow)
  phase16.test.ts          ← vitest tests for Phase 16 (live experience timer)
```

**Page flow:** Hero → About → Skills → Contact/Footer

## Design Tokens

All defined in `src/styles/global.css` via Tailwind 4 `@theme`:

- **Accent color:** `#818CF8` (electric indigo) — `--color-accent`
- **Background:** `#0A0A0F` (near-black) — `--color-dark`
- **Font:** Inter (Google Fonts)
- **Dark theme only** (no light/dark toggle)

## Key Implementation Details

- GSAP ScrollTrigger animations use `immediateRender: false` + `once: true` — safe when page loads already scrolled to a section
- `simple-icons` npm package provides SVGs for the Skills section
- `@astrojs/sitemap` generates sitemap on build
- `firebase.json` only deploys hosting (functions/firestore/storage removed — `functions/` dir still exists if needed later)
- `site: 'https://sean-mcconnell.com'` set in `astro.config.mjs`
- About section has a live experience timer (YRS/MO/DAYS/HRS/MIN/SEC) counting from April 23, 2015 — server-rendered initial values + client-side `setInterval` for live ticking. Uses `tabular-nums` to prevent digit width shifting.
- Hero heading uses graduated responsive sizing (`text-5xl sm:text-6xl lg:text-7xl xl:text-8xl`) to prevent "McConnell" from clipping in the two-column layout
- Social links (GitHub, GitLab, LinkedIn, Strava) appear in Nav, Hero, and Footer
- Footer "Request a website" CTA links to Google Form: `https://forms.gle/fFCFyQH7dG6xXtkVA`

## User Preferences

- Do not stop mid-implementation — complete each phase fully, mark it done, then pause for review
- Do not add unnecessary comments, JSDoc, or `any`/`unknown` types
- Run typecheck continuously while implementing
- **Never run any git commands** — Sean handles all git operations manually
