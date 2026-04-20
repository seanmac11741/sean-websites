# TODO

## Bot protection & cost caps (Vercel-native)

Context: the Firebase → Vercel migration (plan.md, now deleted) closed the `*.web.app` bypass that let bots hit the site directly and drive a 22x cost discrepancy. But at cutover the Cloudflare proxy was turned OFF (DNS-only, orange → grey cloud) because Vercel handles its own SSL/CDN. That means the old defenses — Cloudflare WAF, Bot Fight Mode, AS-16509 (AWS) block rule from `README.md` — are **no longer in the traffic path**. Right now the site has basically no bot protection except `robots.txt`, which attackers ignore.

Goal: rebuild the defense-in-depth stack using Vercel-native features so a bot surge can never drive hosting cost past a fixed cap.

### Must-haves (do these before the next bot wave)

1. **Set a hard spend cap in Vercel.** Dashboard → Billing → Spend Management → set monthly limit (e.g. $20) with pause-on-exceed. Without this, Hobby-tier overage either pauses the project (DoS) or, on Pro, charges uncapped. This is the backstop — every other control is defense-in-depth in front of it.
2. **Enable Vercel BotID.** Project → Security → BotID. Native bot detection (GA June 2025), equivalent to Cloudflare's Bot Fight Mode. Marks automated traffic and lets you block or challenge. Free.
3. **Port the Cloudflare AS-16509 (AWS) block rule to Vercel Firewall.** Project → Firewall → Custom Rules. Block by ASN = 16509 (Amazon), action = deny. This rule caught the original bot surge on Cloudflare; replicate it on Vercel.
4. **Rate-limit `/api/blog/*`.** These are the only paid invocations. Add a per-IP rate limit (e.g. 60 req/min) either as a Vercel Firewall rule or inline in `api/_lib/firebase.ts` using Vercel KV / Upstash. The static pages are cached by Vercel's edge and are effectively free — the functions are the cost vector.

### Nice-to-haves

5. **Vercel Attack Challenge Mode** — toggle under Project → Firewall when actively under attack. Forces JS challenge on every request, blocks headless bots. Off by default; flip during incidents.
6. **Country-based blocks.** If logs show traffic concentrated in specific countries with no legitimate users there, add firewall geo-block rules.
7. **Consolidate registrar + DNS onto Vercel** (see "Consolidate domain + DNS onto Vercel" below). Removes the Cloudflare split-brain so firewall rules, DNS, SSL, and hosting all live in one dashboard.
8. **Add `@vercel/analytics` + Speed Insights** to get first-party traffic numbers in the Vercel dashboard. Current visibility is limited post-Cloudflare-proxy-off; Vercel analytics show real invocation counts and can feed alerting.

### Monitoring

- Watch Vercel Dashboard → Usage weekly for anomalies (function invocations, bandwidth GB).
- Set a Vercel usage alert at ~50% of monthly cap so there's warning before the spend cap kicks in.

### Keep these current assumptions documented

- Cloudflare is **DNS-only** (grey cloud). WAF/Bot Fight Mode there does nothing. Either turn the proxy back on and run Cloudflare + Vercel in tandem, or (preferred) drop Cloudflare entirely once the registrar moves to Vercel.
- `functions/` is gone. Firestore/Storage rules still deploy via the manual `firebase deploy --only firestore:rules,storage` command noted in `CLAUDE.md`.

## Bugs 
* Blogs should have a footer like the main website with buy me a coffee and build me a website links. 

## Other
* Consolidate domain + DNS onto Vercel. Currently: domain registered at Squarespace, DNS at Cloudflare (proxy off, just CNAMEs to Vercel), hosting at Vercel. Goal: transfer the `sean-mcconnell.com` domain from Squarespace to Vercel so everything (registrar, DNS, hosting, SSL) lives in one dashboard. Steps: unlock domain in Squarespace → grab auth code → initiate transfer in Vercel → wait 5–7 days for ICANN transfer. Site stays up during transfer as long as DNS keeps pointing correctly. ~$15/yr renewal at Vercel.
* Sean 2. An Ai bot that I train on all my blog posts that I write. It should be something like a RAG system, that has access to my writings and code and acts like me. It will be terrible at first, but should get better as I add more data to it. Just text at first of me writing, but later, it would be cool to add like a vlog-style video thing, where I can make a video of myself, and have the bot interview me to get more of an idea of my full personality so it can act more like me. Could have veo for video generation and audio generation of my voice as well. Backend cloud functions to train a model, and a front end chat interface, where anyone that comes to the site could do a one-shot interaction with me. Ask my bot anything and it will respond (once and only once) in my voice. Would be hard to make this so that I don't get 1 million requests, would have to limit per IP address or something.
Clone my own voice like this: https://github.com/QwenLM/Qwen3-TTS
* My most recent run from strava api? not sure if possible without strava login. Maybe use Garmin?
* Accept payments on my website. Have somewhere I can place an invoice for a customer and they get a link to my website at sean-mcconnell.com/invoice123. I think it needs to be behind auth based on email address of my client? Otherwise anyone could access the invoice. 
* Need to run ads in case this goes viral so I don't have to pay a bunch. Probably just on blog posts?
* Portable AI harness — make my Claude Code setup (plugins, skills, settings, memory) propagate across every machine I work on. Probably a dedicated git repo (e.g. `~/.claude` or a dotfiles repo) that version-controls `settings.json`, `enabledPlugins`, skills, keybindings, and marketplace configs, so cloning on a new machine gets me a working Claude Code environment with no manual reinstall. Investigate what can/can't be synced (plugin cache at `~/.claude/plugins` is machine-local; `CLAUDE_CODE_PLUGIN_CACHE_DIR` env var can redirect it to a synced dir). Deferred — revisit when not mid-migration.

## Blog ideas
* How I built this site with Claude
* How to use AI like a software engineer
* How to use gemini cli with obsidian

## CI/CD
* Figure out how to add the build passed icons that are on github to my webpage and the github readme?

## Tools page
A separate page at sean-mcconnell.com/tools

* CV resume builder. Just a thing you can enter a bunch of info into and it builds out a one page resume. Should all be done client side with javascript, no file saving on a database or anything. Should be a download button though, if I can just stream the file out like that? Might have to write it to local storage or something.
* WYSIWG editor from my admin page available at /tools/fileWriter. It should not save anything to my cloud, just do it all in the browser and localstorage. Probably need a blurb at the bottom explaining that with links to source code on Github
* AI Skill.md files displayed that I use in this repo. They should be on the website and easily copy/pastable with an index page with an explanation of what Skills are and how to use/install them with agentic coding. Need to be able to share these easliy with other devs. A simple install or copy/paste section is needed. 


## Projects Section
Replace "Skills" section with projects section
Add a Projects showcase section between Skills and Contact:
- Cards with project name, brief description, tech tags, link to GitHub/GitLab
- GSAP scroll-triggered entrance (staggered card reveal)
- Data can live in a `src/data/projects.ts` array for easy editing
- Showcase of what this website does and how it does it. This project section should be fairly meta, showing latest ci/cd build status, how I'm using GCP and firebase to secure it, how I'm using AI to build features, and generally show off all the cool things I'm doing on this site as a project to show off my tech skills
- The skills section should all be clickable and tell a story. So if a user clicks on ci/cd, it goes to a thing that shows how I did CI/CD on this website. It should be interactive and look fancy with cool animations and stuff

## Fun and silly things
* light mode flashbang. Easter egg, something like, "Do you hate dark mode? Click here for light mode" and flash the brightest thing possible for like 1 second and then revert to dark mode
