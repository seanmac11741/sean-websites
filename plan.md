# Personal Website Plan — sean-mcconnell.com

All 19 phases are complete. The site is live at `sean-mcconnell.com`.

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
7. **Skills Section** — Rewritten in Phase 17
8. **Footer / Contact** — Email CTA, social links, copyright
9. **ScrollTrigger Animations** — All sections animate on scroll entry
10. **Responsive Polish** — Mobile-first layout, overflow-x fix
11. **SEO & Metadata** — OG tags, sitemap, favicon, canonical URL
12. **Content Fill-in** — Real bio, skills from resume, social links, photos
13. **Deploy** — Built and deployed to Firebase Hosting, custom domain connected with SSL
14. **Post-Launch Fixes** — New favicon, dynamic years of experience, McConnell text cutoff fix, Strava social links, "Request a website" CTA
15. **CI/CD with GitHub Actions** — Automated test → build → deploy on push to `main`
16. **Live Experience Timer** — Real-time ticking counter since April 23, 2015
17. **Skills Section Rewrite** — Categorized grid with experience bars (6 categories, 23 skills)
18. **Presentations Section** — Conference talks with title slide images, data-driven frontmatter, nav link
19. **Highlight Card Hover Interactions** — Weather widget (Wisconsin, Open-Meteo API, 30-min cache) + AWS Certified badge with yellow accent (AI & Cloud), mobile tap-to-toggle
20. **Buy Me a Coffee** — Footer link to buymeacoffee.com/seanmcconnell

---

## Blog — Tiptap + Firestore

**Phases 21–25 complete.** Dynamic blog powered by Cloud Functions (Blaze plan), Firestore, Firebase Auth (Google sign-in), and Firebase Storage. Tiptap WYSIWYG editor with auto-save, preview, publish/unpublish workflow. Public blog at `/blog`, admin at `/admin`. Posts served in real time via Cloud Function API.

### Phase 26 — Blog Polish & Nice-to-haves

- [ ] 26a. Reading time estimate — calculate from word count, display on post page and listing cards
- [ ] 26b. Code block syntax highlighting — configure lowlight with common languages (js, ts, python, bash, json)
- [ ] 26c. Blog post styling — typography, spacing, image sizing, responsive layout using Tailwind `prose` or custom styles matching the site's dark theme
- [ ] 26d. Google Docs `.md` import — admin page button to upload a `.md` file, parse base64 images, upload to Storage, convert to Tiptap JSON, load into editor
- [ ] 26e. 404 handling — blog post not found or not published shows a styled 404
- [ ] 26f. Mobile responsive — admin editor and public blog pages work well on mobile
- [ ] 26g. Loading states — skeleton/spinner while fetching blog content from Cloud Function
- [ ] 26h. Write final integration tests

---

## PR Code Review Agent — Claude in GitHub Actions

**Goal:** When a PR is opened or updated against `main`, GitHub Actions runs Claude Code in agent mode with the `pr_review` skill, which reviews the diff and posts comments directly on the PR. Fully automated — no manual trigger needed.

### How it works

1. `pull_request` event (opened/synchronize) triggers `.github/workflows/code-review.yml`
2. Workflow installs Claude Code CLI, then runs it in agent mode (`claude -p`) with the review prompt from `.claude/skills/pr_review/SKILL.md`
3. Claude reads the diff, explores relevant files for context, and posts a structured review comment on the PR via `gh`
4. The `pr_review` skill is self-improving — when Sean gives feedback on reviews locally, the skill updates its own SKILL.md with learned preferences, which get committed and apply to future CI runs

### Secrets needed

- `ANTHROPIC_API_KEY` — Claude API key (add manually in GitHub Settings > Secrets)
- `GITHUB_TOKEN` — built-in, already has PR write access

### Cost

Pay-per-token. A typical diff review is ~5K-20K input tokens + ~1K-3K output. Near-zero for a personal repo.

---

### Phase 27 — Secrets & Prerequisites

- [ ] 27a. Create an Anthropic API key (or use existing one) for CI usage
- [ ] 27b. Add `ANTHROPIC_API_KEY` to GitHub repo secrets (Settings > Secrets and variables > Actions)
- [ ] 27c. Verify `GITHUB_TOKEN` default permissions include `pull-requests: write` in repo settings (Settings > Actions > General > Workflow permissions)

### Phase 28 — GitHub Actions Workflow

- [ ] 28a. Create `.github/workflows/code-review.yml` with trigger on `pull_request` events (`opened`, `synchronize`) targeting `main` — separate from `deploy.yml` because deploy triggers on `push` (post-merge) while review must trigger on `pull_request` (pre-merge)
- [ ] 28b. Add job permissions: `permissions: pull-requests: write, contents: read`
- [ ] 28c. Checkout step — `actions/checkout@v4` with full history (`fetch-depth: 0`) so Claude can explore the repo
- [ ] 28d. Install Node.js (Claude Code CLI requires it)
- [ ] 28e. Install Claude Code CLI — `npm install -g @anthropic-ai/claude-code`
- [ ] 28f. Build the prompt step — construct the Claude prompt that:
  1. Reads the `pr_review` SKILL.md for review instructions
  2. Passes in the PR number from `${{ github.event.pull_request.number }}`
  3. Tells Claude to run in agent mode: fetch the diff with `gh pr diff`, read modified files for context, then post the review as a PR comment with `gh pr comment`
- [ ] 28g. Run Claude Code — `claude -p "<prompt>"` with `ANTHROPIC_API_KEY` and `GITHUB_TOKEN` as env vars
- [ ] 28h. Set a timeout on the job (e.g., 10 minutes) to cap runaway API costs
- [ ] 28i. Add `workflow_dispatch` trigger so the review can be re-run manually from the Actions tab

### Phase 29 — Prompt Engineering

- [ ] 29a. Write the CI prompt that loads the SKILL.md instructions and tells Claude to:
  - Run `gh pr diff $PR_NUMBER` to get the diff
  - Run `gh pr view $PR_NUMBER` to get the PR title/description
  - Read heavily modified files for full context (not just the diff)
  - Format the review per the SKILL.md structure
  - Post the review via `gh pr comment $PR_NUMBER --body "<review>"`
- [ ] 29b. Ensure the prompt tells Claude to respect `CLAUDE.md` (which it reads automatically from the repo root)
- [ ] 29c. Add guard rails — instruct Claude not to push code, merge, or modify files in CI (read-only review)
- [ ] 29d. Handle edge cases in the prompt: empty diffs, very large diffs (truncate or summarize), draft PRs

### Phase 30 — Documentation & Polish

- [ ] 31a. Add a "CI/CD — Code Review Agent" section to `CLAUDE.md` explaining the workflow and how to update the review prompt
- [ ] 31b. Update the CI/CD section in `CLAUDE.md` to reflect the new workflow alongside `deploy.yml`
- [ ] 31c. Update `todo.md` — remove the code review agent item from the CI/CD section