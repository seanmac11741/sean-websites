# Setting Up a Repo for Both Claude Code and Codex

## Instructions File

1. Create `AGENTS.md` in the repo root with your project rules and instructions.
2. Symlink `CLAUDE.md` to it:
   ```bash
   ln -s AGENTS.md CLAUDE.md
   ```
   - Claude Code reads `CLAUDE.md`, Codex reads `AGENTS.md` — the symlink means both see the same file.
   - Edit `AGENTS.md` only; the symlink keeps them in sync.

## Skills Directory

1. Create your skills in `.agents/skills/` (one subdirectory per skill, each containing a `SKILL.md`):
   ```
   .agents/skills/
     my-skill/
       SKILL.md
   ```
2. Create the `.claude/` directory and symlink its `skills/` to the canonical location:
   ```bash
   mkdir -p .claude
   ln -s ../.agents/skills .claude/skills
   ```

## Verification

After setup, your repo should look like this:
```
AGENTS.md              # canonical instructions file
CLAUDE.md -> AGENTS.md # symlink
.agents/skills/        # canonical skills directory
.claude/skills -> ../.agents/skills  # symlink
```

Verify with:
```bash
ls -la CLAUDE.md .claude/skills
```

Both should show as symlinks pointing to their `.agents` counterparts.
