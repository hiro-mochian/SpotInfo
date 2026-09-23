const configuredUrl = import.meta.env.VITE_SUPABASE_URL?.trim() ?? "";
const configuredKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY?.trim() ?? "";

export const supabaseUrl = configuredUrl;
export const supabasePublishableKey = configuredKey;
export const authMode = import.meta.env.VITE_AUTH_MODE === "email" ? "email" : "github";
export const isSupabaseConfigured = Boolean(configuredUrl && configuredKey && !configuredKey.startsWith('sb_secret_'));

export function configurationMessage(): string {
  if (!isSupabaseConfigured) {
    return "Supabase の公開 URL または publishable key が未設定です。VITE_SUPABASE_URL と VITE_SUPABASE_PUBLISHABLE_KEY を設定してください。";
  }
  return "";
}

export const appBaseUrl = import.meta.env.BASE_URL;
