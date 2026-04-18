# sean-mcconnell.com

## Personal notes
* I used Claude code to make this site. I will try not to touch the actual code at all.
* This site is a live demo of my skills. Every feature is intentional — Firebase Hosting, Cloud Functions, Firestore, Firebase Auth, Firebase Storage, CI/CD with GitHub Actions, GSAP animations, Astro SSG. If I know how to use it, it's running on this site. 

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

### Deploying to Firebase


Prerequisites:
* `firebase-tools` installed globally (`bun install -g firebase-tools`)
* Logged in via `firebase login`
* Firebase project is `sean-mcconnell-site` (configured in `.firebaserc`)

The site is hosted on Firebase Hosting and serves the `dist/` directory. Domain: `sean-mcconnell.com`.

```bash
bun run build       # build the Astro site to dist/
firebase deploy     # deploy dist/ to Firebase Hosting
```

Or as a single command:
```bash
bun run build && firebase deploy
```

### Deploying a preview (without touching the live site)

First deploy functions + rules (these are project-wide, not channel-specific):
```bash
firebase deploy --only functions,firestore:rules,storage
```

Then deploy hosting to a preview channel:
```bash
bun run build
firebase hosting:channel:deploy blog-preview
```

This gives you a temporary URL like `sean-mcconnell-site--blog-preview-xxxxx.web.app` to test on. Preview channels auto-expire after 7 days.

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

### Helpful Claude commands
* Resume last conversation where I left off: 
```
claude --continue
```

* Planning phase
```
Create a plan for x in plan.md
```
* Todo list
```
Add a detailed todo list to the plan, with all the phases and individual tasks necessary to complete the plan - don't implement yet. 
```
* Implementation
```
Implement phase x in plan.md. Stop to ask me questions if you need to. Mark each task as complete in the @plan.md when you are done with the todo. Do not wait to update @plan.md until the end. do not add unecessary comments or jsdocs. Write tests as you go with vitest to verify that what you made so far is working. Assume new code does not work until it has been tested
```

```
implement it all. When you're done with a task or phase, mark it as completed in the plan document. Do not stop until all tasks and phases are completed. Do not add unecessary comments or jsdocs, do not use any or unknown types. continuously run typecheck to make sure you're not introducing new issues
```
