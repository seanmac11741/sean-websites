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

### Phase 2 — Firebase Setup

- [ ] Install Firebase CLI if not present: `bun add -g firebase-tools`
- [ ] Run `firebase login`
- [ ] Run `firebase init hosting` — set public dir to `dist`, configure as single-page app (no — keep index.html rewrite off for static)
- [ ] Verify `firebase.json` has `"public": "dist"` and a `"404.html"` fallback
- [ ] Add `.firebaserc` with project ID for `sean-mcconnell.com`
- [ ] Add `firebase.json` and `.firebaserc` to git (they are not secrets)

---

### Phase 3 — Global Layout & Theming

- [ ] Create `src/layouts/Layout.astro` — wraps every page with `<html>`, `<head>`, `<body>`
- [ ] Add Inter font via Google Fonts `<link>` in the `<head>`
- [ ] Create `src/styles/global.css` with:
  - [ ] Tailwind directives (`@tailwind base`, `components`, `utilities`)
  - [ ] CSS variable `--accent: #818CF8;` (electric indigo — change with VS Code color picker)
  - [ ] CSS variable `--bg: #0A0A0F;` (near-black)
  - [ ] Base `body` styles: background, text color, font-family, `scroll-behavior: smooth`
- [ ] Configure `tailwind.config.ts` to expose `--accent` and `--bg` as Tailwind color tokens
- [ ] Import `global.css` in `Layout.astro`
- [ ] Create `src/pages/index.astro` using `Layout`, with empty section placeholders

---

### Phase 4 — Navigation

- [ ] Create `src/components/Nav.astro`
- [ ] Left side: name/logo text
- [ ] Right side: anchor links to `#about`, `#skills`, `#contact`
- [ ] Right side: GitHub, GitLab, LinkedIn icon links (SVG inline or from `public/`)
- [ ] Sticky positioning, starts fully transparent
- [ ] GSAP `ScrollTrigger`: add solid background color once page scrolls past the hero
- [ ] Mobile: collapse links behind a hamburger icon below `md` breakpoint
- [ ] Hamburger toggles a slide-down menu

---

### Phase 5 — Hero Section

- [ ] Create `src/components/Hero.astro`
- [ ] Full-viewport height layout (`min-h-screen`), vertically centered
- [ ] Left column: name, tagline, buttons, social icons
- [ ] Right column: profile photo (`public/images/` — existing file)
- [ ] Style profile photo: circular or rounded clip, subtle accent-color ring/glow
- [ ] GSAP entrance timeline (fires on page load):
  - [ ] Name: clip-path line-wipe reveal (text slides up from below a mask)
  - [ ] Tagline: fade + slide up, 0.3s after name
  - [ ] CTA buttons: fade + slide up, staggered
  - [ ] Photo: fade in with subtle upward drift
- [ ] Tagline typewriter/cycle effect cycling through 2–3 titles (e.g. "Software Engineer", "Full-Stack Developer", "Builder of Things")
- [ ] CTA buttons: "View my work ↓" (scrolls to Skills) and "Get in touch" (scrolls to Contact)
- [ ] Social icon links with scale + color hover animation

---

### Phase 6 — About Section

- [ ] Create `src/components/About.astro`
- [ ] Two-column layout: text on left, photo on right (reverses on mobile to stack)
- [ ] Heading: "About"
- [ ] Bio paragraph placeholder (3–4 sentences — **you fill this in before launch**)
- [ ] Key highlights: 2–3 short stat-style facts (e.g. "5 years experience", "based in X", "focus: Y") — **you fill these in**
- [ ] Photo slot: placeholder box with label "add casual photo here" until real photo is ready

---

### Phase 7 — Skills Section

- [ ] Create `src/components/Skills.astro`
- [ ] Define skills list as a data array at top of component (easy to edit): name + icon SVG or devicon class
- [ ] Use [Simple Icons](https://simpleicons.org/) SVGs for consistent, high-quality tech logos
- [ ] Responsive grid: 4-col on desktop, 3-col on tablet, 2-col on mobile
- [ ] Each skill card: icon + label, rounded border, subtle background
- [ ] CSS hover: lift (`translateY(-4px)`) + accent border color, `transition` on all

---

### Phase 8 — Footer / Contact

- [ ] Create `src/components/Footer.astro`
- [ ] Section heading: "Get in touch"
- [ ] Short line of copy (e.g. "Open to new opportunities — reach out any time.")
- [ ] Email link styled as a large accent-colored button/link — **you fill in your email**
- [ ] Row of social icon links: GitHub, GitLab, LinkedIn — **you fill in your URLs**
- [ ] Bottom bar: copyright `© 2025 Sean McConnell`

---

### Phase 9 — ScrollTrigger Animations

- [ ] Register GSAP ScrollTrigger plugin in a shared `<script>` in `Layout.astro`
- [ ] About section: heading wipes in, text fades up, photo slides in from right
- [ ] Skills section: heading wipes in, cards stagger-fade in (each 0.08s apart)
- [ ] Footer: heading + content fade up
- [ ] Tune `start: "top 80%"` trigger points so animations feel natural while scrolling
- [ ] Test that all animations replay correctly on page refresh

---

### Phase 10 — Responsive Polish

- [ ] Audit every section at 375px (iPhone SE), 768px (iPad), 1280px (desktop)
- [ ] Hero: on mobile, stack photo above text; scale heading font down
- [ ] About: stack to single column on mobile
- [ ] Nav: hamburger functional on mobile, links work and close menu on click
- [ ] Check that GSAP animations don't cause horizontal scroll on mobile (clip `overflow-x: hidden` on body if needed)
- [ ] Verify touch scrolling feels smooth

---

### Phase 11 — SEO & Metadata

- [ ] `<title>`: "Sean McConnell — Software Engineer"
- [ ] `<meta name="description">`: 1–2 sentence summary
- [ ] Open Graph tags: `og:title`, `og:description`, `og:image` (use profile photo), `og:url`
- [ ] Favicon: create a simple SVG or PNG favicon, place in `public/`
- [ ] Install and configure `@astrojs/sitemap` — generates `sitemap.xml` at build time
- [ ] Add `<link rel="canonical">` in Layout
- [ ] Verify no broken links before deploy

---

### Phase 12 — Content Fill-in *(you do this)*

- [ ] Write bio paragraph for About section
- [ ] Finalize skills list (add/remove technologies)
- [ ] Add your email address to the Footer
- [ ] Add your real GitHub, GitLab, LinkedIn URLs to Nav and Footer
- [ ] Add casual photo to `public/images/` and update the About section image path
- [ ] Review all placeholder text and replace with real copy

---

### Phase 13 — Deploy

- [ ] Run `bun run build` — confirm `dist/` is generated with no errors
- [ ] Run `bun run preview` — do a final local check
- [ ] Run `firebase deploy`
- [ ] Open `https://sean-mcconnell.com` and verify everything loads
- [ ] Check Firebase Hosting console — confirm custom domain is connected and SSL is active
- [ ] Test on mobile (real device) after deploy
- [ ] Commit everything to `main`
