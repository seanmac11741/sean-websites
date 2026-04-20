import { getDb, setCors } from "../_lib/firebase.js";
export default async function handler(req: import('@vercel/node').VercelRequest, res: import('@vercel/node').VercelResponse) {
export default async function handler(req: any, res: any) {
  setCors(req, res);

  if (req.method === "OPTIONS") {
    res.status(204).end();
    return;
  }

  if (req.method !== "GET") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  const rawSlug = req.query.slug;
  const slug = Array.isArray(rawSlug) ? rawSlug[0] : rawSlug;

  if (!slug || typeof slug !== "string" || !/^[a-z0-9-]+$/.test(slug)) {
    res.status(404).json({ error: "Post not found" });
    return;
  }

  try {
    const db = getDb();
    const doc = await db.collection("posts").doc(slug).get();

    if (!doc.exists || doc.data()?.status !== "published") {
      res.status(404).json({ error: "Post not found" });
      return;
    }

    const data = doc.data()!;
    res.status(200).json({
      slug: doc.id,
      title: data.title,
      description: data.description,
      tags: data.tags || [],
      content: data.content,
      publishedAt: data.publishedAt?.toDate().toISOString() || null,
    });
  } catch (err) {
    console.error("API /blog/[slug] error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
}
