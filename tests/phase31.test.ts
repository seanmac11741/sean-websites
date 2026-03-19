import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'fs';

describe('31 — Latest Blog Post on Homepage', () => {
  describe('LatestPost component', () => {
    it('exists at src/components/LatestPost.astro', () => {
      expect(existsSync('src/components/LatestPost.astro')).toBe(true);
    });

    const src = readFileSync('src/components/LatestPost.astro', 'utf-8');

    it('has id="latest-post" section', () => {
      expect(src).toContain('id="latest-post"');
    });

    it('has section heading', () => {
      expect(src).toContain('id="latest-post-heading"');
      expect(src).toContain('Latest from the Blog');
    });

    it('has a loading spinner', () => {
      expect(src).toContain('animate-spin');
      expect(src).toContain('border-accent');
    });

    it('has latest-post-content container', () => {
      expect(src).toContain('id="latest-post-content"');
    });

    it('fetches from /api/blog', () => {
      expect(src).toContain('/api/blog');
    });

    it('grabs the first post from the array', () => {
      expect(src).toContain('posts[0]');
    });

    it('hides section when no posts exist', () => {
      expect(src).toContain("section.style.display = 'none'");
      expect(src).toContain('posts.length === 0');
    });

    it('hides section on fetch error', () => {
      const catchBlock = src.slice(src.lastIndexOf('catch'));
      expect(catchBlock).toContain("section.style.display = 'none'");
    });

    it('renders card with link to blog post', () => {
      expect(src).toContain('/blog/${post.slug}');
    });

    it('shows post title, description, date, reading time, and tags', () => {
      expect(src).toContain('post.title');
      expect(src).toContain('post.description');
      expect(src).toContain('post.publishedAt');
      expect(src).toContain('post.readingTime');
      expect(src).toContain('post.tags');
    });

    it('has a "Read more" link', () => {
      expect(src).toContain('Read more');
    });

    it('has GSAP ScrollTrigger animation for heading', () => {
      expect(src).toContain("gsap.from('#latest-post-heading'");
      expect(src).toContain('ScrollTrigger');
    });

    it('has GSAP animation for card after fetch', () => {
      expect(src).toContain("gsap.from('#latest-post-card'");
    });

    it('uses matching section container pattern', () => {
      expect(src).toContain('py-24 lg:py-32');
      expect(src).toContain('max-w-6xl mx-auto px-6');
    });

    it('card has hover states matching site style', () => {
      expect(src).toContain('hover:border-accent/50');
      expect(src).toContain('hover:-translate-y-1');
      expect(src).toContain('hover:bg-surface/80');
    });
  });

  describe('homepage integration', () => {
    const index = readFileSync('src/pages/index.astro', 'utf-8');

    it('imports LatestPost component', () => {
      expect(index).toContain("import LatestPost from '../components/LatestPost.astro'");
    });

    it('renders LatestPost on the page', () => {
      expect(index).toContain('<LatestPost');
    });

    it('places LatestPost between About and Presentations', () => {
      const aboutPos = index.indexOf('<About');
      const latestPos = index.indexOf('<LatestPost');
      const presentationsPos = index.indexOf('<Presentations');
      expect(latestPos).toBeGreaterThan(aboutPos);
      expect(latestPos).toBeLessThan(presentationsPos);
    });
  });
});
