# Migrate Hosting + Blog API from Firebase to Vercel

## Why

Firebase Hosting's default `*.web.app` and `*.firebaseapp.com` URLs cannot be disabled or restricted by hostname. Bots discovered them and bypass Cloudflare (22x discrepancy: Cloudflare sees 804 req/day, Firebase sees 18K). WAF rules and rate limits on the apex domain are useless against the bypass. Goal: eliminate the Firebase Hosting surface entirely and move public traffic onto Vercel.

## Scope

**Moving to Vercel:**
- Static site hosting (`dist/` — homepage, blog pages, admin pages, tools)
- Blog API (currently the `api` Cloud Function) as Vercel Serverless Functions

**Staying on Firebase:**
- Firestore (blog post storage)
- Firebase Auth (admin Google sign-in)
- Firebase Storage (blog image uploads)

Data-layer migration is out of scope. The bot problem is a hosting-surface problem; Firestore/Auth/Storage are not publicly addressable the same way and are working fine.

## Key Decisions

- **Vercel API talks to Firestore via `firebase-admin`** using a new read-only service account (Cloud Datastore User role only). Service account JSON lives in a single Vercel env var; never committed.
- **Admin pages remain client-side Firebase SDK.** Vercel only serves the static HTML/JS; browser makes direct SDK calls to Firebase Auth / Firestore / Storage as today. Firebase web config stays hardcoded (it's public by design; rules enforce security).
- **CORS tightened** on the new API to `https://sean-mcconnell.com` and `http://localhost:4321`. The existing Cloud Function's `*` wildcard goes away.
- **Firebase Auth authorized domains:** no change required — `sean-mcconnell.com` is already listed. Vercel preview domains are *not* added; admin is production-only.
- **`/blog/**` rewrite ported to `vercel.json`** (same SPA-style catch-all to `/blog/post/index.html`). `/api/**` becomes native Vercel functions, no rewrite needed.
- **Cache headers from `firebase.json` ported to `vercel.json`** (`_astro/**` immutable, `/images/**` and favicons 7-day).
- **DNS cutover is a direct swap** at Cloudflare. TTL pre-lowered to 60s the day before. No preview subdomain.
- **Cloudflare stays proxied (orange cloud) in front of Vercel.** Existing WAF rules and rate limits remain active as defense in depth. Vercel's DDoS protection runs underneath.
- **Vercel owns deploys** via its GitHub integration (auto-deploy on push to main, preview per branch). Existing `.github/workflows/deploy.yml` becomes tests-only on PRs; the Firebase deploy step is removed. `code-review.yml` unchanged.
- **Firestore/Storage rules deploys** (rare) become a documented manual `firebase deploy --only firestore:rules,storage` command.

## Verification Gate (before any Firebase teardown)

After DNS cutover, all of the following must pass on the real `sean-mcconnell.com` domain:

1. DNS resolves to Vercel; Cloudflare proxy active
2. Homepage renders (all sections, GSAP animations, images)
3. `/blog` listing fetches from Vercel API and shows published posts
4. `/blog/:slug` renders a known post correctly
5. `/tools` index and `/tools/flowstate-timer` work
6. Admin Google sign-in completes; Admin nav link appears
7. Admin editor: create draft, auto-save fires, reload shows persisted content
8. Image upload in editor works; image loads from Firebase Storage
9. Publish flow: publish test post, appears on `/blog`
10. Vercel analytics show traffic after 24h; Cloudflare still sees request volume on apex
11. 48-hour waiting period elapsed with no reported issues

## Teardown (after verification gate)

1. `firebase hosting:disable` — neutralizes `*.web.app` / `*.firebaseapp.com` bot surface
2. Delete the `api` Cloud Function — removes the `*.cloudfunctions.net` URL
3. Re-verify `sean-mcconnell.com` still works end-to-end after each step

## Rollback

If verification fails and the issue isn't fixable within ~30 minutes: `git revert` the migration commit on `main` and manually flip the Cloudflare DNS record back to Firebase. Firebase Hosting stays live through the entire verification window specifically to keep rollback trivial.

## Risks

- DNS propagation: with 60s TTL, small window (~5–15 min) where some resolvers still point at Firebase. Both hosts work during this time — no downtime.
- `/api/**` CORS change from `*` to explicit origin — verify no other consumer (there shouldn't be any).
- Cloudflare + Vercel occasionally have double-compression / header edge cases; monitor for these during the 48-hour window.
- Bot traffic to `*.web.app` continues until `hosting:disable` runs. Bandwidth bleed is bounded by the 48-hour gate.

## Implementation Todos

**[MANUAL]** = Sean does this (account setup, secrets, DNS, git, Firebase CLI). Everything else is code/config changes Claude can make via PR.

Ordered by dependency: account setup first, then code wired against the new account, then a dry run on a Vercel preview URL, then DNS + verification, then teardown.

### Vercel account setup (1–5) — [MANUAL, do first]

1. [] **[MANUAL]** Create a Vercel account (Hobby tier) at vercel.com using the `seanmac11741@gmail.com` Google login. Confirm it's the Hobby plan (non-commercial is fine for this personal site).
2. [] **[MANUAL]** Install the Vercel GitHub app on the repo. Grant it access to the `sean-websites` repo only.
3. [] **[MANUAL]** Import the `sean-websites` repo into Vercel as a new project. Set build command `bun run build`, output directory `dist/`, install command `bun install`, framework preset "Astro". Do **not** trigger a production deploy yet — let it build a preview only.
4. [] **[MANUAL]** Confirm the first Vercel preview build succeeds and the preview URL (`<project>-<hash>.vercel.app`) loads the homepage. Blog pages will 404 and `/api/blog` will fail — expected at this stage.
5. [] **[MANUAL]** In Vercel project settings, disable "Comments" and "Password Protection" if enabled by default; set production branch to `main`.

### Firebase service account for Vercel (6–8) — [MANUAL]

6. [] **[MANUAL]** In Google Cloud Console for the `sean-mcconnell-site` project, create a new service account named `vercel-blog-api`. Grant **Cloud Datastore User** role only (no Storage, no Auth admin, no Functions).
7. [] **[MANUAL]** Generate a JSON key for that service account and download it locally. Do **not** commit it or share it with Claude.
8. [] **[MANUAL]** In the Vercel project's Environment Variables settings, add `FIREBASE_SERVICE_ACCOUNT_JSON` (paste the full JSON as the value). Scope: Production, Preview, Development. Then delete the local JSON file.

### Vercel API implementation (9–13)

9. [] Add `firebase-admin` as a dev dependency at the repo root (for the Vercel API routes). Keep the existing `functions/` workspace untouched for now.
10. [] Create a Vercel API route at `api/blog/index.ts` that lists published posts (ports the `/blog` branch from `functions/src/index.ts`).
11. [] Create a Vercel API route at `api/blog/[slug].ts` that fetches a single published post by slug (ports the `/blog/:slug` branch).
12. [] Both routes: initialize `firebase-admin` from `FIREBASE_SERVICE_ACCOUNT_JSON` env var; set CORS headers to allow `https://sean-mcconnell.com` and `http://localhost:4321` only; preserve the existing response shape (`slug`, `title`, `description`, `tags`, `publishedAt`, `readingTime`, `content`) so the frontend needs no changes.
13. [] Add `vercel.json` with: (a) rewrite `{ "source": "/blog/:path", "destination": "/blog/post/index.html" }`, (b) cache headers matching current `firebase.json` (`_astro/**` 1yr immutable, `/images/**` + favicons 7 days).

### Preview verification (14–21) — on `*.vercel.app` URL

14. [] Push the migration branch. Confirm Vercel builds a preview deploy successfully and the preview URL loads.
15. [] On the preview URL: homepage renders with all sections, GSAP animations, images load.
16. [] On the preview URL: `/blog` lists published posts from the new Vercel API (check browser devtools Network tab — request goes to `/api/blog` served by Vercel, not Firebase).
17. [] On the preview URL: a known `/blog/:slug` renders content correctly.
18. [] On the preview URL: `/tools` and `/tools/flowstate-timer` work.
19. [] On the preview URL: admin login. Expected: Firebase Auth may reject the `*.vercel.app` domain — if so, skip admin verification on preview and verify after DNS cutover (confirmed-production domain will be `sean-mcconnell.com` which is already allowed).
20. [] Confirm no CORS errors in console; confirm response shapes match what `/blog/index.astro` and `/blog/post.astro` expect.
21. [] Merge the migration branch once all preview checks pass. **[MANUAL — SEAN]** handles the actual git merge.

### CI/CD rewiring (22–24)

22. [] Rewrite `.github/workflows/deploy.yml` to run on PRs to `main` only, and only run `bun install → bun run test → bun run build` (as a build-validity check). Remove the Firebase deploy step, remove the functions build, remove the `FIREBASE_SERVICE_ACCOUNT` reference.
23. [] Confirm `.github/workflows/code-review.yml` still works unchanged (no relation to hosting).
24. [] **[MANUAL — SEAN]** After merge to `main`: verify Vercel auto-deploys the production build at `<project>.vercel.app`. Smoke-test the production-mode Vercel URL same as preview checks.

### DNS cutover prep (25–27) — [MANUAL]

25. [] **[MANUAL]** In Cloudflare DNS settings for `sean-mcconnell.com`: lower the TTL on the apex A/CNAME record (currently pointing to Firebase) to 60 seconds. Wait at least the previous TTL duration before proceeding so the lowered TTL has propagated.
26. [] **[MANUAL]** In Vercel project settings → Domains: add `sean-mcconnell.com` and `www.sean-mcconnell.com`. Vercel will show the target CNAME / A records required. Do not update Cloudflare yet.
27. [] **[MANUAL]** Confirm current Firebase-hosted site is serving the latest build (check Firebase Hosting console) — do not cut over from a stale deploy.

### DNS cutover (28) — [MANUAL]

28. [] **[MANUAL]** In Cloudflare DNS: update the apex and `www` records to the Vercel target. Keep Cloudflare proxy enabled (orange cloud). Note the exact time — the 48-hour verification window starts now.

### Post-cutover verification (29–39) — on real `sean-mcconnell.com` domain

29. [] `dig sean-mcconnell.com +short` returns Cloudflare IPs; `curl -I https://sean-mcconnell.com` shows Vercel-served headers (e.g. `server: Vercel` behind Cloudflare) — confirms cutover took effect.
30. [] Homepage loads on `sean-mcconnell.com`; all sections, animations, images render.
31. [] `/blog` fetches from Vercel API and lists published posts.
32. [] A known `/blog/:slug` renders correctly.
33. [] `/tools` index and `/tools/flowstate-timer` work (constellation canvas, timer, alarm).
34. [] **[MANUAL — SEAN]** Admin Google sign-in at `sean-mcconnell.com/admin` completes; Admin nav link appears.
35. [] **[MANUAL — SEAN]** Admin editor: create a test draft, confirm auto-save fires, reload and confirm persistence.
36. [] **[MANUAL — SEAN]** Admin editor: upload a test image, confirm it loads from Firebase Storage.
37. [] **[MANUAL — SEAN]** Publish the test post, confirm it appears on `/blog`; unpublish/delete the test post after.
38. [] After 24h: check Vercel analytics show traffic on apex; check Cloudflare analytics show request volume consistent with Vercel's numbers (previously Cloudflare was undercounting by 22x because of the `*.web.app` bypass).
39. [] After 48h with no reported issues: proceed to teardown. If any check above fails and isn't fixable in ~30 min: **[MANUAL — SEAN]** `git revert` the migration commit on `main` and revert the Cloudflare DNS record to Firebase.

### Firebase teardown (40–44) — [MANUAL, after 48h gate]

40. [] **[MANUAL — SEAN]** Run `firebase hosting:disable` for the `sean-mcconnell-site` project. Confirm `*.web.app` / `*.firebaseapp.com` return Google's default "site not found" page (not billed to you).
41. [] **[MANUAL — SEAN]** Re-verify `sean-mcconnell.com` still works end-to-end after hosting disable.
42. [] **[MANUAL — SEAN]** In Google Cloud Console, delete the `api` Cloud Function. Confirm the `*.cloudfunctions.net/api` URL no longer responds.
43. [] **[MANUAL — SEAN]** Re-verify `sean-mcconnell.com/blog` and `/blog/:slug` still work (served by Vercel API).
44. [] **[MANUAL — SEAN]** Monitor bandwidth/traffic for a further 72h. Confirm the 22x Firebase/Cloudflare discrepancy is gone and bot traffic is now visible to Cloudflare's WAF.

### Code cleanup (45–48)

45. [] Delete `firebase.json`'s `hosting` block (keep `functions` block temporarily — see next). Delete `functions/` source directory entirely once the Cloud Function is deleted (step 42).
46. [] Remove the `functions` block from `firebase.json` once `functions/` is deleted. Firestore and Storage blocks remain.
47. [] Update `CLAUDE.md`: change hosting from "Firebase Hosting (`dist/` → Firebase)" to "Vercel (`dist/` auto-deployed from GitHub)". Update CI/CD section (deploy is Vercel; `deploy.yml` is tests-only). Update architecture section (blog API lives in `api/` at repo root, not `functions/src/index.ts`). Remove references to Cloud Functions.
48. [] Update `README.md` similarly if it mentions Firebase Hosting.

### Documentation of new manual operations (49)

49. [] Add a short "Rules deploy" note to `CLAUDE.md`: Firestore/Storage rules changes (rare) now require a manual `firebase deploy --only firestore:rules,storage` run, since the automated deploy is gone.
