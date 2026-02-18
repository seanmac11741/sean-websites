# TODO

## Bugs
Fix the favicon to be something cool with my name: Sean McConnell

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
