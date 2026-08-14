import { getDb, setCors } from "../_lib/firebase.js";
import { readingTime } from "../../src/lib/blog/post.js";

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

  try {
    const db = getDb();
    const snapshot = await db
      .collection("posts")
      .where("status", "==", "published")
      .orderBy("publishedAt", "desc")
      .get();

    const posts = snapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        slug: doc.id,
        title: data.title,
        description: data.description,
        tags: data.tags || [],
        publishedAt: data.publishedAt?.toDate().toISOString() || null,
        readingTime: readingTime(data.content),
      };
    });

    res.status(200).json(posts);
  } catch (err) {
    console.error("API /blog error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
}
