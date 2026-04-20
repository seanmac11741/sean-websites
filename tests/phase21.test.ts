import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';

describe('21 — Firebase Backend Setup (post Vercel migration)', () => {
  const firebaseJson = JSON.parse(readFileSync('firebase.json', 'utf-8'));

  describe('firebase.json', () => {
    // Hosting + functions blocks removed as part of Vercel migration (plan.md todos 45-46).
    // Vercel-specific config is asserted in tests/vercel-migration.test.ts.

    it('has firestore config referencing rules file', () => {
      expect(firebaseJson.firestore.rules).toBe('firestore.rules');
    });

    it('has storage config referencing rules file', () => {
      expect(firebaseJson.storage.rules).toBe('storage.rules');
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

  // Cloud Functions block removed — `functions/` source directory was deleted as part of
  // plan.md todo 45. Blog API now lives in `api/` at repo root and is covered by
  // tests/vercel-migration.test.ts (todos 9-13).
});
