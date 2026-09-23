import type { Session } from "@supabase/supabase-js";
import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { appBaseUrl, authMode, isSupabaseConfigured } from "./config";
import { requireSupabase, supabase } from "./supabase";

type AuthContextValue = {
  session: Session | null;
  loading: boolean;
  configured: boolean;
  signInWithGithub: () => Promise<void>;
  signInWithEmail: (email: string, password: string, createAccount: boolean) => Promise<string | null>;
  resetPassword: (email: string) => Promise<string | null>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(isSupabaseConfigured);

  useEffect(() => {
    if (!supabase) {
      setLoading(false);
      return;
    }

    let active = true;
    void supabase.auth.getSession().then(({ data, error }) => {
      if (active) {
        setSession(error ? null : data.session);
        setLoading(false);
      }
    });
    const { data: subscription } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      setLoading(false);
    });
    return () => {
      active = false;
      subscription.subscription.unsubscribe();
    };
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      session,
      loading,
      configured: isSupabaseConfigured,
      async signInWithGithub() {
        const { error } = await requireSupabase().auth.signInWithOAuth({
          provider: "github",
          options: {
            redirectTo: `${window.location.origin}${appBaseUrl}`,
            scopes: "read:user user:email",
          },
        });
        if (error) throw error;
      },
      async signInWithEmail(email, password, createAccount) {
        const client = requireSupabase();
        if (authMode !== "email") return "メールログインはこの環境では有効になっていません。";
        const result = createAccount
          ? await client.auth.signUp({ email, password, options: { emailRedirectTo: `${window.location.origin}${appBaseUrl}` } })
          : await client.auth.signInWithPassword({ email, password });
        return result.error?.message ?? (createAccount ? "確認メールを送信しました。" : null);
      },
      async resetPassword(email) {
        if (authMode !== "email") return "メールログインはこの環境では有効になっていません。";
        const { error } = await requireSupabase().auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}${appBaseUrl}`,
        });
        return error?.message ?? "パスワード再設定用のメールを送信しました。";
      },
      async signOut() {
        const { error } = await requireSupabase().auth.signOut();
        if (error) throw error;
      },
    }),
    [loading, session],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) throw new Error("useAuth must be used inside AuthProvider");
  return value;
}
