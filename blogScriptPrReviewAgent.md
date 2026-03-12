# How I Built a Self-Improving AI Code Reviewer for My GitHub Repo

I wanted an AI agent that would automatically review every pull request I open on my personal website. Not a linter. Not a static analysis tool. An actual code reviewer that understands my stack, reads the diff, explores the codebase for context, and posts a structured review comment on the PR — all without me lifting a finger.

Here's how I built it with Claude Code, GitHub Actions, and about 70 lines of YAML.

## The Problem

I'm a solo developer on this project. That means every line of code I write gets zero review before it hits production. I've caught myself merging Firebase security rules that were too permissive, forgetting error handling on Cloud Function endpoints, and shipping GSAP animations with missing config flags that caused visual bugs on page load.

Code review catches these things. But when you're a team of one, you don't have anyone to review your PRs.

## The Idea

Claude Code has a CLI that can run in non-interactive mode. GitHub Actions can trigger on pull request events. What if I wired them together?

The setup:
1. I open a PR against `main`
2. GitHub Actions triggers a workflow
3. The workflow installs Claude Code, feeds it my PR diff and a review prompt
4. Claude reads the diff, explores relevant files, and posts a review comment on the PR

No server. No webhook infrastructure. No API gateway. Just a GitHub Actions workflow and an Anthropic API key.

## The Skill File

The core of this is a "skill file" — a markdown file that tells Claude how to behave when reviewing code. It lives at `.claude/skills/pr_review/SKILL.md` in my repo.

The skill file has a few sections:

**Review structure** — a template for the review output. Every review follows the same format: Summary, Bugs & Logic Errors, Security, Style & Conventions, Suggestions, What Looks Good. Consistency matters. I don't want to read a different format every time.

**Codebase context** — I told Claude what my stack is. Astro 5, Tailwind CSS 4 (with `@theme` in `global.css`, not a config file), Bun (never npm), Firebase Cloud Functions, Vitest. This context makes the reviews actually useful. Without it, Claude would give generic advice. With it, Claude flags things like "you added a dependency with npm instead of bun" or "this Tailwind class conflicts with your `@theme` tokens."

**What to flag** — specific things I care about. Firebase rules that are too permissive. Missing error handling on Cloud Function endpoints. Client-side code that exposes admin functionality without auth checks.

**What to skip** — things I don't want to hear about. Formatting nitpicks (I don't have a linter). Minor naming preferences. "You could also do it this way" suggestions that aren't clearly better.

Here's the part I'm most excited about:

**Self-improvement** — the skill file has a "Learned preferences" section at the bottom. When I run the skill locally and tell Claude "that feedback was wrong" or "you missed something important," Claude updates the skill file itself. It adds a bullet point to the learned preferences section explaining what it got wrong and what to do differently next time. Those changes get committed and pushed, so the next CI run picks them up automatically.

The reviewer gets better every time I correct it.

## The Workflow

The GitHub Actions workflow is straightforward:

```yaml
on:
  pull_request:
    types: [opened, synchronize]
    branches: [main]
```

It triggers when a PR is opened or updated against `main`. There's also a `workflow_dispatch` trigger so I can manually re-run it from the Actions tab.

The key step installs Claude Code and runs it:

```yaml
- name: Install Claude Code
  run: curl -fsSL https://code.claude.com/install.sh | sh

- name: Review PR with Claude
  env:
    ANTHROPIC_API_KEY: ${{ secrets.ANTHROPIC_API_KEY }}
    GH_TOKEN: ${{ secrets.GITHUB_TOKEN }}
    PR_NUMBER: ${{ steps.pr.outputs.number }}
  run: |
    REVIEW_PROMPT=$(cat .claude/skills/pr_review/SKILL.md)
    claude -p \
      --max-turns 10 \
      --allowedTools "Bash(gh pr diff *)" "Bash(gh pr view *)" \
        "Bash(gh pr comment *)" "Read" "Grep" "Glob" \
      "You are reviewing PR #${PR_NUMBER}..."
```

A few things worth calling out:

**`--allowedTools`** restricts what Claude can do. It can read files, search code, fetch the PR diff, and post a comment. It cannot push code, merge the PR, or modify files. This is important — you don't want your code reviewer accidentally becoming a code committer.

**`--max-turns 10`** caps the number of agent iterations. This prevents runaway API costs if Claude gets stuck in a loop.

**`timeout-minutes: 10`** on the job itself is a hard ceiling. If something goes wrong, it doesn't burn tokens for an hour.

**`cat .claude/skills/pr_review/SKILL.md`** reads the skill file content and injects it into the prompt. This means the prompt always uses the latest version of the skill file, including any learned preferences from previous feedback.

## Guard Rails

I spent some time thinking about what could go wrong:

- **Claude tries to fix the code itself.** The `--allowedTools` flag prevents this. Claude can only read files and post comments. No `Edit`, no `Write`, no `Bash(git *)`.
- **Empty diff.** The prompt tells Claude to post a comment saying the diff is empty and stop.
- **Massive diff.** The prompt tells Claude to focus on the most important files and note that it skimmed the rest. No point burning tokens reading 3000 lines of generated CSS.
- **Runaway costs.** The 10-minute timeout and `--max-turns 10` together cap the worst case. A typical review uses ~5K-20K input tokens and ~1K-3K output tokens — pennies.

## What It Cost

Two secrets:
- `ANTHROPIC_API_KEY` — my Anthropic API key, stored in GitHub repo secrets
- `GITHUB_TOKEN` — built-in to GitHub Actions, already has PR write access

No new infrastructure. No monthly bill. Just pay-per-token API usage, which for a personal repo with a handful of PRs per week is essentially free.

## What I'd Do Differently

If I were building this for a team:

- **Add inline comments.** Right now it posts a single PR comment. For larger teams, you'd want inline comments on specific lines using `gh pr review` with line-level feedback.
- **Rate limit per PR.** On a busy repo, you might not want the review to re-run on every single push. A label-based trigger ("review please") might be better.
- **Multiple skill files.** Different reviewers for different parts of the codebase. A security-focused reviewer for auth changes, a performance reviewer for animation code, a general reviewer for everything else.

## The Takeaway

The whole thing is about 70 lines of YAML and 90 lines of markdown. No custom code. No framework. No deployment pipeline beyond what I already had.

The best part is the self-improving loop. Every time I tell Claude "that feedback was wrong," the skill file updates itself. The next PR review is slightly better. Over time, this thing learns exactly what I care about and what I don't.

It's like pair programming with a junior developer who actually remembers every piece of feedback you've ever given them.
