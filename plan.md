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

## Done

**Phases 1–25:** Site scaffold, layout, theming, nav, hero, about, skills, footer, animations, responsive polish, SEO, content, Firebase deploy, CI/CD, live experience timer, skills rewrite, presentations, highlight cards, Buy Me a Coffee, blog (Tiptap + Firestore + Cloud Functions + admin).

**Phases 27–29:** PR code review agent — Claude Code in GitHub Actions reviews PRs automatically via `code-review.yml`.

## Open

### Phase 26 — Blog Polish

- [ ] 26a. Reading time on post page and listing cards
- [ ] 26b. Code block syntax highlighting (lowlight)
- [ ] 26e. Styled 404 for missing/unpublished posts
- [ ] 26f. Mobile responsive admin editor + public blog
- [ ] 26g. Loading states (skeleton/spinner)
- [ ] 26h. Integration tests

### Phase 30 — PR Review Agent Docs

- [ ] 30a. Add "Code Review Agent" section to `CLAUDE.md`
- [ ] 30b. Update CI/CD section in `CLAUDE.md`
- [ ] 30c. Clean up `todo.md`

---

## Phase 31 — Latest Blog Post on Homepage

**Goal:** Show the most recent published blog post on the main landing page so visitors see fresh content without navigating to `/blog`.

### 31a. Create `LatestPost.astro` component skeleton

- [x] Create `src/components/LatestPost.astro`
- [x] Add a `<section id="latest-post">` with the same container pattern as other sections (`py-24 lg:py-32`, `max-w-6xl mx-auto px-6`)
- [x] Section heading: "Latest from the Blog" (`text-4xl sm:text-5xl font-black text-white`, wrapped in `overflow-hidden` div like Presentations/Skills)
- [x] Empty inner `<div id="latest-post-content">` that JS will populate

### 31b. Client-side fetch and render

- [x] `<script>` block fetches `/api/blog`, grabs `posts[0]` (already sorted by `publishedAt desc` from the API)
- [x] If no posts or fetch fails → hide the entire `#latest-post` section (`display: none`) — no error message on the portfolio page
- [x] Build a single card as an `<a>` linking to `/blog/:slug`, matching the blog listing card style:
  - Title (`text-xl font-semibold`, accent on hover)
  - Description (`text-slate-400 text-sm`, `line-clamp-2`)
  - Published date (formatted like blog listing: `Month Day, Year`)
  - Reading time (`X min read`)
  - Tags as pills (`text-xs bg-white/5 text-slate-400 px-2 py-1 rounded-full`)
  - "Read more →" link in accent color
- [x] Card styling: `rounded-xl border border-white/10 bg-surface/40 p-6`, hover states matching Presentations cards (`hover:border-accent/50 hover:-translate-y-1 hover:bg-surface/80 transition-all`)

### 31c. Loading spinner

- [x] Show an accent-colored spinner (`w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin`) inside `#latest-post-content` as default HTML (same pattern as `/blog` listing page)
- [x] Spinner is replaced by the card on successful fetch, or section is hidden if no posts

### 31d. GSAP scroll animation

- [x] Register ScrollTrigger in `<script>`
- [x] Heading reveal: `gsap.from('#latest-post-heading', { scrollTrigger: { trigger: '#latest-post', start: 'top 78%', once: true }, immediateRender: false, yPercent: 110, duration: 0.8, ease: 'power3.out' })`
- [x] Card fade-in: `gsap.from('#latest-post-card', { ... opacity: 0, y: 28, duration: 0.5, ease: 'power2.out' })` — triggered after fetch completes so the card is in the DOM

### 31e. Add to homepage

- [x] Import `LatestPost` in `src/pages/index.astro`
- [x] Place `<LatestPost />` between `<Skills />` and `<Footer />` (after skills, before contact — fresh content as a final hook before the CTA)

### 31f. Responsive and style polish

- [x] Card is full-width on mobile, constrained within `max-w-6xl` on desktop
- [x] Verify section spacing is consistent with Presentations → Skills → LatestPost → Footer flow

### 31g. Tests

- [x] Create `tests/phase31.test.ts` following the existing test file pattern
- [x] Test: `LatestPost.astro` file exists
- [x] Test: component has `id="latest-post"` section
- [x] Test: component contains a fetch to `/api/blog`
- [x] Test: component has a loading spinner element
- [x] Test: component has GSAP ScrollTrigger animation
- [x] Test: component handles empty/error state (hides section)
- [x] Test: `index.astro` imports and renders `<LatestPost />`
- [x] Run `bun run test` — all 303 tests pass (19 new)
- [x] Run `bun run build` — no build errors