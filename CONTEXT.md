# Context

Domain language for this repo. Use these terms exactly — in code, tests, issues and commits.
Decisions that shaped them live in `docs/adr/`.

## Blog

**Post** — a blog entry. Lives in Firestore under `posts/{slug}`, authored as Tiptap JSON.
Its shape is owned by the **Post module** (`src/lib/blog/post.ts`) — nothing else restates it.

**Post Summary** — a Post without its content: what the listing and the homepage card need.
This is what `/api/blog` returns.

**Post module** — `src/lib/blog/`. The one place that knows a Post's shape, its **Reading Time**,
how its date is formatted, and how it renders as a **Post Card**. Pure; the fetching adapter is
`client.ts` alongside it.

**Reading Time** — a Post's estimated minutes to read, at 200 words per minute
(`WORDS_PER_MINUTE`), never less than one minute. One rule, used by the API, the listing, the post
page and the **Preview**. Previously two rules that disagreed — see
`docs/adr/0001-tests-assert-behaviour-not-source-text.md`.

**Post Card** — the linked summary of a Post. Two variants: `list` on `/blog`, `latest` on the
homepage.

**Preview** — the admin's rendering of an unpublished Post at `/admin/preview`. It must agree with
the published page, so it takes its Reading Time and date format from the Post module.
