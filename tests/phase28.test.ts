import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'fs';

// The PR-review GitHub workflow was removed; reviews are on-demand via the
// /pr_review skill, so only the skill file is still an artifact worth asserting.
describe('28 — PR review skill', () => {
  describe('skill file', () => {
    const skillPath = '.claude/skills/pr_review/SKILL.md';

    it('exists', () => {
      expect(existsSync(skillPath)).toBe(true);
    });

    const skill = readFileSync(skillPath, 'utf-8');

    it('has review structure template', () => {
      expect(skill).toContain('## Summary');
      expect(skill).toContain('## Bugs & Logic Errors');
      expect(skill).toContain('## Security');
      expect(skill).toContain('## Style & Conventions');
      expect(skill).toContain('## Suggestions');
      expect(skill).toContain('## What looks good');
    });

    it('has self-improvement section', () => {
      expect(skill).toContain('Self-improvement');
      expect(skill).toContain('Learned preferences');
    });

    it('has codebase context', () => {
      expect(skill).toContain('Astro 5');
      expect(skill).toContain('Tailwind CSS 4');
      expect(skill).toContain('Bun');
      expect(skill).toContain('Firebase');
    });

    it('tells Claude to post via gh pr comment', () => {
      expect(skill).toContain('gh pr comment');
    });
  });
});
