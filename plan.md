# Personal Website Plan — sean-mcconnell.com

## What is Astro?

Astro is a web framework designed specifically for content-heavy, mostly-static sites (portfolios, blogs, docs). The key idea: it renders everything to plain HTML at build time and ships **zero JavaScript to the browser by default**. If you need interactivity (like a GSAP animation or a contact form), you opt in explicitly per-component — this is called the "Islands" architecture. The result is extremely fast, lightweight pages.

You write components in `.astro` files, which look like HTML with a script section at the top for build-time logic. It also supports Tailwind, TypeScript, and markdown out of the box. For deployment, `bun run build` produces a static `dist/` folder that you just upload to Firebase Hosting — no server, no runtime.

---

## Stack

| Layer | Choice | Reason |
|---|---|---|
| Framework | **Astro** (static output) | Purpose-built for portfolio + blog, ships zero JS by default, great Bun support |
| Runtime / PM | **Bun** | Fast installs, runs scripts, no Node needed |
| Animations | **GSAP + ScrollTrigger** | Industry-standard for flashy scroll-driven animations; works without a UI framework |
| Styling | **Tailwind CSS** | Astro has first-class Tailwind support; pairs well with custom animation code |
| Hosting | **Firebase Hosting** | Deploy static build output, CDN-backed, free tier is generous |

---

## Visual Design Direction

- **Dark, bold aesthetic** — deep near-black background (`#0A0A0F`), accent color `#818CF8` (electric indigo — easily changed via one CSS variable `--accent` in `global.css`, VS Code color picker works on hex values)
- **Full-viewport hero** — name in huge type with a text-reveal animation, subtitle fades in after, photo of you on one side
- **Sticky/transparent nav** — links to sections, fades to solid on scroll
- **Scroll-triggered section entrances** — every section slides/fades in as it enters the viewport via GSAP ScrollTrigger
- **Smooth scroll** throughout the page
- **Professional photo integration** — hero uses your existing profile picture in `public/images/`

---

## Photos

**Already have:**
- Profile picture (`public/images/`) → used in hero section

**Recommended to add for a complete site:**
- **Casual/candid shot** — natural, relaxed; used in About section to show personality
- **At-work shot** — you at a desk, coding, or in a meeting; reinforces the professional context
- **Outdoor/lifestyle shot** — optional, but adds warmth and makes the site feel human

You can add these to `public/images/` later and I'll wire them up. For now, placeholders will mark where they go.

---

## Page Sections (single-page layout)

Hero → About → Skills → Contact/Footer

*(Projects section deferred — see `todo.md`)*

### 1. Hero
- Your name (large animated text reveal, letter-by-letter or line wipe)
- Title / tagline (e.g. "Software Engineer") with a typewriter or cycle effect
- Profile photo with subtle float/parallax animation
- Two CTA buttons: "View my work ↓" and "Get in touch"
- Icon links: GitHub, GitLab, LinkedIn (with hover animations)

