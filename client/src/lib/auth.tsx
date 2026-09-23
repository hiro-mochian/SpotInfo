import type { User } from "firebase/auth";
import { getIdTokenResult, onIdTokenChanged, signInWithPopup, signOut as firebaseSignOut } from "firebase/auth";
import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { isFirebaseConfigured } from "./config";
import { googleProvider, requireAuth, auth } from "./firebase";

export type Access = {
  provider: "google" | null;
  role: "none" | "owner" | "admin" | "denied";
  canPost: boolean;
  canAdmin: boolean;
};

const NONE: Access = { provider: null, role: "none", canPost: false, canAdmin: false };

type AuthValue = {
  session: User | null;
  access: Access;
  isAuthenticated: boolean;
  loading: boolean;
  configured: boolean;
  error: string | null;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthValue | null>(null);

function popupMessage(error: unknown): string {
  const code = typeof error === "object" && error && "code" in error ? String(error.code) : "";
  if (code === "auth/popup-closed-by-user") return "Google ログインがキャンセルされました。";
  if (code === "auth/popup-blocked") return "ログイン画面を開けませんでした。ポップアップを許可してから再試行してください。";
  if (code === "auth/unauthorized-domain") return "この公開ドメインは Firebase Authentication に未登録です。";
  if (code === "auth/operation-not-allowed") return "Google ログインが Firebase Authentication で有効になっていません。";
  return "Google ログインを開始できませんでした。設定を確認して再試行してください。";
}

async function resolveAccess(user: User): Promise<Access> {
  const token = await getIdTokenResult(user);
  const provider = token.claims.firebase && typeof token.claims.firebase === "object"
    ? (token.claims.firebase as { sign_in_provider?: unknown }).sign_in_provider
    : undefined;
  const verifiedGoogle = provider === "google.com" && token.claims.email_verified === true;
  if (!verifiedGoogle) return { provider: null, role: "denied", canPost: false, canAdmin: false };

  const claim = token.claims.role;
  const role = claim === "owner" || claim === "admin" ? claim : "none";
  return { provider: "google", role, canPost: true, canAdmin: role === "owner" || role === "admin" };
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<User | null>(null);
  const [access, setAccess] = useState<Access>(NONE);
  const [loading, setLoading] = useState(isFirebaseConfigured);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!auth) {
      setLoading(false);
      return;
    }
    let active = true;
    const unsubscribe = onIdTokenChanged(auth, (user) => {
      void (async () => {
        setLoading(true);
        setSession(user);
        setError(null);
        if (!user) {
          if (active) {
            setAccess(NONE);
            setLoading(false);
          }
          return;
        }
        try {
          const nextAccess = await resolveAccess(user);
          if (!active) return;
          setAccess(nextAccess);
          if (nextAccess.role === "denied") setError("Google の確認済みメールアドレスでログインしてください。");
        } catch {
          if (active) {
            setAccess(NONE);
            setError("認証状態を確認できませんでした。もう一度ログインしてください。");
          }
        } finally {
          if (active) setLoading(false);
        }
      })();
    });
    return () => {
      active = false;
      unsubscribe();
    };
  }, []);

  const value = useMemo<AuthValue>(() => ({
    session,
    access,
    isAuthenticated: access.canPost,
    loading,
    configured: isFirebaseConfigured,
    error,
    signInWithGoogle: async () => {
      setError(null);
      try {
        await signInWithPopup(requireAuth(), googleProvider);
      } catch (cause) {
        const message = popupMessage(cause);
        setError(message);
        throw new Error(message);
      }
    },
    signOut: async () => {
      await firebaseSignOut(requireAuth());
      // Clear only this app's navigation state; Firebase clears its local auth cache above.
      sessionStorage.removeItem("spotinfo.return-path");
      setAccess(NONE);
      setSession(null);
    },
  }), [access, error, loading, session]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) throw new Error("Missing AuthProvider");
  return value;
}
