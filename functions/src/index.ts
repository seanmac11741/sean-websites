import { setGlobalOptions } from "firebase-functions/v2";
import { onRequest } from "firebase-functions/v2/https";
import { initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

initializeApp();
const db = getFirestore();

setGlobalOptions({ maxInstances: 10 });

function wordCount(json: any): number {
  let count = 0;
  function walk(node: any) {
    if (node.text) count += node.text.split(/\s+/).filter(Boolean).length;
    if (node.content) node.content.forEach(walk);
  }
  walk(json);
  return count;
}

function setCors(res: any) {
  res.set("Access-Control-Allow-Origin", "*");
  res.set("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.set("Access-Control-Allow-Headers", "Content-Type");
}

export const api = onRequest({ invoker: "public" }, async (req, res) => {
  setCors(res);
  if (req.method === "OPTIONS") {
    res.status(204).send("");
    return;
  }

  const path = req.path.replace(/^\/api/, "");

  try {
    if (path === "/blog" || path === "/blog/") {
      const snapshot = await db
        .collection("posts")
        .where("status", "==", "published")
        .orderBy("publishedAt", "desc")
        .get();

      const posts = snapshot.docs.map((doc) => {
        const data = doc.data();
        const words = data.content ? wordCount(data.content) : 0;
        const readingTime = Math.max(1, Math.round(words / 250));
        return {
          slug: doc.id,
          title: data.title,
          description: data.description,
          tags: data.tags || [],
          publishedAt: data.publishedAt?.toDate().toISOString() || null,
          readingTime,
        };
      });

      res.json(posts);
      return;
    }

    const postMatch = path.match(/^\/blog\/([a-z0-9-]+)$/);
    if (postMatch) {
      const slug = postMatch[1];
      const doc = await db.collection("posts").doc(slug).get();

      if (!doc.exists || doc.data()?.status !== "published") {
        res.status(404).json({ error: "Post not found" });
        return;
      }

      const data = doc.data()!;
      res.json({
        slug: doc.id,
        title: data.title,
        description: data.description,
        tags: data.tags || [],
        content: data.content,
        publishedAt: data.publishedAt?.toDate().toISOString() || null,
      });
      return;
    }

    res.status(404).json({ error: "Not found" });
  } catch (err) {
    console.error("API error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});
