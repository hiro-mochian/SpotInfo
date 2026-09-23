import { access, copyFile } from "node:fs/promises";
import { constants } from "node:fs";
import { resolve } from "node:path";

const dist = resolve("dist");
const index = resolve(dist, "index.html");
try {
  await access(index, constants.R_OK);
} catch {
  throw new Error("Expected dist/index.html after Vite build.");
}

// Firebase Hosting rewrites application routes to index.html. Retaining 404.html
// gives direct static hosts a safe fallback without the former Pages route folders.
await copyFile(index, resolve(dist, "404.html"));
console.log("Prepared Firebase Hosting assets with root SPA fallback.");
