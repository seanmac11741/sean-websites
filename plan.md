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

## Blog — Tiptap + Firestore (not yet implemented)

**Branch:** `issue/blogcreation`

**Goal:** Admin page behind Firebase Auth with a WYSIWYG editor. Authors write directly in the browser — text, headings, links, code blocks, images. Auto-saves drafts, preview before publish. Must be customer-friendly (no Git, no CLI). Reusable for client sites.

### Architecture

- **Editor:** [Tiptap](https://tiptap.dev/) — headless WYSIWYG built on ProseMirror, highly customizable, supports all required block types (headings, links, code blocks, images) out of the box
- **Storage:** Posts saved as JSON (or HTML) in Firestore. Images uploaded to Firebase Storage, URLs inserted into the editor content
- **Auth:** Firebase Auth — both Google sign-in and email/password. Admin page checks auth before loading
- **Auto-save:** Debounced — save draft to Firestore after 3–5 seconds of inactivity (not on every keystroke). Standard pattern for WYSIWYG editors to avoid slamming Firestore write quotas
- **Workflow:** Auto-save drafts to Firestore → preview route renders the draft → "Publish" flips a status field → public blog reads only published posts

### Blog rendering — static vs dynamic

Two options for how the public `/blog` pages get their data:

**Static (Astro build-time fetch):** Astro fetches published posts from Firestore during `bun run build`. Posts become static HTML. A webhook or manual trigger kicks off a rebuild when you publish. Fastest page loads, simplest infrastructure, but there's a delay between publishing and the post going live (however long the build takes — currently ~1 min with CI/CD).

**Dynamic (Cloud Function):** A Cloud Function serves blog posts on request, reading from Firestore in real time. Posts go live instantly on publish. Adds a serverless layer.

**Cloud Functions cost:** Firebase free tier (Spark plan) does not include Cloud Functions. You'd need the Blaze (pay-as-you-go) plan. That said, actual cost for a personal blog is near-zero:
- 2M invocations/month free
- 400K GB-seconds compute/month free
- After free tier: ~$0.40 per million invocations + $0.0000025/GB-second
- A blog getting 1K visits/day wouldn't even dent the free tier

**Decision:** Dynamic via Cloud Functions. The site is a live demo of Sean's skills — Cloud Functions, Firestore, Firebase Auth, Firebase Storage all in production. Requires Blaze plan (pay-as-you-go), but actual cost is near-zero for personal traffic. Blog posts served by a Cloud Function reading from Firestore, live instantly on publish.

---

### Phase 21 — Firebase Backend Setup

Upgrade to Blaze plan (manual), initialize Cloud Functions + Firestore + Storage in the project.

- [x] 21a. Upgrade Firebase project to Blaze plan (manual — done in Firebase console)
- [x] 21b. Enable Firestore in Firebase console (choose `nam5` / us-central region)
- [x] 21c. Enable Firebase Storage in Firebase console
- [x] 21d. Enable Firebase Auth in Firebase console — turn on Google sign-in and email/password providers
- [x] 21e. Initialize Cloud Functions in the repo: `functions/src/index.ts`, `functions/package.json`, `functions/tsconfig.json`
- [x] 21f. Update `firebase.json` to add `functions` and `firestore` sections alongside existing `hosting`
- [x] 21g. Add Firestore security rules (`firestore.rules`) — admin write, public read for published posts
- [x] 21h. Add Storage security rules (`storage.rules`) — admin upload, public read for blog images
- [x] 21i. Deploy a hello-world Cloud Function to verify the pipeline works end-to-end
- [x] 21j. Update CI/CD (`deploy.yml`):
  - Add `issue/blogcreation` to the `branches` trigger so pushes to this branch run tests (currently only `main` triggers the workflow)
  - Add `bun install` step inside `functions/` (functions have their own `package.json`)
  - Replace `FirebaseExtended/action-hosting-deploy` with `firebase deploy` CLI (deploys hosting + functions + firestore rules + storage rules in one command)
  - Only deploy to production on `main` — on `issue/blogcreation`, run tests + build only (no deploy), or deploy to a Firebase preview channel
- [x] 21k. Write tests to verify firebase.json config, rules files exist, and function entry point exports

### Phase 22 — Auth & Admin Page Shell

Build the admin page at `/admin` with Firebase Auth gate.

- [x] 22a. Install `firebase` JS SDK as a dependency (`bun add firebase`)
- [x] 22b. Create `src/lib/firebase.ts` — initialize Firebase app, Auth, Firestore, Storage exports
- [x] 22c. Create `src/pages/admin/index.astro` — admin page shell (client-rendered behind auth)
- [x] 22d. Build login screen — Google sign-in button (Google-only, no email/password)
- [x] 22e. Auth state listener — redirect to login if not authenticated, show admin dashboard if authenticated
- [x] 22f. Allowlist check — only seanmac11741@gmail.com can access admin. Unauthorized users see "Access Denied" screen
- [x] 22g. Admin dashboard layout — sidebar with "Posts" list, "New Post" button
- [x] 22h. Add "Admin" link to Nav — hidden by default, shown via client-side auth check when admin is logged in
- [x] 22i. Write tests for auth config, admin page existence, firebase.ts exports

### Phase 23 — Tiptap Editor & Post Creation

Wire up the WYSIWYG editor for creating and editing blog posts.

- [x] 23a. Install Tiptap dependencies: `@tiptap/core`, `@tiptap/starter-kit`, `@tiptap/extension-image`, `@tiptap/extension-link`, `@tiptap/extension-code-block-lowlight`
- [x] 23b. Build editor component — toolbar with buttons for heading (H1-H3), bold, italic, link, code block, image upload, bullet/ordered list
- [x] 23c. Image upload flow — click image button → file picker → upload to Firebase Storage (`blog/{post-slug}/{filename}`) → insert Storage URL into editor
- [x] 23d. Post metadata form — title, slug (auto-generated from title, editable), description, tags
- [x] 23e. Debounced auto-save — save editor JSON + metadata to Firestore `posts/{slug}` after 3 seconds of inactivity. Show "Saving..." / "Saved" indicator
- [x] 23f. Post status field in Firestore: `draft` | `published`, with `createdAt`, `updatedAt`, `publishedAt` timestamps
- [x] 23g. Posts list in admin — show all posts with status, last edited date, edit/delete actions
- [x] 23h. Edit existing post — load from Firestore, populate editor, resume auto-save
- [x] 23i. Delete post — confirm dialog, remove from Firestore
- [x] 23j. Write tests for Tiptap config, Firestore document structure, auto-save debounce logic

### Phase 24 — Preview & Publish Workflow

Add preview rendering and the publish flow.

- [x] 24a. Preview route at `/admin/preview?slug={slug}` — renders the draft post exactly as it will appear on the public blog
- [x] 24b. Preview button in editor — opens preview in new tab
- [x] 24c. Publish button — sets `status: 'published'` and `publishedAt` timestamp in Firestore
- [x] 24d. Unpublish button — reverts to draft status (removes from public blog)
- [x] 24e. Publish confirmation dialog — "This will make the post live at sean-mcconnell.com/blog/{slug}"
- [x] 24f. Write tests for publish/unpublish status transitions

### Phase 25 — Public Blog Pages (Cloud Functions)

Build the public-facing blog served by Cloud Functions.

- [x] 25a. Cloud Function: `api` — single onRequest handler with `/api/blog/:slug` and `/api/blog` routes, reads from Firestore, returns JSON
- [x] 25b. Cloud Function: blog list endpoint — reads all published posts sorted by `publishedAt` desc
- [x] 25c. Create `src/pages/blog/index.astro` — blog listing page, fetches from `/api/blog` on client side
- [x] 25d. Create `src/pages/blog/post.astro` — individual post page, fetches from `/api/blog/:slug` on client side. Firebase rewrite serves this for `/blog/**` URLs
- [x] 25e. Blog post renderer — converts Tiptap JSON to HTML using `generateHTML` from `@tiptap/html`, styled with custom `.prose-blog` classes
- [x] 25f. Blog listing card design — title, description, date, tags, hover effect with accent border
- [x] 25g. Add "Blog" link to Nav component (desktop and mobile)
- [x] 25h. SEO — meta description updated dynamically per post, title set dynamically
- [x] 25i. Firebase Hosting rewrite rules — `/api/**` → Cloud Function, `/blog/**` → `/blog/post/index.html`
- [x] 25j. Write tests for Cloud Function responses, blog page existence, nav link

### Phase 26 — Polish & Nice-to-haves

Final touches on the blog experience.

- [ ] 26a. Reading time estimate — calculate from word count, display on post page and listing cards
- [ ] 26b. Code block syntax highlighting — configure lowlight with common languages (js, ts, python, bash, json)
- [ ] 26c. Blog post styling — typography, spacing, image sizing, responsive layout using Tailwind `prose` or custom styles matching the site's dark theme
- [ ] 26d. Google Docs `.md` import — admin page button to upload a `.md` file, parse base64 images, upload to Storage, convert to Tiptap JSON, load into editor
- [ ] 26e. 404 handling — blog post not found or not published shows a styled 404
- [ ] 26f. Mobile responsive — admin editor and public blog pages work well on mobile
- [ ] 26g. Loading states — skeleton/spinner while fetching blog content from Cloud Function
- [ ] 26h. Write final integration tests
