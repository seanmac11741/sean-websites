# Personal Website Plan — sean-mcconnell.com

Live at `sean-mcconnell.com`. **Deferred work:** `todo.md`

## Stack

| Layer | Choice |
|---|---|
| Framework | Astro 5 (static output) |
| Runtime / PM | Bun |
| Animations | GSAP 3 + ScrollTrigger |
| Styling | Tailwind CSS 4 |
| Hosting | Firebase Hosting |
| Backend | Cloud Functions, Firestore, Firebase Auth, Firebase Storage |

## Completed

**Phases 1–25:** Site scaffold, layout, theming, nav, hero, about, skills, footer, animations, responsive polish, SEO, content, Firebase deploy, CI/CD, live experience timer, skills rewrite, presentations, highlight cards, Buy Me a Coffee, blog (Tiptap + Firestore + Cloud Functions + admin).

**Phases 27–30:** PR code review agent (Claude Code in GitHub Actions via `code-review.yml`), agent docs.

**Phase 31:** Latest blog post on homepage — `LatestPost.astro` component with GSAP scroll animations.

**Phase 32:** Tools page (`/tools` card grid index) + Flowstate Timer (`/tools/flowstate-timer`) — focus/break pomodoro timer with circular SVG progress ring, Web Audio API alarm, fun phrases, localStorage persistence, and canvas star field (real northern hemisphere constellations, stereographic projection, auto-rotation during focus, interactive drag during break with dawn ambiance).

## Phase 33 — Image Optimization, Cache Headers & Analytics

### Problem

Firebase Hosting bandwidth spiked to ~70GB/day. Root cause: unoptimized images (24MB hero photo at 9248x6936) served with no cache headers (Firebase default is 1 hour). Every page load re-downloads ~26MB of images.

### Image Optimization

- Use Astro's built-in `<Image>` component for About and Hero photos — auto-resizes and converts to WebP at build time
- Move `CasualMountainsSean.jpg` (24MB) and `ProfilePictureSeanWhiteSweater.png` (1.2MB) from `public/images/` to `src/assets/images/` (required for Astro image processing)
- About photo: 576x640 (2x retina for its 288x320 rendered size)
- Hero photo: 640x640 (2x retina for its max 320x320 rendered size)
- OG image: pre-resize `ProfilePictureSeanWhiteSweater.png` to 1200x630 manually, save as a separate optimized file in `public/images/` for `<meta>` tags
- Leave presentation image (331KB) and other `public/images/` assets as-is

### Cache Headers

- Add `headers` block to `firebase.json`
- `/_astro/**` → `Cache-Control: public, max-age=31536000, immutable` (content-hashed filenames, safe to cache forever)
- `/images/**`, `/favicon.ico`, `/apple-touch-icon.png` → `Cache-Control: public, max-age=604800` (7 days)

### Analytics

- Initialize Firebase Analytics via `getAnalytics(app)` in `firebase.ts` — the GA4 property (`G-9X4ZCDT7KD`) already exists in the config, just never activated
- Provides page views, traffic sources, and device breakdowns — enough to detect bot traffic
- No per-file download tracking needed

### Implementation Todo

Image optimization (1-5):
1. [x] Create `src/assets/images/` directory
2. [x] Move `CasualMountainsSean.jpg` and `ProfilePictureSeanWhiteSweater.png` from `public/images/` to `src/assets/images/`
3. [x] Update `About.astro` to use Astro `<Image>` component — import from `src/assets/images/`, set width=576 height=640, format WebP
4. [x] Update `Hero.astro` to use Astro `<Image>` component — import from `src/assets/images/`, set width=640 height=640, format WebP
5. [x] Create optimized OG image (1200x630) from `ProfilePictureSeanWhiteSweater.png`, save to `public/images/og-profile.jpg`, update `Layout.astro` meta tags to reference it

Cache headers (6):
6. [x] Add `headers` block to `firebase.json`: `/_astro/**` → 1 year immutable, `/images/**` + `/favicon.ico` + `/apple-touch-icon.png` → 7 days

Analytics (7-8):
7. [x] Add `getAnalytics` import and initialization to `src/lib/firebase.ts`
8. [x] Verify analytics initializes only in browser (not during SSG build) — guard with `typeof window !== 'undefined'` or equivalent

Validation (9-11):
9. [x] Run `bun run build` and verify dist output — check that About and Hero images are WebP and dramatically smaller than originals
10. [x] Run `bun run preview` and confirm images render correctly on homepage (About photo, Hero photo, OG meta tag)
11. [x] Run `bun run test` and verify all existing tests still pass
