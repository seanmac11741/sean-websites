# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

Personal portfolio site for Sean McConnell, deploying to `sean-mcconnell.com` via Firebase Hosting.

**Full plan, phases, and task checklist:** `plan.md`
**Deferred work (blog, projects section):** `todo.md`

## Stack

- **Framework:** Astro 5 (static output, no SSR)
- **Styling:** Tailwind CSS 4 (via `@tailwindcss/vite` plugin — no `tailwind.config.ts`, config lives in `src/styles/global.css` using `@theme`)
- **Animations:** GSAP 3 + ScrollTrigger
- **Runtime / PM:** Bun
- **Hosting:** Firebase Hosting (`dist/` → Firebase)

## Commands

```bash
bun run dev        # dev server at localhost:4321
bun run build      # builds to dist/
bun run preview    # preview the dist/ build locally
firebase deploy    # deploy dist/ to Firebase Hosting
```

## Current State (as of Phase 12 complete)

Phases 1–12 are done. Only Phase 13 (deploy) remains.

What exists:
- All components: Nav, Hero, About, Skills, Footer — fully implemented with GSAP animations
- `src/layouts/Layout.astro` — HTML shell with Inter font, OG tags, canonical URL, sitemap
- `src/styles/global.css` — Tailwind 4 `@theme` with `--color-accent` / `--color-dark` tokens
- `public/favicon.svg` — stylized "SM" in accent color on dark background
- `simple-icons` — used in Skills.astro for 18 real tech skills from resume
- `@astrojs/sitemap` — generates sitemap on build
- `firebase.json` / `.firebaserc` — Firebase Hosting configured, public dir = `dist/`
- GSAP ScrollTrigger animations use `immediateRender: false` + `once: true` — safe when page loads already scrolled to a section

**Content is complete. To deploy:**
```bash
bun run build
bun run preview   # optional local check
firebase deploy
```

## Architecture

Astro static site — `bun run build` outputs plain HTML/CSS/JS to `dist/`, which Firebase Hosting serves.

```
src/
  layouts/Layout.astro     ← shared HTML shell, imports global.css, loads GSAP
  pages/index.astro        ← single page, imports all section components
  components/
    Nav.astro
    Hero.astro
    About.astro
    Skills.astro
    Footer.astro
  styles/global.css        ← Tailwind @import, --accent CSS variable, base styles
public/
  images/                  ← profile photo: ProfilePictureSeanWhiteSweater.png
  favicon.svg / favicon.ico
```

## Design Decisions

- **Accent color:** `#818CF8` (electric indigo) — defined as `--accent` CSS variable in `global.css`. Change with VS Code color picker in one place.
- **Background:** `#0A0A0F` (near-black)
- **Font:** Inter from Google Fonts
- **Dark theme** only (no light/dark toggle)
- **Single-page layout:** Hero → About → Skills → Contact/Footer (no routing)
- **No Projects section at launch** — deferred to `todo.md`
- Social links needed: GitHub, GitLab, LinkedIn (URLs to be filled in by Sean)
- Email address to be filled in by Sean before deploy

## User Preferences

- Do not stop mid-implementation — complete each phase fully, mark it done in `plan.md`, then pause for review
- Do not add unnecessary comments, JSDoc, or `any`/`unknown` types
- Run typecheck continuously while implementing
- **Never run any git commands** — Sean always handles all git operations (commit, push, branch, etc.) manually. Do not run `git add`, `git commit`, `git push`, or any other git command under any circumstances.
