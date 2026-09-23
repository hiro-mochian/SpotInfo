import { readdir, readFile, stat } from "node:fs/promises";
import { join } from "node:path";

const forbidden = [
  /https?:\/\/[^\s"'`<>]*(?:manus\.(?:space|computer|im|com)|forge\.)/i,
  /VITE_(?:OAUTH_PORTAL_URL|FORGE_API_URL|FORGE_API_KEY|SUPABASE_URL|SUPABASE_PUBLISHABLE_KEY)/,
  /BUILT_IN_FORGE_API|manus-runtime|@manus\//i,
  /@supabase\/supabase-js|requireSupabase|signInWithGithub/,
];
const roots = ["client", "dist"];
const ignored = new Set();
let count = 0;
const failures = [];

async function walk(path) {
  try {
    for (const entry of await readdir(path, { withFileTypes: true })) {
      const file = join(path, entry.name);
      if (ignored.has(file)) continue;
      if (entry.isDirectory()) await walk(file);
      else if (/\.(?:[cm]?[jt]sx?|html|css|json|ya?ml)$/.test(file)) {
        count++;
        const text = await readFile(file, "utf8");
        if (forbidden.some((pattern) => pattern.test(text))) failures.push(file);
      }
    }
  } catch (error) {
    if (error?.code !== "ENOENT") throw error;
  }
}
for (const root of roots) await walk(root);
for (const file of ["package.json", "vite.config.ts", ".env.example"]) {
  if ((await stat(file)).isFile()) {
    count++;
    const text = await readFile(file, "utf8");
    if (forbidden.some((pattern) => pattern.test(text))) failures.push(file);
  }
}
if (failures.length) throw new Error(`Legacy or platform-specific runtime dependency found in: ${failures.join(", ")}`);
console.log(`PASS: ${count} active runtime/build files contain no prohibited platform, Supabase, or GitHub-login dependency. Historical source and migration SQL are excluded.`);
