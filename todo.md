# TODO

## Bugs
* ~~Fix the favicon to be something cool with my name: Sean McConnell~~ ✅ Phase 14a
* ~~Years of experience should auto update from the date: April 2015~~ ✅ Phase 14b
* ~~The "L" in mcconnell is getting cutoff in small screens~~ ✅ Phase 14c
* Skills section sucks. Just a bunch of weird icons with things on them... Should be closer to a cv, with examples of some cool projects. Rewrite entirely

## Other
* ~~Link my Strava account on socials~~ ✅ Phase 14d
* ~~"wow, beautiful website! can you make me one?" Yes, with a google form that people can fill out.~~ ✅ Phase 14e — [Google Form](https://forms.gle/fFCFyQH7dG6xXtkVA)
* ~~Years of experience - a reverse timer, with years, months, days, minutes, seconds since my start date as a developer in April 23rd, 2015. It should look awesome and professional, while showing off my technical skills~~ ✅ Phase 16 — Live experience timer (YRS/MO/DAYS/HRS/MIN/SEC)
* Highlight card hover interactions (match the experience timer pattern):
  * **"Based in Wisconsin"** — pick one:
    1. Show a mini weather widget (live temp + conditions via a free API like Open-Meteo for Madison, WI)
    2. Show "Madison, WI — America's Dairyland" with a fun Wisconsin fact that rotates on each hover
    3. Show coordinates "43.0731° N, 89.4012° W" with a subtle pin icon — clean & techy
  * **"AI & Cloud Specialty"** — pick one:
    1. Show a compact list of key certifications or tools: "AWS · GCP · LLMs · RAG · Agents"
    2. Show "Building with AI since 2023" with a one-liner about current focus area
    3. Show a mini tag cloud of specialties that subtly pulse in accent color
* Buy me a coffee
* Sean 2. An Ai bot that I train on all my blog posts that I write. It should be something like a RAG system, that has access to my writings and code and acts like me. It will be terrible at first, but should get better as I add more data to it. Just text at first of me writing, but later, it would be cool to add like a vlog-style video thing, where I can make a video of myself, and have the bot interview me to get more of an idea of my full personality so it can act more like me. Could have veo for video generation and audio generation of my voice as well. Backend cloud functions to train a model, and a front end chat interface, where anyone that comes to the site could do a one-shot interaction with me. Ask my bot anything and it will respond (once and only once) in my voice. Would be hard to make this so that I don't get 1 million requests, would have to limit per IP address or something.

## Blog ideas
* How I built this site with Claude
* How to use AI like a software engineerg

## CI/CD
~~add ci cd builds with github later~~ ✅ Phase 15 — GitHub Actions: test → build → deploy on push to `main`

## Presentations section
A section with descriptions and links to my various presentations I have recently done at conferences. This needs to be easily updatable

## Projects Section

Add a Projects showcase section between Skills and Contact:
- Cards with project name, brief description, tech tags, link to GitHub/GitLab
- GSAP scroll-triggered entrance (staggered card reveal)
- Data can live in a `src/data/projects.ts` array for easy editing

## Blog — /blog/[slug]

Build a blog at `sean-mcconnell.com/blog/` with individual posts at `/blog/good-title-of-the-article`.

**Plan when ready:**
- Use Astro's [Content Collections](https://docs.astro.build/en/guides/content-collections/) — write posts as Markdown/MDX files in `src/content/blog/`
- Add `src/pages/blog/index.astro` (list of posts) and `src/pages/blog/[slug].astro` (individual post template)
- Add "Blog" link to the nav
- Post frontmatter: `title`, `date`, `description`, `tags`, `draft`
- Deploy is the same `bun run build && firebase deploy` workflow — no extra infra needed

**Nice-to-haves:**
- Reading time estimate
- Syntax highlighting for code blocks (Astro ships Shiki by default)
- RSS feed (`@astrojs/rss`)
- Tag/category filtering on the index page
- OG image generation per post
