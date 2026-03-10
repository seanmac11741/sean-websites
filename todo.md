# TODO

## Bugs 

## Other
* Sean 2. An Ai bot that I train on all my blog posts that I write. It should be something like a RAG system, that has access to my writings and code and acts like me. It will be terrible at first, but should get better as I add more data to it. Just text at first of me writing, but later, it would be cool to add like a vlog-style video thing, where I can make a video of myself, and have the bot interview me to get more of an idea of my full personality so it can act more like me. Could have veo for video generation and audio generation of my voice as well. Backend cloud functions to train a model, and a front end chat interface, where anyone that comes to the site could do a one-shot interaction with me. Ask my bot anything and it will respond (once and only once) in my voice. Would be hard to make this so that I don't get 1 million requests, would have to limit per IP address or something.
Clone my own voice like this: https://github.com/QwenLM/Qwen3-TTS
* My most recent run from strava api? not sure if possible without strava login. Maybe use Garmin?
* Accept payments on my website. Have somewhere I can place an invoice for a customer and they get a link to my website at sean-mcconnell.com/invoice123. I think it needs to be behind auth based on email address of my client? Otherwise anyone could access the invoice. 


## Blog ideas
* How I built this site with Claude
* How to use AI like a software engineer
* How to use gemini cli with obsidian

## CI/CD
* Figure out how to add the build passed icons that are on github to my webpage and the github readme?
* AI Agents with Claude triggered in github actions. One for code review and qa first. It should just review a PR when I want to merge in a new request. 

## Tools page
A separate page at sean-mcconnell.com/tools
* Flow state room. A timer that counts down from 90 minutes with cool animations and a big button you can push to start it. it should also embed any number of youtube videos that are "concentration/flow state music" and play it for you. When the timer gets to zero, it should beep super loud and tell the user to take a break.
* CV resume builder. Just a thing you can enter a bunch of info into and it builds out a one page resume. Should all be done client side with javascript, no file saving on a database or anything. Should be a download button though, if I can just stream the file out like that? Might have to write it to local storage or something.

## Projects Section

Add a Projects showcase section between Skills and Contact:
- Cards with project name, brief description, tech tags, link to GitHub/GitLab
- GSAP scroll-triggered entrance (staggered card reveal)
- Data can live in a `src/data/projects.ts` array for easy editing
- Showcase of what this website does and how it does it. This project section should be fairly meta, showing latest ci/cd build status, how I'm using GCP and firebase to secure it, how I'm using AI to build features, and generally show off all the cool things I'm doing on this site as a project to show off my tech skills
- The skills section should all be clickable and tell a story. So if a user clicks on ci/cd, it goes to a thing that shows how I did CI/CD on this website. It should be interactive and look fancy with cool animations and stuff

## Blog — /blog/[slug]

Build a blog at `sean-mcconnell.com/blog/` with individual posts at `/blog/good-title-of-the-article`.

**Authoring workflow (brainstormed, not finalized):**
- Write blog posts in Google Docs (rich text, screenshots, etc.)
- Download as `.md` — Google Docs exports images as inline base64 data URIs at the bottom of the file (e.g. `[imageN]: <data:image/png;base64,...>`)
- Upload the `.md` to a password-protected admin page on the site
- Admin page processing:
  1. Parse out base64 `[imageN]` blocks from the markdown
  2. Upload each image to Firebase Storage (e.g. `blog/post-slug/image1.png`)
  3. Rewrite markdown image refs to point to Firebase Storage URLs
  4. Save the clean text-only markdown to Firestore (or commit to repo via GitHub API)
- Blog pages fetch posts from Firestore (dynamic) or Astro Content Collections (static, requires rebuild)
- **Key decision still open:** Firestore (fully dynamic, no rebuild) vs Git repo (static, keeps Astro Content Collections, requires CI/CD rebuild on new post)
- **Design goal:** Customer-friendly — no Git, no CLI, just Google Docs + upload page. This workflow should be reusable for customer blog sites too.
- Tested Google Docs `.md` export with `Alliance 2026 travel plans.md` — images are self-contained base64, extraction is straightforward

**Infrastructure:**
- Use Astro's [Content Collections](https://docs.astro.build/en/guides/content-collections/) — write posts as Markdown/MDX files in `src/content/blog/`
- Add `src/pages/blog/index.astro` (list of posts) and `src/pages/blog/[slug].astro` (individual post template)
- Add "Blog" link to the nav
- Post frontmatter: `title`, `date`, `description`, `tags`, `draft`
- Images stored in Firebase Storage (not in Git — keeps repo lean)
- Deploy is the same `bun run build && firebase deploy` workflow — no extra infra needed

**Nice-to-haves:**
- Reading time estimate
- Syntax highlighting for code blocks (Astro ships Shiki by default)
- RSS feed (`@astrojs/rss`)
- Tag/category filtering on the index page
- OG image generation per post

## Fun and silly things
* light mode flashbang. Easter egg, something like, "Do you hate dark mode? Click here for light mode" and flash the brightest thing possible for like 1 second and then revert to dark mode
