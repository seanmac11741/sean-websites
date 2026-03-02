# Personal Website Plan — sean-mcconnell.com

All 16 phases are complete. The site is live at `sean-mcconnell.com`.

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
7. **Skills Section** — Responsive grid of 18 tech skills using `simple-icons`
8. **Footer / Contact** — Email CTA, social links, copyright
9. **ScrollTrigger Animations** — All sections animate on scroll entry
10. **Responsive Polish** — Mobile-first layout, overflow-x fix
11. **SEO & Metadata** — OG tags, sitemap, favicon, canonical URL
12. **Content Fill-in** — Real bio, skills from resume, social links, photos
13. **Deploy** — Built and deployed to Firebase Hosting, custom domain connected with SSL
14. **Post-Launch Fixes** — New favicon from logo image, dynamic years of experience, McConnell text cutoff fix, Strava social links, "Request a website" CTA with Google Form
15. **CI/CD with GitHub Actions** — Automated test → build → deploy on push to `main`
16. **Live Experience Timer** — Real-time ticking counter (YRS/MO/DAYS/HRS/MIN/SEC) since April 23, 2015

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