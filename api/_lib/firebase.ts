import { getApps, initializeApp, cert, type App } from "firebase-admin/app";
import { getFirestore, type Firestore } from "firebase-admin/firestore";

let app: App | undefined;

export function getDb(): Firestore {
  if (!app) {
    const existing = getApps();
    if (existing.length > 0) {
      app = existing[0];
    } else {
      const json = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
      if (!json) {
        throw new Error("FIREBASE_SERVICE_ACCOUNT_JSON env var is not set");
      }
      const credentials = JSON.parse(json);
      app = initializeApp({ credential: cert(credentials) });
    }
  }
  return getFirestore(app!);
}

const ALLOWED_ORIGINS = [
  "https://sean-mcconnell.com",
  "http://localhost:4321",
];

export function setCors(req: { headers: Record<string, string | string[] | undefined> }, res: { setHeader: (k: string, v: string) => void }) {
  const origin = typeof req.headers.origin === "string" ? req.headers.origin : "";
  if (ALLOWED_ORIGINS.includes(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
    res.setHeader("Vary", "Origin");
  }
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
}

export function wordCount(json: any): number {
  let count = 0;
  function walk(node: any) {
    if (node?.text) count += node.text.split(/\s+/).filter(Boolean).length;
    if (node?.content) node.content.forEach(walk);
  }
  if (json) walk(json);
  return count;
}
