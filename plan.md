# Personal Website Plan — sean-mcconnell.com

All 15 phases are complete. The site is live at `sean-mcconnell.com`.

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

- [ ] Push to `main` and verify the workflow runs in the GitHub Actions tab
- [ ] Confirm tests pass in the workflow logs
- [ ] Confirm build succeeds in the workflow logs
- [ ] Confirm `sean-mcconnell.com` updates after the deploy step completes
- [ ] Verify a failing test blocks the deploy (break a test temporarily, push, confirm deploy doesn't happen)

---

### 15d — Update docs

- [x] Update `CLAUDE.md` with CI/CD info
- [x] Cross off CI/CD in `todo.md`
- [x] Update `plan.md` with Phase 15 completion