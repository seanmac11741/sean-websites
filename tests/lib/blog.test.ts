import { describe, expect, it } from 'vitest';
import {
  WORDS_PER_MINUTE,
  escapeHtml,
  formatPostDate,
  postHref,
  readingTime,
  renderPostCard,
  toPost,
  toPostSummaries,
  wordCount,
  type PostSummary,
} from '../../src/lib/blog/post';

const doc = (...texts: string[]) => ({
  type: 'doc',
  content: texts.map((text) => ({
    type: 'paragraph',
    content: [{ type: 'text', text }],
  })),
});

const summary = (over: Partial<PostSummary> = {}): PostSummary => ({
  slug: 'hello-world',
  title: 'Hello World',
  description: 'A first post.',
  tags: ['astro'],
  publishedAt: '2026-05-29T12:00:00.000Z',
  readingTime: 3,
  ...over,
});

describe('wordCount', () => {
  it('counts words across nested nodes', () => {
    expect(wordCount(doc('one two three', 'four five'))).toBe(5);
  });

  it('ignores whitespace-only runs', () => {
    expect(wordCount(doc('  spaced   out  '))).toBe(2);
  });

  it('counts nothing for an empty or missing document', () => {
    expect(wordCount(null)).toBe(0);
    expect(wordCount(undefined)).toBe(0);
    expect(wordCount({ type: 'doc', content: [] })).toBe(0);
  });

  it('counts text inside deeply nested marks and lists', () => {
    const nested = {
      type: 'doc',
      content: [
        {
          type: 'bulletList',
          content: [
            {
              type: 'listItem',
              content: [{ type: 'paragraph', content: [{ type: 'text', text: 'deep words here' }] }],
            },
          ],
        },
      ],
    };
    expect(wordCount(nested)).toBe(3);
  });
});

describe('readingTime', () => {
  it('uses one rule at 200 words per minute', () => {
    expect(WORDS_PER_MINUTE).toBe(200);
    const words = Array.from({ length: 600 }, (_, i) => `w${i}`).join(' ');
    expect(readingTime(doc(words))).toBe(3);
  });

  it('rounds to the nearest minute', () => {
    const words = (n: number) => doc(Array.from({ length: n }, (_, i) => `w${i}`).join(' '));
    expect(readingTime(words(240))).toBe(1); // 1.2 → 1
    expect(readingTime(words(340))).toBe(2); // 1.7 → 2
  });

  it('never reports less than a minute', () => {
    expect(readingTime(doc('short'))).toBe(1);
    expect(readingTime(null)).toBe(1);
  });
});

describe('formatPostDate', () => {
  it('formats an ISO timestamp as a long US date', () => {
    expect(formatPostDate('2026-05-29T12:00:00.000Z', 'UTC')).toBe('May 29, 2026');
  });

  it('accepts a Date, as the admin preview holds a Firestore timestamp', () => {
    expect(formatPostDate(new Date('2026-05-29T12:00:00.000Z'), 'UTC')).toBe('May 29, 2026');
  });

  it('returns an empty string when the post has no published date', () => {
    expect(formatPostDate(null)).toBe('');
  });
});

describe('postHref', () => {
  it('links to the rewritten path in production', () => {
    expect(postHref('hello-world')).toBe('/blog/hello-world');
  });

  it('falls back to the query-string route in dev, where the rewrite does not run', () => {
    expect(postHref('hello-world', { isDev: true })).toBe('/blog/post?slug=hello-world');
  });
});

describe('escapeHtml', () => {
  it('escapes markup so post fields cannot inject elements', () => {
    expect(escapeHtml('<img src=x onerror=alert(1)>')).toBe(
      '&lt;img src=x onerror=alert(1)&gt;'
    );
    expect(escapeHtml(`"quoted" & 'single'`)).toBe(
      '&quot;quoted&quot; &amp; &#39;single&#39;'
    );
  });
});

describe('toPostSummaries', () => {
  it('maps the API payload onto the post summary shape', () => {
    const [post] = toPostSummaries([
      {
        slug: 'hello-world',
        title: 'Hello World',
        description: 'A first post.',
        tags: ['astro'],
        publishedAt: '2026-05-29T12:00:00.000Z',
        readingTime: 3,
      },
    ]);
    expect(post).toEqual(summary());
  });

  it('defaults missing tags and dates rather than throwing', () => {
    const [post] = toPostSummaries([{ slug: 'x', title: 'X' }]);
    expect(post.tags).toEqual([]);
    expect(post.publishedAt).toBeNull();
    expect(post.description).toBe('');
  });

  it('returns an empty list for a non-array payload', () => {
    expect(toPostSummaries(null)).toEqual([]);
    expect(toPostSummaries({ error: 'nope' })).toEqual([]);
  });
});

describe('toPost', () => {
  it('carries the Tiptap content through', () => {
    const post = toPost({
      slug: 'hello-world',
      title: 'Hello World',
      description: 'A first post.',
      tags: ['astro'],
      publishedAt: '2026-05-29T12:00:00.000Z',
      content: doc('one two'),
    });
    expect(post.slug).toBe('hello-world');
    expect(wordCount(post.content)).toBe(2);
  });

  it('tolerates a post with no content yet', () => {
    expect(toPost({ slug: 'x', title: 'X' }).content).toBeNull();
  });
});

describe('renderPostCard', () => {
  it('renders title, description, date, reading time and tags', () => {
    const html = renderPostCard(summary(), { timeZone: 'UTC' });
    expect(html).toContain('Hello World');
    expect(html).toContain('A first post.');
    expect(html).toContain('May 29, 2026');
    expect(html).toContain('3 min read');
    expect(html).toContain('astro');
  });

  it('links to the post', () => {
    expect(renderPostCard(summary())).toContain('href="/blog/hello-world"');
    expect(renderPostCard(summary(), { isDev: true })).toContain(
      'href="/blog/post?slug=hello-world"'
    );
  });

  it('escapes post fields', () => {
    const html = renderPostCard(summary({ title: '<script>bad()</script>', tags: ['<b>x</b>'] }));
    expect(html).not.toContain('<script>bad()</script>');
    expect(html).toContain('&lt;script&gt;bad()&lt;/script&gt;');
    expect(html).not.toContain('<b>x</b>');
  });

  it('escapes the slug so it cannot break out of the href attribute', () => {
    const html = renderPostCard(summary({ slug: 'x" onmouseover="bad()' }));
    expect(html).not.toContain('onmouseover="bad()"');
    expect(html).toContain('&quot;');
  });

  it('omits the date separator when there is no published date', () => {
    const html = renderPostCard(summary({ publishedAt: null }));
    expect(html).not.toContain('·');
    expect(html).toContain('3 min read');
  });

  it('renders the listing variant as an h2 with no read-more affordance', () => {
    const html = renderPostCard(summary(), { variant: 'list' });
    expect(html).toContain('<h2');
    expect(html).not.toContain('Read more');
    expect(html).not.toContain('id="latest-post-card"');
  });

  it('renders the latest variant as an h3 the homepage animation can target', () => {
    const html = renderPostCard(summary(), { variant: 'latest' });
    expect(html).toContain('<h3');
    expect(html).toContain('id="latest-post-card"');
    expect(html).toContain('Read more');
  });
});
