# sean-mcconnell.com

## Personal notes
* I used Claude code to make this site. I will try not to touch the actual code at all. 

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

The site is hosted on Firebase Hosting and serves the `dist/` directory. Domain: `sean-mcconnell.com`.

```bash
bun run build       # build the Astro site to dist/
firebase deploy     # deploy dist/ to Firebase Hosting
```

Or as a single command:
```bash
bun run build && firebase deploy
```

Prerequisites:
* `firebase-tools` installed globally (`npm install -g firebase-tools`)
* Logged in via `firebase login`
* Firebase project is `sean-mcconnell-site` (configured in `.firebaserc`)

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
Implement the next phase in plan.md. Stop to ask me questions if you need to. Mark each task as complete when you are done. do not add unecessary comments or jsdocs. Write tests as you go to verify that what you made so far is working. 
```

```
implement it all. When you're done with a task or phase, mark it as completed in the plan document. Do not stop until all tasks and phases are completed. Do not add unecessary comments or jsdocs, do not use any or unknown types. continuously run typecheck to make sure you're not introducing new issues
```
