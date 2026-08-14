/**
 * The Post module — the one place that knows the shape of a blog post, how long
 * it takes to read, and how it renders as a card.
 *
 * Everything here is pure: values in, values out. Fetching lives in ./client.ts,
 * DOM wiring lives in the pages. See docs/adr/0001-tests-assert-behaviour-not-source-text.md.
 */

/** Reading speed used everywhere a "min read" is shown — listing, post page, admin preview. */
export const WORDS_PER_MINUTE = 200;

export interface TiptapNode {
  type?: string;
  text?: string;
  content?: TiptapNode[];
}

export interface PostSummary {
  slug: string;
  title: string;
  description: string;
  tags: string[];
  publishedAt: string | null;
  readingTime: number;
}

export interface Post extends Omit<PostSummary, 'readingTime'> {
  content: TiptapNode | null;
}

export function wordCount(doc: TiptapNode | null | undefined): number {
  let count = 0;
  const walk = (node: TiptapNode | null | undefined) => {
    if (!node) return;
    if (node.text) count += node.text.split(/\s+/).filter(Boolean).length;
    node.content?.forEach(walk);
  };
  walk(doc);
  return count;
}

export function readingTime(doc: TiptapNode | null | undefined): number {
  return Math.max(1, Math.round(wordCount(doc) / WORDS_PER_MINUTE));
}

export function formatPostDate(
  publishedAt: string | Date | null | undefined,
  timeZone?: string
): string {
  if (!publishedAt) return '';
  return new Date(publishedAt).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
    ...(timeZone ? { timeZone } : {}),
  });
}

/**
 * In production the `/blog/:path*` rewrite serves the post page; the dev server has
 * no rewrite, so it takes the slug as a query parameter instead.
 */
export function postHref(slug: string, opts: { isDev?: boolean } = {}): string {
  return opts.isDev ? `/blog/post?slug=${slug}` : `/blog/${slug}`;
}

export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function asString(value: unknown): string {
  return typeof value === 'string' ? value : '';
}

function asTags(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((t): t is string => typeof t === 'string') : [];
}

export function toPostSummaries(payload: unknown): PostSummary[] {
  if (!Array.isArray(payload)) return [];
  return payload.map((raw: any) => ({
    slug: asString(raw?.slug),
    title: asString(raw?.title),
    description: asString(raw?.description),
    tags: asTags(raw?.tags),
    publishedAt: asString(raw?.publishedAt) || null,
    readingTime: typeof raw?.readingTime === 'number' ? raw.readingTime : 1,
  }));
}

export function toPost(payload: unknown): Post {
  const raw = payload as Record<string, unknown> | null | undefined;
  return {
    slug: asString(raw?.slug),
    title: asString(raw?.title),
    description: asString(raw?.description),
    tags: asTags(raw?.tags),
    publishedAt: asString(raw?.publishedAt) || null,
    content: (raw?.content as TiptapNode | undefined) ?? null,
  };
}

export interface RenderCardOptions {
  /** `list` is the blog listing; `latest` is the homepage card. */
  variant?: 'list' | 'latest';
  isDev?: boolean;
  /** Test-only: pins the date format so assertions don't depend on the machine's zone. */
  timeZone?: string;
}

const CARD_CLASS = {
  list: 'block bg-surface border border-white/10 rounded-xl p-6 hover:border-accent/50 transition-all duration-200 mb-4 group',
  latest:
    'block rounded-xl border border-white/10 bg-surface/40 p-6 hover:border-accent/50 hover:-translate-y-1 hover:bg-surface/80 transition-all duration-200 group',
} as const;

const TITLE_CLASS =
  'text-xl font-semibold text-white group-hover:text-accent transition-colors duration-200 mb-2';

export function renderPostCard(post: PostSummary, opts: RenderCardOptions = {}): string {
  const { variant = 'list', isDev, timeZone } = opts;
  const date = formatPostDate(post.publishedAt, timeZone);
  const heading = variant === 'latest' ? 'h3' : 'h2';
  const id = variant === 'latest' ? ' id="latest-post-card"' : '';

  const tags = post.tags
    .map(
      (tag) =>
        `<span class="text-xs bg-white/5 text-slate-400 px-2 py-1 rounded-full">${escapeHtml(tag)}</span>`
    )
    .join('');

  return `<a${id} href="${escapeHtml(postHref(post.slug, { isDev }))}" class="${CARD_CLASS[variant]}">
  <${heading} class="${TITLE_CLASS}">${escapeHtml(post.title)}</${heading}>
  <p class="text-slate-400 text-sm mb-3 line-clamp-2">${escapeHtml(post.description)}</p>
  <div class="flex flex-wrap items-center gap-3">
    ${date ? `<time class="text-xs text-slate-500">${date}</time>` : ''}
    ${date && post.readingTime ? '<span class="text-xs text-slate-600">·</span>' : ''}
    ${post.readingTime ? `<span class="text-xs text-slate-500">${post.readingTime} min read</span>` : ''}
    ${tags ? `<div class="flex flex-wrap gap-2">${tags}</div>` : ''}
  </div>${
    variant === 'latest'
      ? '\n  <span class="text-accent text-sm font-medium mt-3 inline-block">Read more &rarr;</span>'
      : ''
  }
</a>`;
}
