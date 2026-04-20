# sean-mcconnell.com

## Personal notes
* I used Claude code to make this site. I will try not to touch the actual code at all.
* This site is a live demo of my skills. Every feature is intentional — Vercel (hosting + serverless functions), Firestore, Firebase Auth, Firebase Storage, CI/CD with GitHub Actions, GSAP animations, Astro SSG. If I know how to use it, it's running on this site. 

### Running locally

```bash
bun install        # first time only
bun run dev        # starts dev server at http://localhost:4321
```

Open `http://localhost:4321` in your browser. The page hot-reloads on file save.

To preview the production build before deploying:
```bash
bun run build && bun run preview
```

### Deploying

The site is hosted on Vercel. Deploys are automatic via the Vercel GitHub integration:

- Push to `main` → production deploy at `sean-mcconnell.com`
- Push to any other branch → preview deploy at `<project>-<hash>.vercel.app`

No manual deploy step is required. `.github/workflows/deploy.yml` runs `bun install → bun run test → bun run build` as a build-validity check on PRs; Vercel runs its own build independently.

**Firestore/Storage rules** are not deployed by Vercel. When rules change, deploy them manually:
```bash
firebase deploy --only firestore:rules,storage
```

### AI Agent Setup (Claude Code + Codex)

This repo is configured so both Claude Code and OpenAI Codex read the same instructions and skills via symlinks:

```
AGENTS.md              # canonical instructions file — edit this one
CLAUDE.md -> AGENTS.md # symlink (Claude Code reads this)
.agents/skills/        # canonical skills directory
.claude/skills -> ../.agents/skills  # symlink (Claude Code reads this)
```

- **Instructions:** `AGENTS.md` is the single source of truth. Claude Code follows `CLAUDE.md`, Codex follows `AGENTS.md` — the symlink keeps them in sync.
- **Skills:** Custom skills (pr_review, planner, tdd) live in `.agents/skills/`. Claude Code resolves them through the `.claude/skills` symlink.

To add a new skill, create `.agents/skills/<skill-name>/SKILL.md`. Both agents will pick it up.


### Setting up Cloudflare (bot protection + CDN)

The site previously got heavy bot traffic from AWS data centers (Boardman, WA). Cloudflare's free tier is configured on the domain for DNS, WAF rules, and analytics. Note: after the Vercel migration (April 2026), the Cloudflare proxy is set to DNS-only (grey cloud) — Vercel handles SSL and CDN directly. Cloudflare's WAF and AS-based block rules still apply when traffic traverses Cloudflare DNS.

**Step 1: Create Cloudflare account**
1. Go to https://dash.cloudflare.com/sign-up
2. Create a free account

**Step 2: Add your site**
1. Click "Add a site" in the Cloudflare dashboard
2. Enter `sean-mcconnell.com`
3. Select the **Free** plan
4. Cloudflare will scan your existing DNS records — verify they match what Squarespace has

**Step 3: Update DNS records in Cloudflare**
Cloudflare will import your existing records. Make sure these are present and **proxied** (orange cloud icon):
- `A` record for `sean-mcconnell.com` → Firebase Hosting IP (find current value in Squarespace DNS settings)
- `CNAME` record for `www` → `sean-mcconnell.com`

If Firebase uses custom domain verification TXT records, keep those as DNS-only (grey cloud).

**Step 4: Change nameservers on Squarespace**
1. Cloudflare will give you two nameservers (e.g., `alice.ns.cloudflare.com`, `bob.ns.cloudflare.com`)
2. Go to Squarespace → Domains → `sean-mcconnell.com` → DNS Settings → Nameservers
3. Switch from Squarespace default nameservers to the two Cloudflare nameservers
4. Save. Propagation takes minutes to 48 hours (usually under 1 hour)

**Step 5: Configure Cloudflare settings**
Once nameservers propagate and Cloudflare shows the site as "Active":

1. **SSL/TLS** → Set to "Full" (not "Full (Strict)" since Firebase uses its own cert)
2. **Caching** → Cache Level: Standard. Browser Cache TTL: Respect Existing Headers (your `firebase.json` already has cache headers)
3. **Security → WAF** → Create a rule to block bot traffic:
   - Rule name: "Block AWS scrapers"
   - Field: `AS Num` → Operator: `equals` → Value: `16509` (Amazon/AWS AS number)
   - Action: **Block**
4. **Security → Bot Fight Mode** → Toggle **On** (blocks known bot traffic automatically)

**Step 6: Verify**
1. Visit `sean-mcconnell.com` — should load normally
2. Check Cloudflare Analytics → see request breakdown, blocked threats, cached vs uncached
3. Monitor Firebase Analytics — active users should drop significantly

**Rollback:** If something breaks, change Squarespace nameservers back to the defaults. DNS will revert within minutes to hours.
