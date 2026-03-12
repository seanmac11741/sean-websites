import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'fs';
import { parse } from 'yaml';

describe('28 — PR Code Review Agent', () => {
  const workflowPath = '.github/workflows/code-review.yml';

  it('workflow file exists', () => {
    expect(existsSync(workflowPath)).toBe(true);
  });

  describe('workflow config', () => {
    const raw = readFileSync(workflowPath, 'utf-8');
    const wf = parse(raw);

    it('triggers on pull_request opened and synchronize', () => {
      const pr = wf.on.pull_request;
      expect(pr.types).toContain('opened');
      expect(pr.types).toContain('synchronize');
    });

    it('targets main branch', () => {
      expect(wf.on.pull_request.branches).toContain('main');
    });

    it('has workflow_dispatch trigger for manual runs', () => {
      expect(wf.on.workflow_dispatch).toBeDefined();
      expect(wf.on.workflow_dispatch.inputs.pr_number).toBeDefined();
    });

    it('has pull-requests write permission', () => {
      expect(wf.permissions['pull-requests']).toBe('write');
    });

    it('has contents read permission', () => {
      expect(wf.permissions.contents).toBe('read');
    });

    it('has a timeout to cap costs', () => {
      const job = wf.jobs.review;
      expect(job['timeout-minutes']).toBeDefined();
      expect(job['timeout-minutes']).toBeLessThanOrEqual(15);
    });

    it('checks out with full history', () => {
      const checkoutStep = wf.jobs.review.steps.find(
        (s: any) => s.uses && s.uses.includes('actions/checkout')
      );
      expect(checkoutStep).toBeDefined();
      expect(checkoutStep.with['fetch-depth']).toBe(0);
    });

    it('installs Claude Code CLI', () => {
      const installStep = wf.jobs.review.steps.find(
        (s: any) => s.run && s.run.includes('claude.com/install')
      );
      expect(installStep).toBeDefined();
    });

    it('runs claude -p with the review prompt', () => {
      const reviewStep = wf.jobs.review.steps.find(
        (s: any) => s.run && s.run.includes('claude -p')
      );
      expect(reviewStep).toBeDefined();
    });

    it('passes ANTHROPIC_API_KEY from secrets', () => {
      const reviewStep = wf.jobs.review.steps.find(
        (s: any) => s.env && s.env.ANTHROPIC_API_KEY
      );
      expect(reviewStep).toBeDefined();
      expect(reviewStep.env.ANTHROPIC_API_KEY).toContain('secrets.ANTHROPIC_API_KEY');
    });

    it('passes GITHUB_TOKEN for gh CLI', () => {
      const reviewStep = wf.jobs.review.steps.find(
        (s: any) => s.env && s.env.GH_TOKEN
      );
      expect(reviewStep).toBeDefined();
    });

    it('uses --max-turns to limit agent iterations', () => {
      const reviewStep = wf.jobs.review.steps.find(
        (s: any) => s.run && s.run.includes('--max-turns')
      );
      expect(reviewStep).toBeDefined();
    });

    it('restricts tools with --allowedTools', () => {
      const reviewStep = wf.jobs.review.steps.find(
        (s: any) => s.run && s.run.includes('--allowedTools')
      );
      expect(reviewStep).toBeDefined();
    });
  });

  describe('review prompt', () => {
    const raw = readFileSync(workflowPath, 'utf-8');

    it('instructs Claude to fetch the PR diff', () => {
      expect(raw).toContain('gh pr diff');
    });

    it('instructs Claude to view the PR', () => {
      expect(raw).toContain('gh pr view');
    });

    it('instructs Claude to post a comment', () => {
      expect(raw).toContain('gh pr comment');
    });

    it('includes read-only guard rail', () => {
      expect(raw).toMatch(/do not.*push|read.only/i);
    });

    it('handles empty diffs', () => {
      expect(raw).toMatch(/empty/i);
    });

    it('handles large diffs', () => {
      expect(raw).toMatch(/large/i);
    });

    it('references the SKILL.md file', () => {
      expect(raw).toContain('.claude/skills/pr_review/SKILL.md');
    });
  });

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
  });
});
