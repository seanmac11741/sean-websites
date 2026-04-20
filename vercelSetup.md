# Vercel Setup Follow-Up Plan

## Purpose

This file captures what is still incomplete or inconsistent after the Firebase Hosting to Vercel migration. The migration itself is done, but the operating model around Vercel, DNS, bot protection, analytics, and docs still has gaps.

This is intentionally a basic plan so it can be stress-tested later with the `planner` skill.

## Current State

- Static hosting is on Vercel.
- Blog API is on Vercel Serverless Functions in `api/`.
- Firestore, Firebase Auth, and Firebase Storage still remain on Firebase by design.
- Cloudflare is currently DNS-only, not proxied.
- The old Firebase Hosting / Cloud Functions surface has been removed.

## Main Findings

### 1. Bot protection assumptions changed after cutover

The original migration plan assumed Cloudflare would stay proxied in front of Vercel. That did not happen. Cloudflare is DNS-only now, so its WAF, Bot Fight Mode, and old ASN block rules are no longer protecting the site traffic path.

Impact:

- Vercel is now the real edge.
- The current setup needs Vercel-native bot controls.
- `/api/blog/*` is the main cost-sensitive surface.

### 2. Domain/canonical behavior needs to be unified

The site metadata still treats `https://sean-mcconnell.com` as canonical, but cutover notes say Vercel currently redirects apex to `www`.

Impact:

- Canonical tags, OG URLs, and actual serving behavior may not agree.
- SEO and link consistency should be cleaned up.

### 3. DNS / registrar consolidation is not complete

The site is hosted on Vercel, but the domain stack is still split:

- Registrar: Squarespace
- DNS: Cloudflare
- Hosting: Vercel

If the goal is to centralize everything on Vercel, this is still unfinished.

### 4. Analytics and monitoring are weaker than they should be

Post-cutover, Cloudflare analytics are much less useful because traffic is not proxied through it. Vercel-native analytics and usage alerting should be treated as part of the migration hardening, not optional polish.

### 5. Documentation is stale in a few important places

The README still contains Cloudflare/Firebase-era setup guidance that no longer matches the live architecture. That creates operational risk because future changes could be made from outdated instructions.

### 6. One workflow does not match the written plan exactly

`deploy.yml` still runs on pushes to `main` in addition to PRs, even though the migration plan said PRs only. This is small, but it is still a mismatch between docs and reality.

## Out of Scope Clarification

This was not a full Firebase exit.

Still on Firebase:

- Firestore
- Firebase Auth
- Firebase Storage

If the future goal is "everything off Firebase," that needs a separate migration plan.

## Remaining Steps

## Phase 1: Lock down cost and bot exposure

1. Set a hard Vercel spend cap with pause-on-exceed.
2. Enable Vercel BotID.
3. Recreate the old AWS ASN block as a Vercel Firewall rule for `AS16509`.
4. Add rate limiting for `/api/blog/*`.
5. Decide whether rate limiting should live in Vercel Firewall or in app code using KV/Upstash.
6. Define incident steps for attack periods, including when to turn on Vercel Attack Challenge Mode.

## Phase 2: Resolve domain truth

1. Decide whether the primary public domain is:
   - `https://sean-mcconnell.com`
   - `https://www.sean-mcconnell.com`
2. Update Vercel domain settings so redirect behavior matches that choice.
3. Update Astro `site` config to match the chosen canonical domain.
4. Update layout metadata and any hardcoded public URLs to match the chosen domain.
5. Re-test canonical tags, OG URLs, sitemap output, and redirects.

## Phase 3: Improve observability

1. Add `@vercel/analytics`.
2. Add Vercel Speed Insights if useful.
3. Configure Vercel usage alerts at a meaningful threshold.
4. Define a simple weekly review process for:
   - function invocations
   - bandwidth
   - firewall activity
   - bot traffic patterns

## Phase 4: Clean up documentation

1. Rewrite the README section that still describes Cloudflare proxying, Firebase Hosting IPs, and Firebase-era SSL guidance.
2. Update docs to clearly say Cloudflare is DNS-only today.
3. Document the real security model:
   - Vercel is the active edge
   - Vercel Firewall/BotID are the active controls
   - Cloudflare DNS alone does not provide request filtering
4. Update any runbooks or notes that still assume Cloudflare analytics are the main source of truth.
5. Decide whether `plan.md` should remain as historical record or be replaced by a new post-migration hardening plan.

## Phase 5: Align CI/CD with intent

1. Decide whether `deploy.yml` should:
   - stay as PR + push validation
   - or be changed to PR-only as originally planned
2. Update either the workflow or the documentation so they match each other.

## Phase 6: Decide on infrastructure consolidation

1. Decide whether to keep Cloudflare for DNS only or remove it.
2. If consolidation is still desired, plan the domain transfer from Squarespace to Vercel.
3. Decide whether DNS should remain in Cloudflare after transfer or also move fully to Vercel.
4. Document rollback steps before changing registrar or DNS ownership.

## Questions To Resolve Later With Planner Skill

1. Should bot protection rely mostly on Vercel Firewall, application-level rate limiting, or both?
2. Is `www` or apex the real long-term canonical domain?
3. Is Cloudflare still worth keeping for DNS-only, or is it just extra complexity now?
4. Do you want to keep Firebase Auth / Firestore / Storage long term, or is a second migration coming?
5. What monthly spend cap is acceptable before the site should hard-stop?
6. Do you want analytics only for ops, or also for public-facing "this site is a live demo" features?

## Suggested Execution Order

1. Phase 1: bot protection and spend cap
2. Phase 2: canonical domain cleanup
3. Phase 3: analytics and usage alerts
4. Phase 4: documentation cleanup
5. Phase 5: workflow alignment
6. Phase 6: registrar/DNS consolidation

## Success Criteria

- The site has a hard cost ceiling.
- Automated traffic is filtered at the Vercel edge.
- `/api/blog/*` cannot be spammed cheaply.
- Redirect behavior and canonical metadata agree on one public domain.
- Monitoring reflects the real traffic path.
- Docs describe the live setup accurately.
- Future infrastructure work has a clear next plan instead of hidden assumptions.