### 2. About
- Short bio paragraph (2–3 sentences — you'll fill this in)
- Photo placeholder (casual shot)
- Key facts / highlights

### 3. Skills / Stack
- Grid of tech icons with names
- Subtle hover lift effect

### 4. Contact / Footer
- Email link or contact CTA
- Repeated social icon links (GitHub, GitLab, LinkedIn)
- Copyright

---

## Project File Structure

```
sean-websites/              ← existing git repo
├── src/
│   ├── pages/
│   │   └── index.astro     ← single landing page
│   ├── components/
│   │   ├── Hero.astro
│   │   ├── About.astro
│   │   ├── Skills.astro
│   │   └── Footer.astro
│   ├── layouts/
│   │   └── Layout.astro    ← <html>, <head>, meta, GSAP import
│   └── styles/
│       └── global.css      ← Tailwind base + --accent CSS variable
├── public/
│   └── images/             ← profile picture already here
├── astro.config.mjs
├── tailwind.config.ts
├── firebase.json
├── .firebaserc
└── package.json
```

The old `public/index.html`, `public/app.js`, `public/styles.css` will be removed. The `public/images/` folder is kept.

---

## Build & Deploy Workflow

```bash
# Development
bun install
bun run dev                  # local dev server at localhost:4321

# Production build (outputs to dist/)
bun run build

# Preview build locally before deploying
bun run preview

# Deploy to Firebase Hosting
firebase deploy
```

Firebase `firebase.json` will point public dir to `dist/`.

---

## Detailed Task List

---

### Phase 1 — Scaffold & Setup ✅

- [x] Run `bun create astro` inside `sean-websites/`, select minimal/empty template
- [x] Add Tailwind CSS: `bunx astro add tailwind`
- [x] Install GSAP: `bun add gsap`
- [x] Delete old static files: `public/index.html`, `public/app.js`, `public/styles.css`
- [x] Verify `bun run dev` starts with no errors

---

### Phase 2 — Firebase Setup ✅

- [x] Install Firebase CLI if not present: `bun add -g firebase-tools`
- [x] Run `firebase login`
- [x] Run `firebase init hosting` — set public dir to `dist`, configure as single-page app (no — keep index.html rewrite off for static)
- [x] Verify `firebase.json` has `"public": "dist"` and a `"404.html"` fallback
- [x] Add `.firebaserc` with project ID for `sean-mcconnell.com`
- [x] Add `firebase.json` and `.firebaserc` to git (they are not secrets)

---

### Phase 3 — Global Layout & Theming ✅

- [x] Create `src/layouts/Layout.astro` — wraps every page with `<html>`, `<head>`, `<body>`
- [x] Add Inter font via Google Fonts `<link>` in the `<head>`
- [x] Create `src/styles/global.css` with:
  - [x] Tailwind directives (`@import "tailwindcss"`)
  - [x] CSS variable `--accent: #818CF8;` (electric indigo — change with VS Code color picker)
  - [x] CSS variable `--bg: #0A0A0F;` (near-black)
  - [x] Base `body` styles: background, text color, font-family, `scroll-behavior: smooth`
- [x] Configure Tailwind CSS 4 `@theme` to expose `--accent` and `--bg` as Tailwind color tokens
- [x] Import `global.css` in `Layout.astro`
- [x] Create `src/pages/index.astro` using `Layout`, with all section components

---

### Phase 4 — Navigation ✅

- [x] Create `src/components/Nav.astro`
- [x] Left side: name/logo text
- [x] Right side: anchor links to `#about`, `#skills`, `#contact`
- [x] Right side: GitHub, GitLab, LinkedIn icon links (SVG inline)
- [x] Sticky positioning, starts fully transparent
- [x] GSAP `ScrollTrigger`: add solid background color once page scrolls past the hero
- [x] Mobile: collapse links behind a hamburger icon below `md` breakpoint
- [x] Hamburger toggles a slide-down menu

---

### Phase 5 — Hero Section ✅

- [x] Create `src/components/Hero.astro`
- [x] Full-viewport height layout (`min-h-screen`), vertically centered
- [x] Left column: name, tagline, buttons, social icons
- [x] Right column: profile photo (`public/images/` — existing file)
- [x] Style profile photo: circular clip, accent-color glow
- [x] GSAP entrance timeline (fires on page load):
  - [x] Name: line-wipe reveal (text slides up from below a mask)
  - [x] Tagline: fade + slide up, 0.3s after name
  - [x] CTA buttons: fade + slide up, staggered
  - [x] Photo: fade in with subtle upward drift
- [x] Tagline typewriter/cycle effect cycling through 2–3 titles
- [x] CTA buttons: "View my work ↓" (scrolls to Skills) and "Get in touch" (scrolls to Contact)
- [x] Social icon links with scale + color hover animation

---

### Phase 6 — About Section ✅

- [x] Create `src/components/About.astro`
- [x] Two-column layout: text on left, photo on right (stacks on mobile)
- [x] Heading: "About"
- [x] Bio paragraph placeholder (fill this in before launch)
- [x] Key highlights: 3 stat-style facts (fill these in)
- [x] Photo slot: placeholder box with label "add casual photo here"

---

### Phase 7 — Skills Section ✅

- [x] Create `src/components/Skills.astro`
- [x] Define skills list as a data array at top of component (easy to edit)
- [x] Use Simple Icons SVGs via `simple-icons` npm package
- [x] Responsive grid: 4-col on desktop, 3-col on tablet, 2-col on mobile
- [x] Each skill card: icon + label, rounded border, subtle background
- [x] CSS hover: lift (`-translate-y-1`) + accent border color, transition on all

---

### Phase 8 — Footer / Contact ✅

- [x] Create `src/components/Footer.astro`
- [x] Section heading: "Get in touch"
- [x] Short line of copy
- [x] Email link styled as a large accent-colored button — **fill in your email**
- [x] Row of social icon links: GitHub, GitLab, LinkedIn — **fill in your URLs**
- [x] Bottom bar: copyright `© 2025 Sean McConnell`

---

### Phase 9 — ScrollTrigger Animations ✅

- [x] Register GSAP ScrollTrigger plugin in each component that uses it
- [x] About section: heading wipes in, text fades up, photo slides in from right
- [x] Skills section: heading wipes in, cards stagger-fade in
- [x] Footer: heading + content fade up
- [x] Tuned `start: "top 78%"` trigger points for natural scroll feel

---

### Phase 10 — Responsive Polish ✅

- [x] Hero: on mobile, photo stacks above text; heading scales down (`text-6xl sm:text-7xl lg:text-8xl`)
- [x] About: stacks to single column on mobile
- [x] Nav: hamburger functional on mobile, links close menu on click
- [x] `overflow-x: hidden` on body to prevent horizontal scroll from GSAP animations

---

### Phase 11 — SEO & Metadata ✅

- [x] `<title>`: "Sean McConnell — Software Engineer"
- [x] `<meta name="description">`: 1–2 sentence summary
- [x] Open Graph tags: `og:title`, `og:description`, `og:image`, `og:url`
- [x] Twitter card meta tags
- [x] Favicon: stylized "SM" SVG in accent color on dark background
- [x] Install and configure `@astrojs/sitemap` — generates `sitemap-index.xml` at build time
- [x] Add `<link rel="canonical">` in Layout
- [x] `site: 'https://sean-mcconnell.com'` set in `astro.config.mjs`

---

### Phase 12 — Content Fill-in ✅

- [x] Write bio paragraph for About section
- [x] Finalize skills list — updated from resume (18 skills: JS, Node, Python, Java, React, Express, AWS, Docker, Terraform, GitLab CI/CD, RabbitMQ, Jest, Git, Linux, Bash, Oracle/SQL, PM2, PowerShell)
- [x] Add email address to Footer (`seanmac11741@gmail.com`)
- [x] Add real GitHub (`seanmac11741`), GitLab (`git.doit.wisc.edu/SEAN.MCCONNELL`), LinkedIn URLs to Nav, Hero, Footer
- [x] Add casual photo `CasualMountainsSean.jpg` to `public/images/` and wired up in About
- [x] Key highlights filled in: 11+ years, Wisconsin, AI & Cloud
- [x] Typewriter titles updated to include all roles

---

### Phase 13 — Deploy

- [ ] Run `bun run build` — confirm `dist/` is generated with no errors
- [ ] Run `bun run preview` — do a final local check
- [ ] Run `firebase deploy`
- [ ] Open `https://sean-mcconnell.com` and verify everything loads
- [ ] Check Firebase Hosting console — confirm custom domain is connected and SSL is active
- [ ] Test on mobile (real device) after deploy
- [ ] Commit everything to `main`
