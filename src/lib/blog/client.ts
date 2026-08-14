/**
 * The browser-side half of the Post module: fetch, then hand off to the pure
 * mapping in ./post.ts. Deliberately thin — there is no logic here to test.
 */
import { toPost, toPostSummaries, type Post, type PostSummary } from './post';

const API_BASE = '/api/blog';

export async function fetchPosts(): Promise<PostSummary[]> {
  const res = await fetch(API_BASE);
  if (!res.ok) throw new Error(`GET ${API_BASE} failed with ${res.status}`);
  return toPostSummaries(await res.json());
}

export async function fetchPost(slug: string): Promise<Post | null> {
  const res = await fetch(`${API_BASE}/${slug}`);
  if (!res.ok) return null;
  return toPost(await res.json());
}

/** The dev server has no `/blog/:path*` rewrite, so post links take a different shape. */
export function isDev(): boolean {
  return window.location.hostname === 'localhost';
}
