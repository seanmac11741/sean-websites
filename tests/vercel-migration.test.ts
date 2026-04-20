import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'fs';

describe('Vercel Migration — plan.md todos 9-13', () => {
  // === Todo 9: firebase-admin dev dependency ===
  describe('Todo 9: firebase-admin dev dependency', () => {
    it('firebase-admin is listed in devDependencies at repo root', () => {
      const pkg = JSON.parse(readFileSync('package.json', 'utf-8'));
      expect(pkg.devDependencies).toBeDefined();
      expect(pkg.devDependencies['firebase-admin']).toBeDefined();
    });
  });

  // === Todo 10: api/blog/index.ts list route ===
  describe('Todo 10: api/blog/index.ts (list published posts)', () => {
    it('exists at api/blog/index.ts', () => {
      expect(existsSync('api/blog/index.ts')).toBe(true);
    });

    it('exports a default handler function', () => {
      const src = readFileSync('api/blog/index.ts', 'utf-8');
      expect(src).toMatch(/export\s+default\s+(async\s+)?function|export\s+default\s+async/);
    });

    it('initializes firebase-admin from FIREBASE_SERVICE_ACCOUNT_JSON env var', () => {
      const src = readFileSync('api/blog/index.ts', 'utf-8');
      const lib = existsSync('api/_lib/firebase.ts') ? readFileSync('api/_lib/firebase.ts', 'utf-8') : '';
      expect(src + lib).toContain('FIREBASE_SERVICE_ACCOUNT_JSON');
      expect(src + lib).toMatch(/firebase-admin/);
    });

    it('queries posts where status == "published", ordered by publishedAt desc', () => {
      const src = readFileSync('api/blog/index.ts', 'utf-8');
      expect(src).toContain('posts');
      expect(src).toContain('status');
      expect(src).toContain('published');
      expect(src).toContain('publishedAt');
      expect(src).toContain('desc');
    });

    it('sets CORS for sean-mcconnell.com and localhost:4321 (no wildcard)', () => {
      const src = readFileSync('api/blog/index.ts', 'utf-8');
      const lib = existsSync('api/_lib/firebase.ts') ? readFileSync('api/_lib/firebase.ts', 'utf-8') : '';
      const all = src + lib;
      expect(all).toContain('https://sean-mcconnell.com');
      expect(all).toContain('http://localhost:4321');
      expect(all).not.toContain('Access-Control-Allow-Origin", "*"');
      expect(all).not.toContain("Access-Control-Allow-Origin', '*'");
    });

    it('response shape includes slug, title, description, tags, publishedAt, readingTime', () => {
      const src = readFileSync('api/blog/index.ts', 'utf-8');
      expect(src).toContain('slug');
      expect(src).toContain('title');
      expect(src).toContain('description');
      expect(src).toContain('tags');
      expect(src).toContain('readingTime');
    });
  });

  // === Todo 11: api/blog/[slug].ts detail route ===
  describe('Todo 11: api/blog/[slug].ts (single published post)', () => {
    it('exists at api/blog/[slug].ts', () => {
      expect(existsSync('api/blog/[slug].ts')).toBe(true);
    });

    it('exports a default handler function', () => {
      const src = readFileSync('api/blog/[slug].ts', 'utf-8');
      expect(src).toMatch(/export\s+default\s+(async\s+)?function|export\s+default\s+async/);
    });

    it('reads the slug from the request query', () => {
      const src = readFileSync('api/blog/[slug].ts', 'utf-8');
      expect(src).toMatch(/req\.query\.slug|query\.slug/);
    });

    it('returns 404 when post does not exist or is not published', () => {
      const src = readFileSync('api/blog/[slug].ts', 'utf-8');
      expect(src).toMatch(/404/);
      expect(src).toContain('published');
    });

    it('response shape includes slug, title, description, tags, content, publishedAt', () => {
      const src = readFileSync('api/blog/[slug].ts', 'utf-8');
      expect(src).toContain('slug');
      expect(src).toContain('title');
      expect(src).toContain('description');
      expect(src).toContain('tags');
      expect(src).toContain('content');
      expect(src).toContain('publishedAt');
    });

    it('uses shared CORS + firebase-admin init (no wildcard origin)', () => {
      const src = readFileSync('api/blog/[slug].ts', 'utf-8');
      const lib = existsSync('api/_lib/firebase.ts') ? readFileSync('api/_lib/firebase.ts', 'utf-8') : '';
      const all = src + lib;
      expect(all).toContain('https://sean-mcconnell.com');
      expect(all).toContain('http://localhost:4321');
      expect(all).toContain('FIREBASE_SERVICE_ACCOUNT_JSON');
      expect(all).not.toContain('Access-Control-Allow-Origin", "*"');
      expect(all).not.toContain("Access-Control-Allow-Origin', '*'");
    });
  });

  // === Todo 13: vercel.json ===
  describe('Todo 13: vercel.json rewrite + cache headers', () => {
    it('exists at repo root', () => {
      expect(existsSync('vercel.json')).toBe(true);
    });

    it('rewrites /blog/:path to /blog/post/index.html', () => {
      const cfg = JSON.parse(readFileSync('vercel.json', 'utf-8'));
      expect(cfg.rewrites).toBeDefined();
      const blogRewrite = cfg.rewrites.find(
        (r: any) => r.source?.startsWith('/blog/') && r.destination === '/blog/post/index.html'
      );
      expect(blogRewrite).toBeDefined();
      expect(blogRewrite.source).toMatch(/^\/blog\/(:path|\*)/);
    });

    it('has 1yr immutable cache for /_astro/**', () => {
      const cfg = JSON.parse(readFileSync('vercel.json', 'utf-8'));
      expect(cfg.headers).toBeDefined();
      const astroRule = cfg.headers.find((h: any) => h.source?.startsWith('/_astro/'));
      expect(astroRule).toBeDefined();
      const cacheHeader = astroRule.headers.find((h: any) => h.key === 'Cache-Control');
      expect(cacheHeader.value).toContain('max-age=31536000');
      expect(cacheHeader.value).toContain('immutable');
    });

    it('has 7-day cache for /images/**', () => {
      const cfg = JSON.parse(readFileSync('vercel.json', 'utf-8'));
      const rule = cfg.headers.find((h: any) => h.source?.startsWith('/images/'));
      expect(rule).toBeDefined();
      const cacheHeader = rule.headers.find((h: any) => h.key === 'Cache-Control');
      expect(cacheHeader.value).toContain('max-age=604800');
    });

    it('has 7-day cache for /favicon.ico and /apple-touch-icon.png', () => {
      const cfg = JSON.parse(readFileSync('vercel.json', 'utf-8'));
      const favicon = cfg.headers.find((h: any) => h.source === '/favicon.ico');
      const apple = cfg.headers.find((h: any) => h.source === '/apple-touch-icon.png');
      expect(favicon).toBeDefined();
      expect(apple).toBeDefined();
      expect(favicon.headers.find((h: any) => h.key === 'Cache-Control').value).toContain('max-age=604800');
      expect(apple.headers.find((h: any) => h.key === 'Cache-Control').value).toContain('max-age=604800');
    });
  });

  // === Todo 12: cross-cutting — OPTIONS preflight + frontend-compatible shape ===
  describe('Todo 12: shared behavior on both routes', () => {
    it('both routes short-circuit OPTIONS preflight with 204', () => {
      const list = readFileSync('api/blog/index.ts', 'utf-8');
      const detail = readFileSync('api/blog/[slug].ts', 'utf-8');
      expect(list).toMatch(/OPTIONS/);
      expect(list).toMatch(/204/);
      expect(detail).toMatch(/OPTIONS/);
      expect(detail).toMatch(/204/);
    });

    it('response fields match what src/pages/blog/index.astro expects', () => {
      const list = readFileSync('api/blog/index.ts', 'utf-8');
      for (const field of ['slug', 'title', 'description', 'tags', 'publishedAt', 'readingTime']) {
        expect(list).toContain(field);
      }
    });

    it('response fields match what src/pages/blog/post.astro expects', () => {
      const detail = readFileSync('api/blog/[slug].ts', 'utf-8');
      for (const field of ['slug', 'title', 'description', 'tags', 'content', 'publishedAt']) {
        expect(detail).toContain(field);
      }
    });
  });
});
