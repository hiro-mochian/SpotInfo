import { copyFile, mkdir, access } from "node:fs/promises";
import { constants } from "node:fs";
import { resolve } from "node:path";

const dist = resolve("dist");
const index = resolve(dist, "index.html");

try {
  await access(index, constants.R_OK);
} catch {
  throw new Error("Expected dist/index.html after Vite build.");
}

await copyFile(index, resolve(dist, "404.html"));
await mkdir(resolve(dist, "my"), { recursive: true });
await copyFile(index, resolve(dist, "my", "index.html"));

console.log("Prepared GitHub Pages routes: home, my, admin; 404 fallback");

await mkdir(resolve(dist, "admin"), {recursive:true});
await copyFile(index,resolve(dist,"admin","index.html"));
