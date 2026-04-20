import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'fs';

describe('Vercel Migration Cleanup — plan.md todos 45-49', () => {
  // === Todo 45: delete firebase.json hosting block + delete functions/ dir ===
  describe('Todo 45: remove Firebase Hosting + Cloud Functions source', () => {
    it('firebase.json has no "hosting" block', () => {
      const cfg = JSON.parse(readFileSync('firebase.json', 'utf-8'));
      expect(cfg.hosting).toBeUndefined();
    });

    it('functions/ source directory no longer exists', () => {
      expect(existsSync('functions')).toBe(false);
    });
  });

  // === Todo 46: firebase.json retains only firestore + storage ===
  describe('Todo 46: firebase.json is Firestore + Storage only', () => {
    it('firebase.json has no "functions" block', () => {
      const cfg = JSON.parse(readFileSync('firebase.json', 'utf-8'));
      expect(cfg.functions).toBeUndefined();
    });

    it('firebase.json retains "firestore" block', () => {
      const cfg = JSON.parse(readFileSync('firebase.json', 'utf-8'));
      expect(cfg.firestore).toBeDefined();
      expect(cfg.firestore.rules).toBe('firestore.rules');
    });

    it('firebase.json retains "storage" block', () => {
      const cfg = JSON.parse(readFileSync('firebase.json', 'utf-8'));
      expect(cfg.storage).toBeDefined();
      expect(cfg.storage.rules).toBe('storage.rules');
    });
  });

  // === Todo 47: CLAUDE.md / AGENTS.md reflect Vercel hosting ===
  describe('Todo 47: AGENTS.md (CLAUDE.md symlink) reflects Vercel migration', () => {
    const md = readFileSync('AGENTS.md', 'utf-8');

    it('lists Vercel as the host, not Firebase Hosting', () => {
      expect(md).toMatch(/Vercel/);
      expect(md).not.toMatch(/\*\*Hosting:\*\*\s*Firebase Hosting/);
      expect(md).not.toMatch(/hosted on Firebase Hosting/);
    });

    it('describes deploy.yml as tests-only (no Firebase deploy)', () => {
      expect(md).not.toContain('w9jds/firebase-action');
      // The old GitHub secret (FIREBASE_SERVICE_ACCOUNT) is gone — the new Vercel env var
      // FIREBASE_SERVICE_ACCOUNT_JSON may still be mentioned, so we check for the bare form only.
      expect(md).not.toMatch(/FIREBASE_SERVICE_ACCOUNT(?!_JSON)/);
      expect(md).not.toMatch(/firebase deploy\s*\(hosting/);
    });

    it('architecture documents api/ at repo root (not functions/src/index.ts)', () => {
      expect(md).toMatch(/^api\//m);
      expect(md).not.toMatch(/functions\/\n\s+src\/index\.ts/);
      expect(md).not.toMatch(/Cloud Function:\s*`api`/);
    });

    it('removes Firebase Cloud Functions from the Backend stack line', () => {
      expect(md).not.toMatch(/Firebase Cloud Functions/);
    });

    it('removes the stale "DNS pointing to Firebase" line', () => {
      expect(md).not.toMatch(/DNS pointing to Firebase/);
    });
  });

  // === Todo 48: README.md reflects Vercel hosting ===
  describe('Todo 48: README.md reflects Vercel migration', () => {
    const md = readFileSync('README.md', 'utf-8');

    it('mentions Vercel as the host', () => {
      expect(md).toMatch(/Vercel/);
    });

    it('removes the "Deploying to Firebase" section and firebase deploy instructions', () => {
      expect(md).not.toMatch(/### Deploying to Firebase/);
      expect(md).not.toMatch(/^firebase deploy$/m);
      expect(md).not.toMatch(/bun run build && firebase deploy/);
    });

    it('removes the hosting preview channel instructions', () => {
      expect(md).not.toMatch(/firebase hosting:channel:deploy/);
    });

    it('does not describe the site as hosted on Firebase Hosting', () => {
      expect(md).not.toMatch(/hosted on Firebase Hosting/);
      expect(md).not.toMatch(/Firebase Hosting and serves the `dist\/`/);
    });
  });

  // === Todo 49: Rules deploy note in AGENTS.md (CLAUDE.md) ===
  describe('Todo 49: Rules deploy note in AGENTS.md', () => {
    const md = readFileSync('AGENTS.md', 'utf-8');

    it('documents the manual firestore + storage rules deploy command', () => {
      expect(md).toMatch(/firebase deploy --only firestore:rules,storage/);
    });

    it('explains that rules deploys are now manual', () => {
      expect(md.toLowerCase()).toMatch(/rules/);
      expect(md.toLowerCase()).toMatch(/manual/);
    });
  });
});
