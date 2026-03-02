import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'fs';
import { parse } from 'yaml';

const workflowPath = '.github/workflows/deploy.yml';

describe('15a — GitHub Actions workflow file', () => {
  it('deploy.yml exists', () => {
    expect(existsSync(workflowPath)).toBe(true);
  });

  const raw = readFileSync(workflowPath, 'utf-8');
  const workflow = parse(raw);

  it('triggers on push to main only', () => {
    expect(workflow.on.push.branches).toContain('main');
  });

  it('runs on ubuntu-latest', () => {
    expect(workflow.jobs.deploy['runs-on']).toBe('ubuntu-latest');
  });

  it('checks out code with actions/checkout@v4', () => {
    const steps = workflow.jobs.deploy.steps;
    const checkout = steps.find((s: any) => s.uses?.startsWith('actions/checkout'));
    expect(checkout).toBeDefined();
    expect(checkout.uses).toBe('actions/checkout@v4');
  });

  it('installs Bun with oven-sh/setup-bun@v2', () => {
    const steps = workflow.jobs.deploy.steps;
    const setupBun = steps.find((s: any) => s.uses?.startsWith('oven-sh/setup-bun'));
    expect(setupBun).toBeDefined();
    expect(setupBun.uses).toBe('oven-sh/setup-bun@v2');
  });

  it('runs bun install', () => {
    const steps = workflow.jobs.deploy.steps;
    const install = steps.find((s: any) => s.run === 'bun install');
    expect(install).toBeDefined();
  });

  it('runs tests before build', () => {
    const steps = workflow.jobs.deploy.steps;
    const testIdx = steps.findIndex((s: any) => s.run === 'bun run test');
    const buildIdx = steps.findIndex((s: any) => s.run === 'bun run build');
    expect(testIdx).toBeGreaterThan(-1);
    expect(buildIdx).toBeGreaterThan(testIdx);
  });

  it('runs build before deploy', () => {
    const steps = workflow.jobs.deploy.steps;
    const buildIdx = steps.findIndex((s: any) => s.run === 'bun run build');
    const deployIdx = steps.findIndex((s: any) =>
      s.uses?.startsWith('FirebaseExtended/action-hosting-deploy')
    );
    expect(buildIdx).toBeGreaterThan(-1);
    expect(deployIdx).toBeGreaterThan(buildIdx);
  });

  it('deploys to Firebase using service account secret', () => {
    const steps = workflow.jobs.deploy.steps;
    const deploy = steps.find((s: any) =>
      s.uses?.startsWith('FirebaseExtended/action-hosting-deploy')
    );
    expect(deploy).toBeDefined();
    expect(deploy.with.firebaseServiceAccount).toBe('${{ secrets.FIREBASE_SERVICE_ACCOUNT }}');
    expect(deploy.with.channelId).toBe('live');
    expect(deploy.with.projectId).toBe('sean-mcconnell-site');
  });
});
