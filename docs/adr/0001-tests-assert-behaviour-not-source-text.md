# 1. Tests assert behaviour, not source text

Date: 2026-08-14

## Status

Accepted

## Context

The test suite grew to 21 files and ~3,100 lines in which every assertion was
`readFileSync(...)` followed by `toContain(...)`. Tests read source files as strings and
checked that particular substrings were present — `expect(page).toContain('data-break-minutes="5"')`,
`expect(md).not.toMatch(/DNS pointing to Firebase/)`.

Nothing in the suite executed the code it described. A passing run proved only that certain
strings still appeared in certain files. Three consequences showed up in practice:

- **No interface was under test.** Logic lived inside `<script>` blocks in `.astro` pages,
  reachable only through a browser, so the tests circled it from the outside.
- **Refactors broke tests without breaking behaviour**, which pushes toward not refactoring.
- **Real defects went unnoticed.** Reading time was computed in three places with two different
  constants (`words / 250` in the API, `words / 200` in the post page and admin preview), so the
  same post advertised a different "min read" on its card than on its page. Every text assertion
  covering those files passed throughout.

An architecture review scored this as the deepest friction in the codebase: the test surface was
the source text rather than any module interface.

## Decision

Tests assert behaviour through a module interface. `readFileSync` remains legitimate only for
files whose content *is* the artifact — `firestore.rules`, `storage.rules`, `firebase.json`,
`vercel.json`, GitHub workflow files, `package.json`.

Concretely:

1. Logic moves out of `.astro` `<script>` blocks into modules under `src/lib/<domain>/`. Modules
   are pure — values in, values out — so they run under the default node environment. Renderers
   return HTML strings rather than touching `document`. No DOM test environment is added.
2. Fetching stays in a thin, deliberately untested adapter alongside the pure module.
3. Tests mirror the module (`tests/lib/blog.test.ts`), not the build phase.
4. When logic moves behind an interface, the text assertions it subsumes are **deleted**. Each page
   keeps one assertion that it imports and calls the module — the single thing a pure test cannot
   see.
5. Assertions over documentation prose (`README.md`, `AGENTS.md` wording) are deleted outright.
   They broke on honest edits and caught nothing.
6. Styling assertions survive only where they encode a decision — "repeat focus is the primary
   action, so it is `bg-accent` and break is not" — never for incidental classes like `px-6`.

This is reached by attrition, not by a dedicated project: each architectural extraction rewrites
the tests it touches, in the same change. The `phaseNN` test files shrink and are deleted as they
empty out.

**Invariant to reach:** `tests/` contains no `readFileSync` over `src/**` or `api/**` — only over
config.

## Consequences

- The first extraction (the Post module, `src/lib/blog/`) replaced ~10 text assertions with 24
  behaviour tests and fixed the reading-time defect as a side effect: one rule, `words / 200`,
  now serves the API, the listing, the post page and the admin preview.
- Adapter code in `.astro` files is not covered by tests. This is accepted: the adapters are thin
  by construction. If a defect ever lands in adapter code, that is the trigger to reconsider adding
  a DOM environment — not before.
- No CI guard enforces the invariant. With one committer and the rule recorded here and in
  `CLAUDE.md`, a lint rule would be machinery for a problem that does not exist yet.

## Notes

Do not re-add source-text assertions to cover extracted logic, and do not read the deleted
documentation assertions as lost coverage — they were never coverage.
