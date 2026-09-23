/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_FRONTEND_READY?: string;
  readonly VITE_SUPABASE_URL?: string;
  readonly VITE_SUPABASE_PUBLISHABLE_KEY?: string;
  readonly VITE_AUTH_MODE?: "github" | "email";
  readonly VITE_BASE_PATH?: string;
  readonly VITE_GEOCODING_URL?: string;
  readonly VITE_TILE_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
