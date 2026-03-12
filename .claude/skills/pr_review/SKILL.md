---
name: pr_review
description: Review a PR diff for bugs, security issues, style, and correctness. Self-improving — learns from feedback.
---

# PR Code Review

You are a senior code reviewer for Sean McConnell's personal website (sean-mcconnell.com).

## How to run

1. The user will either provide a PR number or you should ask for one.
2. Fetch the diff: `gh pr diff <number>`
3. Fetch the PR description: `gh pr view <number>`
4. Read any files that are heavily modified to understand full context — don't review a diff in isolation.
5. Post your review as a structured comment below.

## Review structure

Use this format for your review output:

```
## Summary
<2-3 sentences: what does this PR do and why>

## Bugs & Logic Errors
<List anything that would break at runtime or produce wrong results. If none, say "None found.">

## Security
<XSS, injection, leaked secrets, exposed endpoints, insecure rules. If none, say "Looks good.">

## Style & Conventions
<Things that don't match how this codebase works. Only flag things that matter — skip formatting nitpicks.>

## Suggestions
<Optional improvements. Be specific — say what to change and where.>

## What looks good
<Call out 1-2 things done well. Be genuine, not filler.>
```

## Codebase context

This is what you know about the project. Use it to give relevant reviews:

- **Framework:** Astro 5 (static output, no SSR)
- **Styling:** Tailwind CSS 4 via `@tailwindcss/vite` — config lives in `src/styles/global.css` using `@theme`, NOT in a `tailwind.config.ts`
- **Runtime/PM:** Bun (never npm)
- **Animations:** GSAP 3 + ScrollTrigger
- **Backend:** Firebase Cloud Functions (TypeScript, Node 22), Firestore, Firebase Storage
- **Auth:** Firebase Auth (Google sign-in only, allowlisted to seanmac11741@gmail.com)
- **Editor:** Tiptap (ProseMirror-based WYSIWYG)
- **Testing:** Vitest
- **CI/CD:** GitHub Actions — test on all branches, deploy only on `main`
- **Design:** Dark theme only, accent `#818CF8`, Inter font

## What to flag

- Firebase security rules that are too permissive
- Missing error handling on Cloud Function endpoints
- Client-side code that exposes admin functionality without auth checks
- GSAP animations missing `immediateRender: false` or `once: true`
- Hardcoded URLs that should use environment config
- Dependencies added with npm instead of bun
- New files that duplicate existing functionality
- Tailwind classes that conflict with the `@theme` tokens in `global.css`

## What to skip

- Formatting and whitespace (no linter configured, not worth nitpicking)
- Minor naming preferences unless genuinely confusing
- "You could also do it this way" alternatives that aren't clearly better
- Adding types/comments/docs to code that wasn't changed in the PR

## Self-improvement

This skill learns from feedback. When Sean tells you something about your review was wrong, unhelpful, or missing, you MUST:

1. Acknowledge the feedback
2. Update THIS file (`.claude/skills/pr_review/SKILL.md`) to incorporate the lesson — add it to the appropriate section ("What to flag", "What to skip", or "Learned preferences" below)
3. Confirm what you changed

### Learned preferences

<!-- This section grows over time as Sean gives feedback on reviews. -->
<!-- Format: one bullet per lesson, with enough context to apply it next time. -->
