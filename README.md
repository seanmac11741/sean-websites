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

### Helpful Claude commands
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
implement it all. When you're done with a task or phase, mark it as completed in the plan document. Do not stop until all tasks and phases are completed. Do not add unecessary comments or jsdocs, do not use any or unknown types. continuously run typecheck to make sure you're not introducing new issues
```
