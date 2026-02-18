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

## Current State (as of Phase 1 complete)

Phase 1 (scaffold) is done. Phases 2–13 remain. See `plan.md` for the full checklist.

What exists so far:
- Astro project scaffolded at repo root with minimal template
- Tailwind CSS 4 integrated (config in `src/styles/global.css` with `@theme`)
- GSAP 3.14 installed
- Old vanilla JS site files deleted; `public/images/ProfilePictureSeanWhiteSweater.png` kept

What does NOT exist yet (being built):
- `src/layouts/Layout.astro` — needs to be created
- `src/components/` — all components (Hero, About, Skills, Footer, Nav) need to be created
- `src/styles/global.css` — exists from Tailwind scaffold, needs CSS variables and theme added
- `firebase.json` / `.firebaserc` — Firebase not yet configured

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
- Sean handles all git commits — do not run git commands
