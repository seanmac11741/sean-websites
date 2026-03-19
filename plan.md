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

**Phase 30:** PR review agent docs — updated `CLAUDE.md` CI/CD section, added code review agent docs, cleaned up `todo.md`.

**Phase 31:** Latest blog post on homepage — `LatestPost.astro` component fetches most recent published post from `/api/blog`, renders as a card between Skills and Footer with GSAP scroll animations, loading spinner, and error handling (303 tests).

## Open

### Phase 26 — Blog Polish

- [ ] 26a. Reading time on post page and listing cards
- [ ] 26b. Code block syntax highlighting (lowlight)
- [ ] 26e. Styled 404 for missing/unpublished posts
- [ ] 26f. Mobile responsive admin editor + public blog
- [ ] 26g. Loading states (skeleton/spinner)
- [ ] 26h. Integration tests

---