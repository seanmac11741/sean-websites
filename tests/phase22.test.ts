import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'fs';

describe('22 — Auth & Admin Page Shell', () => {
  describe('firebase.ts client library', () => {
    const firebaseTs = readFileSync('src/lib/firebase.ts', 'utf-8');

    it('exists at src/lib/firebase.ts', () => {
      expect(existsSync('src/lib/firebase.ts')).toBe(true);
    });

    it('exports app', () => {
      expect(firebaseTs).toContain('export const app');
    });

    it('exports auth', () => {
      expect(firebaseTs).toContain('export const auth');
    });

    it('exports db (Firestore)', () => {
      expect(firebaseTs).toContain('export const db');
    });

    it('exports storage', () => {
      expect(firebaseTs).toContain('export const storage');
    });

    it('exports googleProvider', () => {
      expect(firebaseTs).toContain('export const googleProvider');
    });

    it('exports ADMIN_EMAIL constant', () => {
      expect(firebaseTs).toContain('export const ADMIN_EMAIL');
      expect(firebaseTs).toContain('seanmac11741@gmail.com');
    });

    it('uses correct project ID', () => {
      expect(firebaseTs).toContain('sean-mcconnell-site');
    });
  });

  describe('admin page', () => {
    const adminPage = readFileSync('src/pages/admin/index.astro', 'utf-8');

    it('exists at src/pages/admin/index.astro', () => {
      expect(existsSync('src/pages/admin/index.astro')).toBe(true);
    });

    it('imports firebase auth modules', () => {
      expect(adminPage).toContain("from '../../lib/firebase'");
      expect(adminPage).toContain('signInWithPopup');
      expect(adminPage).toContain('onAuthStateChanged');
    });

    it('has a loading screen', () => {
      expect(adminPage).toContain('id="loading-screen"');
    });

    it('has a login screen with Google sign-in button', () => {
      expect(adminPage).toContain('id="login-screen"');
      expect(adminPage).toContain('id="google-signin-btn"');
      expect(adminPage).toContain('Sign in with Google');
    });

    it('has an unauthorized screen', () => {
      expect(adminPage).toContain('id="unauthorized-screen"');
      expect(adminPage).toContain('Access Denied');
    });

    it('has a dashboard screen', () => {
      expect(adminPage).toContain('id="dashboard-screen"');
    });

    it('has sign-out buttons', () => {
      expect(adminPage).toContain('id="signout-btn"');
      expect(adminPage).toContain('id="signout-unauth-btn"');
    });

    it('has a New Post button', () => {
      expect(adminPage).toContain('id="new-post-btn"');
      expect(adminPage).toContain('New Post');
    });

    it('has a posts list container', () => {
      expect(adminPage).toContain('id="posts-list"');
    });

    it('checks admin email in auth state listener', () => {
      expect(adminPage).toContain('ADMIN_EMAIL');
    });

    it('displays user email in dashboard', () => {
      expect(adminPage).toContain('id="user-email"');
    });
  });

  describe('Nav admin link', () => {
    const nav = readFileSync('src/components/Nav.astro', 'utf-8');

    it('has admin nav link (desktop)', () => {
      expect(nav).toContain('id="admin-nav-link"');
      expect(nav).toContain('href="/admin"');
    });

    it('has admin nav link (mobile)', () => {
      expect(nav).toContain('id="admin-nav-link-mobile"');
    });

    it('admin links are hidden by default', () => {
      const desktopMatch = nav.match(/id="admin-nav-link"[^>]*/);
      expect(desktopMatch?.[0]).toContain('hidden');
      const mobileMatch = nav.match(/id="admin-nav-link-mobile"[^>]*/);
      expect(mobileMatch?.[0]).toContain('hidden');
    });

    it('imports firebase auth to toggle admin link visibility', () => {
      expect(nav).toContain("from '../lib/firebase'");
      expect(nav).toContain('onAuthStateChanged');
    });
  });
});
