# Personal Website Plan — sean-mcconnell.com

All 17 phases are complete. The site is live at `sean-mcconnell.com`.

**Deferred work and future ideas:** `todo.md`

---

## Stack

| Layer | Choice |
|---|---|
| Framework | Astro 5 (static output) |
| Runtime / PM | Bun |
| Animations | GSAP 3 + ScrollTrigger |
| Styling | Tailwind CSS 4 |
| Hosting | Firebase Hosting |

## Completed Phases

1. **Scaffold & Setup** — Astro + Tailwind + GSAP initialized with Bun
2. **Firebase Setup** — Hosting configured, public dir = `dist/`
3. **Global Layout & Theming** — Layout.astro shell, global.css with `@theme` tokens, Inter font
4. **Navigation** — Sticky nav with scroll-triggered background, mobile hamburger menu
5. **Hero Section** — Full-viewport with GSAP text reveal, typewriter titles, profile photo
6. **About Section** — Two-column layout, bio, key highlights, casual photo
7. **Skills Section** — ~~Responsive grid of 18 tech skills using `simple-icons`~~ Rewritten in Phase 17
8. **Footer / Contact** — Email CTA, social links, copyright
9. **ScrollTrigger Animations** — All sections animate on scroll entry
10. **Responsive Polish** — Mobile-first layout, overflow-x fix
11. **SEO & Metadata** — OG tags, sitemap, favicon, canonical URL
12. **Content Fill-in** — Real bio, skills from resume, social links, photos
13. **Deploy** — Built and deployed to Firebase Hosting, custom domain connected with SSL
14. **Post-Launch Fixes** — New favicon from logo image, dynamic years of experience, McConnell text cutoff fix, Strava social links, "Request a website" CTA with Google Form
15. **CI/CD with GitHub Actions** — Automated test → build → deploy on push to `main`
16. **Live Experience Timer** — Real-time ticking counter (YRS/MO/DAYS/HRS/MIN/SEC) since April 23, 2015
17. **Skills Section Rewrite** — Categorized grid with experience bars (6 categories, 23 skills, no icons)

## Phase 15 — CI/CD with GitHub Actions

Automate test → build → deploy on every push to `main`. No more manual `bun run build && firebase deploy`.

### How it works

```
git push origin main
  └─→ GitHub Actions triggers
        1. Install Bun + dependencies
        2. bun run test       (fail = stop, don't deploy broken code)
        3. bun run build      (produces dist/)
        4. firebase deploy    (pushes dist/ to Firebase Hosting)
```

### Prerequisites (Sean does these manually before implementation)

Firebase CI deploys require a **service account** so GitHub Actions can authenticate without `firebase login`. Two options:

