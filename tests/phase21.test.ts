import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'fs';

describe('21 — Firebase Backend Setup', () => {
  const firebaseJson = JSON.parse(readFileSync('firebase.json', 'utf-8'));

  describe('firebase.json', () => {
    it('has hosting config with dist public dir', () => {
      expect(firebaseJson.hosting.public).toBe('dist');
    });

    it('has functions config pointing to functions/ source', () => {
      expect(firebaseJson.functions.source).toBe('functions');
    });

    it('has firestore config referencing rules file', () => {
      expect(firebaseJson.firestore.rules).toBe('firestore.rules');
    });

    it('has storage config referencing rules file', () => {
      expect(firebaseJson.storage.rules).toBe('storage.rules');
    });

    it('has hosting rewrite for /api/** to cloud function', () => {
      const rewrite = firebaseJson.hosting.rewrites.find(
        (r: { source: string }) => r.source === '/api/**'
      );
      expect(rewrite).toBeDefined();
      expect(rewrite.function).toBe('api');
    });
  });

  describe('firestore.rules', () => {
    const rules = readFileSync('firestore.rules', 'utf-8');

    it('exists and is valid rules file', () => {
      expect(rules).toContain("rules_version = '2'");
      expect(rules).toContain('service cloud.firestore');
    });

    it('has posts collection rules', () => {
      expect(rules).toContain('match /posts/{postId}');
    });

    it('allows public read for published posts', () => {
      expect(rules).toContain("resource.data.status == 'published'");
    });

    it('restricts write to admin email', () => {
      expect(rules).toContain('seanmac11741@gmail.com');
    });
  });

  describe('storage.rules', () => {
    const rules = readFileSync('storage.rules', 'utf-8');

    it('exists and is valid rules file', () => {
      expect(rules).toContain("rules_version = '2'");
      expect(rules).toContain('service firebase.storage');
    });

    it('has blog path rules', () => {
      expect(rules).toContain('match /blog/{allPaths=**}');
    });

    it('allows public read for blog images', () => {
      expect(rules).toContain('allow read: if true');
    });

    it('restricts write to admin email', () => {
      expect(rules).toContain('seanmac11741@gmail.com');
    });
  });

  describe('Cloud Functions', () => {
    it('has functions/src/index.ts entry point', () => {
      expect(existsSync('functions/src/index.ts')).toBe(true);
    });

    it('has functions/tsconfig.json', () => {
      expect(existsSync('functions/tsconfig.json')).toBe(true);
    });

    it('has functions/package.json with correct main', () => {
      const pkg = JSON.parse(readFileSync('functions/package.json', 'utf-8'));
      expect(pkg.main).toBe('lib/index.js');
    });

    it('exports an api function', () => {
      const src = readFileSync('functions/src/index.ts', 'utf-8');
      expect(src).toContain('export const api');
    });
  });

  describe('CI/CD workflow', () => {
    const workflow = readFileSync('.github/workflows/deploy.yml', 'utf-8');

    it('triggers on issue/blogcreation branch', () => {
      expect(workflow).toContain('issue/blogcreation');
    });

    it('installs functions dependencies', () => {
      expect(workflow).toContain('cd functions && bun install');
    });

    it('builds functions TypeScript', () => {
      expect(workflow).toContain('cd functions && npx tsc');
    });

    it('only deploys on main branch', () => {
      expect(workflow).toContain("github.ref == 'refs/heads/main'");
    });
  });
});
