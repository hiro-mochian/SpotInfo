import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { resolve } from "node:path";

function normaliseBase(value: string): string {
  const withLeadingSlash = value.startsWith("/") ? value : `/${value}`;
  return withLeadingSlash.endsWith("/") ? withLeadingSlash : `${withLeadingSlash}/`;
}

export default defineConfig(({ command, mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const base = command === "serve" ? "/" : normaliseBase(env.VITE_BASE_PATH || "/");
  return {
    base,
    root: "client",
    envDir: resolve(process.cwd()),
    resolve: { alias: { "@": resolve(process.cwd(), "client/src") } },
    plugins: [react(), tailwindcss()],
    build: { outDir: "../dist", emptyOutDir: true },
    test: { environment: "node", include: ["src/**/*.test.ts"] },
  };
});