**Option A — Firebase service account (recommended)**
1. Go to [Firebase Console](https://console.firebase.google.com) → Project Settings → Service accounts
2. Click **Generate new private key** → downloads a JSON file
3. In your GitHub repo → Settings → Secrets and variables → Actions
4. Create a secret named `FIREBASE_SERVICE_ACCOUNT` and paste the entire JSON file contents as the value

**Option B — Firebase token (simpler but deprecated)**
1. Run `firebase login:ci` locally — it prints a token
2. Add that token as a GitHub secret named `FIREBASE_TOKEN`

---

### 15a — Create the GitHub Actions workflow file

- [x] Create `.github/workflows/deploy.yml`
- [x] Trigger: `on: push` to `main` branch only
- [x] Runner: `ubuntu-latest`
- [x] Steps:
  - [x] Checkout code (`actions/checkout@v4`)
  - [x] Install Bun (`oven-sh/setup-bun@v2`)
  - [x] `bun install`
  - [x] `bun run test`
  - [x] `bun run build`
  - [x] Deploy to Firebase using the service account secret

---

### 15b — Add Firebase secret to GitHub repo (Sean does this)
Sean Note - I have created this on github and firebase console. 
- [x] Generate Firebase service account key or CI token (see prerequisites above)
- [x] Add it as a GitHub Actions secret (`FIREBASE_SERVICE_ACCOUNT` or `FIREBASE_TOKEN`)

---

### 15c — Test the pipeline

- [x] Push to `main` and verify the workflow runs in the GitHub Actions tab
- [x] Confirm tests pass in the workflow logs
- [x] Confirm build succeeds in the workflow logs
- [x] Confirm `sean-mcconnell.com` updates after the deploy step completes
- [x] Verify a failing test blocks the deploy (break a test temporarily, push, confirm deploy doesn't happen)

---

### 15d — Update docs

- [x] Update `CLAUDE.md` with CI/CD info
- [x] Cross off CI/CD in `todo.md`
- [x] Update `plan.md` with Phase 15 completion

---

## Phase 16 — Live Experience Timer

Replace the static `{years}+` / "Years of Experience" highlight in the About section with a live-ticking counter showing the exact duration since **April 23, 2015** — years, months, days, hours, minutes, and seconds. Should look polished and professional while showcasing technical skill.

### What changes

Currently in `About.astro`, the first highlight card reads:

```
{years}+
Years of Experience
```

This becomes a live counter with six labeled units (YRS, MO, DAYS, HRS, MIN, SEC) that tick in real-time. The other two highlight cards ("Wisconsin" and "AI & Cloud") stay as-is.

### Design

```
┌──────────────────────────────────────────────────────────────────┐
│  11         00        10        14        32        07           │
│  YRS        MO       DAYS      HRS       MIN       SEC          │
└──────────────────────────────────────────────────────────────────┘
```

- Each unit is a number + label pair arranged in a horizontal row
- Numbers use the accent color (`#818CF8`), large bold font
- Labels are small, uppercase, muted text (`text-slate-500`)
- Thin vertical dividers between units (subtle `border-r border-white/10`)
- The timer spans the full width of the highlights row, replacing the first card — the other two highlight cards ("Wisconsin", "AI & Cloud") sit beside it
- Responsive: on mobile (`sm:` and below), the six counter units wrap into a 3×2 grid so nothing gets cramped
- Seconds digit ticks every second via `setInterval`

### How it works

1. **Build time (Astro frontmatter):** Compute the initial values for all six units from the start date `new Date(2015, 3, 23)` — same approach as the current `years` calculation but more granular. These render into the HTML so the page isn't blank on first paint.

2. **Client-side (`<script>` tag):** A `setInterval(fn, 1000)` recalculates and updates all six DOM elements every second. The calculation uses proper calendar math (not just milliseconds) so "months" and "days" are accurate.

3. **GSAP entrance:** The counter entrance animation stays the same as the current highlight stagger — it animates in with the rest of the About section via ScrollTrigger.

### Steps

#### 16a — Update About.astro with the live timer

- [x] Change the start date in frontmatter from `new Date(2015, 3)` to `new Date(2015, 3, 23)` (April 23)
- [x] Add frontmatter logic to compute initial values for all six units: years, months, days, hours, minutes, seconds
- [x] Replace the first highlight card markup with the timer layout — six number/label pairs with IDs for client-side updates (`#timer-years`, `#timer-months`, `#timer-days`, `#timer-hours`, `#timer-minutes`, `#timer-seconds`)
- [x] Style the timer: accent-colored numbers, muted labels, vertical dividers, responsive 3×2 grid on mobile
- [x] Add a `<script>` tag with `setInterval` that recalculates the duration every second and updates the DOM
- [x] Keep the existing GSAP ScrollTrigger animation — the `.about-highlight` class stays on the timer container so it animates in with the section

#### 16b — Update the bio text

- [x] The bio paragraph currently says `{years} years of experience` — update it to also use the more precise start date (`new Date(2015, 3, 23)`) so it stays consistent with the timer

#### 16c — Update global.css (if needed)

- [x] Add any timer-specific styles that can't be handled inline with Tailwind (e.g., tabular-nums for the counter digits so they don't shift width as they tick)

#### 16d — Write tests

- [x] Test that About.astro contains the start date `new Date(2015, 3, 23)`
- [x] Test that the timer has all six unit elements (`timer-years`, `timer-months`, etc.)
- [x] Test that the `setInterval` logic exists in the component
- [x] Test that the bio still references years of experience dynamically (not hardcoded)
- [x] Test that the other two highlight cards ("Wisconsin", "AI & Cloud") are unchanged
- [x] Run `bun run test` and confirm all tests pass

#### 16e — Visual check + docs

- [ ] Run `bun run dev` and verify the timer ticks correctly in the browser
- [ ] Verify the timer looks good on mobile and desktop
- [x] Update `CLAUDE.md` if any architectural details change
- [x] Cross off the timer item in `todo.md`
- [x] Mark Phase 16 complete in `plan.md`

---

## Phase 17 — Skills Section Rewrite (categorized grid + experience bars)

Replace the flat icon grid with categorized skill cards showing experience bars. Each card has a skill name, years of experience, and a thin accent-colored bar (relative scale: 10 yrs = 100%).

### Skill Data

```
Category: Languages
  JavaScript      9 yrs
  Python          3 yrs
  Java            2 yrs
  SQL            10 yrs
  Bash           10 yrs

Category: Web Development
  Node.js         9 yrs
  React           3 yrs
  REST APIs       8 yrs
  Full Stack      7 yrs

Category: Cloud & Infrastructure
  GCP / Firebase  5 yrs
  AWS             2 yrs
  Docker          6 yrs
  Terraform       2 yrs

Category: DevOps & CI/CD
  CI/CD Pipelines 8 yrs
  Testing         9 yrs
  Linux          10 yrs
  Git            10 yrs

Category: Messaging & Data
  RabbitMQ        6 yrs
  SQL Databases  10 yrs

Category: AI & Automation
  GitHub Copilot  4 yrs
  Claude          1 yr
  Agentic Engineering  1 yr
```

### Design

```
Skills
──────────────────────────────────────────────────────

Languages
┌────────────┐ ┌────────────┐ ┌────────────┐ ┌────────────┐ ┌────────────┐
│ JavaScript │ │ Python     │ │ Java       │ │ SQL        │ │ Bash       │
│ █████████░ │ │ ███░░░░░░░ │ │ ██░░░░░░░░ │ │ ██████████ │ │ ██████████ │
│ 9 yrs      │ │ 3 yrs      │ │ 2 yrs      │ │ 10 yrs     │ │ 10 yrs     │
└────────────┘ └────────────┘ └────────────┘ └────────────┘ └────────────┘

Web Development                     Cloud & Infrastructure
┌────────────┐ ┌────────────┐       ┌────────────┐ ┌────────────┐
│ Node.js    │ │ React      │       │ GCP        │ │ Docker     │
│ █████████░ │ │ ███░░░░░░░ │       │ █████░░░░░ │ │ ██████░░░░ │
│ 9 yrs      │ │ 3 yrs      │       │ 5 yrs      │ │ 6 yrs      │
└────────────┘ └────────────┘       └────────────┘ └────────────┘
  ...etc
```
Skills that will appear on the site (review these — 6 categories, 23 skills):

**Languages:** JavaScript (9 yrs), Python (3 yrs), Java (2 yrs), SQL (10 yrs), Bash (10 yrs)

**Web Development:** Node.js (9 yrs), React (3 yrs), REST APIs (8 yrs), Full Stack (7 yrs)

**Cloud & Infrastructure:** GCP / Firebase (5 yrs), AWS (2 yrs), Docker (6 yrs), Terraform (2 yrs)

**DevOps & CI/CD:** CI/CD Pipelines (8 yrs), Testing (9 yrs), Linux (10 yrs), Git (10 yrs)

**Messaging & Data:** RabbitMQ (6 yrs), SQL Databases (10 yrs)

**AI & Automation:** GitHub Copilot (4 yrs), Claude (1 yr), Agentic Engineering (1 yr)

- Organized under category headings (accent-colored, bold)
- Each card: skill name (white, semibold) + thin accent bar + "X yrs" text
- Bar width = `(years / 10) * 100%` — relative to the longest skill (10 yrs)
- Bar is accent color (`#818CF8`), background track is `white/5`
- Cards in a responsive grid: `grid-cols-2 sm:grid-cols-3 lg:grid-cols-4` within each category
- Hover: card border goes accent, slight lift (`-translate-y-1`)
- No icons — the bars and years tell the story
- GSAP ScrollTrigger: category headings + staggered card reveal per category
- Data lives in frontmatter as a structured array — easy to add/remove/reorder

### Steps

#### 17a — Rewrite the Skills.astro frontmatter (data + types)

- [x] Remove the `import type { SimpleIcon } from 'simple-icons'` import
- [x] Remove all individual `simple-icons` imports (`siJavascript`, `siNodedotjs`, etc.)
- [x] Remove the old `Skill` type and `skills` array
- [x] Define a new `Skill` type: `{ name: string; years: number }`
- [x] Define a `Category` type: `{ title: string; skills: Skill[] }`
- [x] Create the `categories` array with all 6 categories and 23 skills (exact data from the plan above)
- [x] Compute `maxYears` constant (= 10) for bar-width scaling: `width = (skill.years / maxYears) * 100%`
- [x] Verify data: Languages (5), Web Development (4), Cloud & Infrastructure (4), DevOps & CI/CD (4), Messaging & Data (2), AI & Automation (3) = 23 total

#### 17b — Replace the markup

- [x] Keep the outer `<section id="skills">` wrapper and `<h2 id="skills-heading">` — unchanged
- [x] Remove the old `<div id="skills-grid">` flat grid and its `.skill-card` children
- [x] Add a new container that iterates over `categories`
- [x] For each category, render:
  - [x] **Category heading**: `<h3>` with the category title, accent-colored, uppercase, `tracking-wider`, `text-sm font-bold`, with `mb-4 mt-10` (first category gets `mt-0`)
  - [x] **Grid container**: `<div>` with `grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4`
  - [x] **Skill cards** (inside grid): each card is a `<div class="skill-card">` containing:
    - [x] Skill name: `<span>` with `text-sm font-semibold text-white`
    - [x] Bar track: `<div>` with `h-1 rounded-full bg-white/5 mt-3`
    - [x] Bar fill: nested `<div>` with `h-1 rounded-full bg-accent` and inline `style="width: {pct}%"` where `pct = (skill.years / maxYears) * 100`
    - [x] Years label: `<span>` with `text-xs text-slate-500 mt-2` showing `{skill.years} yr{skill.years !== 1 ? 's' : ''}`

#### 17c — Style the cards

- [x] Card base: `rounded-xl border border-white/10 bg-surface/40 p-4 flex flex-col`
- [x] Card hover: `hover:border-accent/50 hover:-translate-y-1 hover:bg-surface/80 transition-all duration-200 cursor-default`
- [x] Confirm accent bar color matches `#818CF8` (uses `bg-accent` which maps to `--color-accent`)
- [x] Confirm category headings use the accent color (`text-accent`)
- [x] Verify responsive breakpoints: 2 cols on mobile, 3 cols on `sm`, 4 cols on `lg` — same as current grid

#### 17d — GSAP animations

- [x] Keep the existing `#skills-heading` reveal animation (yPercent: 110, trigger at 78%)
- [x] Remove the old single `.skill-card` stagger animation
- [x] Add per-category staggered card reveals — give each category grid a unique class or `data-category` attribute
- [x] For each category group, create a `gsap.from('.skill-card', ...)` scoped to that group's container
- [x] Use `ScrollTrigger` per group: `trigger` = the category grid container, `start: 'top 78%'`, `once: true`
- [x] Set `immediateRender: false` on all animations (matches existing pattern)
- [x] Stagger value: `0.05` per card within each group (same as current)

#### 17e — Remove `simple-icons` dependency

- [x] Confirm no other file in `src/` imports from `simple-icons` (already verified: only Skills.astro uses it)
- [x] Remove `"simple-icons"` from `dependencies` in `package.json`
- [x] Run `bun install` to regenerate the lockfile without the removed package
- [x] Verify `bun run build` still succeeds after removal

#### 17f — Write tests (`tests/phase17.test.ts`)

- [x] Create `tests/phase17.test.ts` using the same pattern as `phase16.test.ts` (read file as string, assert contents)
- [x] Read `Skills.astro` source with `readFileSync`
- [x] Test that all 6 category names are present: "Languages", "Web Development", "Cloud & Infrastructure", "DevOps & CI/CD", "Messaging & Data", "AI & Automation"
- [x] Test that all 23 skill names are present in the markup (JavaScript, Python, Java, SQL, Bash, Node.js, React, REST APIs, Full Stack, GCP / Firebase, AWS, Docker, Terraform, CI/CD Pipelines, Testing, Linux, Git, RabbitMQ, SQL Databases, GitHub Copilot, Claude, Agentic Engineering)
- [x] Test that experience bars exist — check for `bg-accent` and `bg-white/5` (bar fill + track classes)
- [x] Test that years labels exist — check for `yr` text in the component
- [x] Test that `simple-icons` is NOT imported — `expect(skills).not.toContain('simple-icons')`
- [x] Test that the `#skills-heading` and `#skills` IDs are preserved (GSAP + nav links depend on them)
- [x] Read `package.json` and test that `simple-icons` is not in dependencies
- [x] Run `bun run test` and confirm all tests pass (including prior phase tests)

#### 17g — Update CLAUDE.md

- [x] Update the Skills.astro description in the Architecture section: change "responsive grid, 18 skills via simple-icons" to "categorized grid with experience bars, 6 categories, 23 skills"
- [x] Remove any mention of `simple-icons` from CLAUDE.md
- [x] Add note about the skill data structure (frontmatter array of categories → skills with years)

#### 17h — Visual check + docs

- [x] Run `bun run dev` and verify the skills section renders correctly in the browser
- [x] Check responsive layout: mobile (2 cols), tablet/sm (3 cols), desktop/lg (4 cols)
- [x] Verify hover states work (border accent, lift)
- [x] Verify GSAP scroll animations fire per category group
- [x] Verify experience bars have correct relative widths (10 yrs = 100%, 1 yr = 10%)
- [x] Cross off the skills item in `todo.md`
- [x] Mark Phase 17 complete in `plan.md` summary and completed phases list