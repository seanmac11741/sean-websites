import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'fs';

describe('25 — Public Blog Pages', () => {
  // Cloud Function API block removed — blog API migrated from `functions/src/index.ts`
  // to Vercel Serverless Functions in `api/` (plan.md todo 45). New API assertions live
  // in tests/vercel-migration.test.ts (todos 10-12).

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

  // Firebase Hosting rewrites block removed — hosting moved to Vercel (plan.md todo 45).
  // The `/blog/:path` rewrite now lives in `vercel.json` and is asserted in
  // tests/vercel-migration.test.ts (todo 13). `/api/**` is native Vercel Functions,
  // no rewrite required.
});
