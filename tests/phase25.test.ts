import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'fs';

describe('25 — Public Blog Pages (Cloud Functions)', () => {
  describe('Cloud Function API', () => {
    const fn = readFileSync('functions/src/index.ts', 'utf-8');

    it('has functions/src/index.ts', () => {
      expect(existsSync('functions/src/index.ts')).toBe(true);
    });

    it('exports an api function', () => {
      expect(fn).toContain('export const api');
    });

    it('initializes Firebase Admin', () => {
      expect(fn).toContain('initializeApp()');
    });

    it('initializes Firestore', () => {
      expect(fn).toContain('getFirestore()');
    });

    it('handles /api/blog route for listing', () => {
      expect(fn).toContain('path === "/blog"');
    });

    it('queries published posts ordered by publishedAt desc', () => {
      expect(fn).toContain('"status", "==", "published"');
      expect(fn).toContain('"publishedAt", "desc"');
    });

    it('handles /api/blog/:slug route for individual post', () => {
      expect(fn).toContain('postMatch');
      expect(fn).toContain('[a-z0-9-]+');
    });

    it('returns 404 for non-published posts', () => {
      expect(fn).toContain("status !== \"published\"");
    });

    it('returns post content as JSON', () => {
      expect(fn).toContain('content: data.content');
    });

    it('sets CORS headers', () => {
      expect(fn).toContain('Access-Control-Allow-Origin');
    });

    it('handles OPTIONS for CORS preflight', () => {
      expect(fn).toContain("req.method === \"OPTIONS\"");
    });
  });

  describe('blog listing page', () => {
    it('exists at src/pages/blog/index.astro', () => {
      expect(existsSync('src/pages/blog/index.astro')).toBe(true);
    });

    const listing = readFileSync('src/pages/blog/index.astro', 'utf-8');

    it('fetches from /api/blog', () => {
      expect(listing).toContain("fetch('/api/blog')");
    });

    it('renders post cards with links', () => {
      expect(listing).toContain('/blog/${post.slug}');
    });

    it('shows tags on cards', () => {
      expect(listing).toContain('post.tags');
    });

    it('shows date on cards', () => {
      expect(listing).toContain('post.publishedAt');
    });

    it('has a loading spinner', () => {
      expect(listing).toContain('animate-spin');
    });

    it('includes Nav component', () => {
      expect(listing).toContain('<Nav');
    });

    it('has proper title', () => {
      expect(listing).toContain('Blog — Sean McConnell');
    });
  });

  describe('blog post page', () => {
    it('exists at src/pages/blog/post.astro', () => {
      expect(existsSync('src/pages/blog/post.astro')).toBe(true);
    });

    const post = readFileSync('src/pages/blog/post.astro', 'utf-8');

    it('fetches from /api/blog/:slug', () => {
      expect(post).toContain('`/api/blog/${slug}`');
    });

    it('uses generateHTML to render Tiptap content', () => {
      expect(post).toContain("from '@tiptap/html'");
      expect(post).toContain('generateHTML');
    });

    it('shows post title', () => {
      expect(post).toContain('id="post-title"');
    });

    it('shows post date', () => {
      expect(post).toContain('id="post-date"');
    });

    it('shows reading time', () => {
      expect(post).toContain('id="post-reading-time"');
      expect(post).toContain('min read');
    });

    it('shows tags', () => {
      expect(post).toContain('id="post-tags"');
    });

    it('renders post body', () => {
      expect(post).toContain('id="post-body"');
    });

    it('has 404 not found state', () => {
      expect(post).toContain('id="post-not-found"');
      expect(post).toContain('Post Not Found');
    });

    it('updates document title dynamically', () => {
      expect(post).toContain('document.title =');
    });

    it('updates meta description dynamically', () => {
      expect(post).toContain('meta[name="description"]');
    });

    it('has prose-blog styles', () => {
      expect(post).toContain('.prose-blog h1');
      expect(post).toContain('.prose-blog p');
      expect(post).toContain('.prose-blog pre');
      expect(post).toContain('.prose-blog blockquote');
    });

    it('has back to blog link', () => {
      expect(post).toContain('href="/blog"');
    });

    it('includes Nav component', () => {
      expect(post).toContain('<Nav');
    });
  });

  describe('Nav blog link', () => {
    const nav = readFileSync('src/components/Nav.astro', 'utf-8');

    it('has Blog link in desktop nav', () => {
      expect(nav).toContain('href="/blog"');
    });

    it('has Blog link in mobile nav', () => {
      const mobileSection = nav.slice(nav.indexOf('id="mobile-menu"'));
      expect(mobileSection).toContain('href="/blog"');
    });
  });

  describe('Firebase Hosting rewrites', () => {
    const firebaseJson = JSON.parse(readFileSync('firebase.json', 'utf-8'));
    const rewrites = firebaseJson.hosting.rewrites;

    it('has /api/** rewrite to cloud function', () => {
      const apiRewrite = rewrites.find((r: any) => r.source === '/api/**');
      expect(apiRewrite).toBeDefined();
      expect(apiRewrite.function).toBe('api');
    });

    it('has /blog/** rewrite to post page', () => {
      const blogRewrite = rewrites.find((r: any) => r.source === '/blog/**');
      expect(blogRewrite).toBeDefined();
      expect(blogRewrite.destination).toBe('/blog/post/index.html');
    });
  });
});
