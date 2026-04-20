import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'fs';

describe('Phase 33 — Image Optimization, Cache Headers & Analytics', () => {
  // === Todo 1: src/assets/images/ directory exists ===
  describe('Image assets directory', () => {
    it('src/assets/images/ directory exists', () => {
      expect(existsSync('src/assets/images')).toBe(true);
    });
  });

  // === Todo 3: About.astro uses Astro Image component ===
  describe('About.astro uses Astro Image component', () => {
    const about = readFileSync('src/components/About.astro', 'utf-8');

    it('imports Image from astro:assets', () => {
      expect(about).toContain("import { Image }");
      expect(about).toContain("astro:assets");
    });

    it('imports CasualMountainsSean.jpg from src/assets/images', () => {
      expect(about).toContain("assets/images/CasualMountainsSean");
    });

    it('uses <Image component instead of raw <img', () => {
      expect(about).toContain('<Image');
      // Should not have a raw <img for the mountains photo
      expect(about).not.toContain('src="/images/CasualMountainsSean');
    });

    it('sets width=576 and height=640 for 2x retina', () => {
      expect(about).toMatch(/width\s*[=:]\s*[{"]?576/);
      expect(about).toMatch(/height\s*[=:]\s*[{"]?640/);
    });
  });

  // === Todo 7 & 8: Firebase Analytics in firebase.ts with browser guard ===
  describe('Firebase Analytics initialization', () => {
    const firebaseTs = readFileSync('src/lib/firebase.ts', 'utf-8');

    it('imports getAnalytics from firebase/analytics', () => {
      expect(firebaseTs).toContain('getAnalytics');
      expect(firebaseTs).toContain('firebase/analytics');
    });

    it('calls getAnalytics', () => {
      expect(firebaseTs).toMatch(/getAnalytics\s*\(/);
    });

    it('guards analytics init with typeof window check', () => {
      expect(firebaseTs).toContain('typeof window');
    });

    it('getAnalytics call is inside the window guard block', () => {
      const windowIdx = firebaseTs.indexOf('typeof window');
      const analyticsCallIdx = firebaseTs.indexOf('getAnalytics(app)');
      expect(windowIdx).toBeLessThan(analyticsCallIdx);
    });
  });

  // === Todo 9: Build output has optimized images ===
  describe('Build output has optimized images', () => {

    it('dist/ does not contain the original 24MB CasualMountainsSean.jpg', () => {
      expect(existsSync('dist/images/CasualMountainsSean.jpg')).toBe(false);
    });

    it('dist/ does not contain the original ProfilePictureSeanWhiteSweater.png', () => {
      expect(existsSync('dist/images/ProfilePictureSeanWhiteSweater.png')).toBe(false);
    });
  });

  // Cache headers block removed — headers moved from `firebase.json` to `vercel.json`
  // as part of the Vercel migration (plan.md todo 45). Equivalent assertions for the
  // Vercel cache headers live in tests/vercel-migration.test.ts (todo 13).

  // === Todo 5: OG image optimized and Layout.astro updated ===
  describe('OG image optimization', () => {
    it('optimized OG image exists at public/images/og-profile.jpg', () => {
      expect(existsSync('public/images/og-profile.jpg')).toBe(true);
    });

    it('Layout.astro references og-profile.jpg instead of ProfilePictureSeanWhiteSweater.png', () => {
      const layout = readFileSync('src/layouts/Layout.astro', 'utf-8');
      expect(layout).toContain('og-profile.jpg');
      expect(layout).not.toContain('ProfilePictureSeanWhiteSweater.png');
    });
  });

  // === Todo 4: Hero.astro uses Astro Image component ===
  describe('Hero.astro uses Astro Image component', () => {
    const hero = readFileSync('src/components/Hero.astro', 'utf-8');

    it('imports Image from astro:assets', () => {
      expect(hero).toContain("import { Image }");
      expect(hero).toContain("astro:assets");
    });

    it('imports ProfilePictureSeanWhiteSweater.png from src/assets/images', () => {
      expect(hero).toContain("assets/images/ProfilePictureSeanWhiteSweater");
    });

    it('uses <Image component instead of raw <img', () => {
      expect(hero).toContain('<Image');
      expect(hero).not.toContain('src="/images/ProfilePictureSeanWhiteSweater');
    });

    it('sets width=640 and height=640 for 2x retina', () => {
      expect(hero).toMatch(/width\s*[=:]\s*[{"]?640/);
      expect(hero).toMatch(/height\s*[=:]\s*[{"]?640/);
    });
  });

  // === Todo 2: Images moved to src/assets/images/ ===
  describe('Images moved to src/assets/images/', () => {
    it('CasualMountainsSean.jpg exists in src/assets/images/', () => {
      expect(existsSync('src/assets/images/CasualMountainsSean.jpg')).toBe(true);
    });

    it('ProfilePictureSeanWhiteSweater.png exists in src/assets/images/', () => {
      expect(existsSync('src/assets/images/ProfilePictureSeanWhiteSweater.png')).toBe(true);
    });

    it('CasualMountainsSean.jpg no longer exists in public/images/', () => {
      expect(existsSync('public/images/CasualMountainsSean.jpg')).toBe(false);
    });

    it('ProfilePictureSeanWhiteSweater.png no longer exists in public/images/', () => {
      expect(existsSync('public/images/ProfilePictureSeanWhiteSweater.png')).toBe(false);
    });
  });
});
