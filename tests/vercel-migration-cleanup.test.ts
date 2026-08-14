import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'fs';

// Assertions over README.md / AGENTS.md prose were removed: they policed the wording
// of documentation, broke on any honest edit, and caught no defect. See
// docs/adr/0001-tests-assert-behaviour-not-source-text.md.
describe('Vercel Migration Cleanup — plan.md todos 45-46', () => {
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

});
