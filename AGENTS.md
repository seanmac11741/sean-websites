# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Critical Rules

- **Never push anything to main directly** — Sean reviews before merging to main
- **Never use npm** — always use Bun (`bun install`, `bun add`, etc.) for all package management
- **Never read, cat, or access credential/secret files** — this includes `~/.claude/.credentials.json`, `.env`, API keys, tokens, or any file that may contain secrets. If credentials are needed, ask Sean to provide or configure them manually.
- Keep `CLAUDE.md` current — update the tests list, architecture, and key implementation details whenever a phase completes or significant changes are made
- **Tests assert behaviour, not source text** — never write `readFileSync` + `toContain` over `src/**` or `api/**`. Put the logic in a pure module under `src/lib/<domain>/` and test its interface. `readFileSync` is only for files whose content *is* the artifact (rules, `vercel.json`, workflows, `package.json`). See `docs/adr/0001-tests-assert-behaviour-not-source-text.md`

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

Single-context — `CONTEXT.md` + `docs/adr/` at the repo root. See `docs/agents/domain.md`.
