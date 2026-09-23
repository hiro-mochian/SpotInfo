import { FormEvent, useState } from "react";
import { authMode } from "../lib/config";
import { useAuth } from "../lib/auth";
import { Dialog } from "./Dialog";

type Props = { open: boolean; onOpenChange: (open: boolean) => void };

export function LoginDialog({ open, onOpenChange }: Props) {
  const { signInWithGithub, signInWithEmail, resetPassword, configured } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [createAccount, setCreateAccount] = useState(false);
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function github() {
    setPending(true);
    setMessage(null);
    try {
      await signInWithGithub();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "GitHub ログインを開始できませんでした。");
      setPending(false);
    }
  }

  async function emailSubmit(event: FormEvent) {
    event.preventDefault();
    setPending(true);
    setMessage(null);
    try {
      const result = await signInWithEmail(email, password, createAccount);
      setMessage(result);
      if (!result || createAccount) setPassword("");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "ログインできませんでした。");
    } finally {
      setPending(false);
    }
  }

  async function passwordReset() {
    setPending(true);
    setMessage(null);
    try {
      setMessage(await resetPassword(email));
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "メールを送信できませんでした。");
    } finally {
      setPending(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange} title="ログイン" description="マイスポットを開くためのログインです。">
      <p className="migration-note">移行先では新しくログインしてください。以前の Manus のログイン情報は引き継がれません。</p>
      {!configured ? <p className="form-error" role="alert">Supabase の公開設定が未完了です。</p> : null}
      {authMode === "github" && message ? <p className="form-error" role="alert">{message}</p> : null}
      {authMode === "github" ? (
        <div className="dialog-actions-stack">
          <button type="button" className="button button-primary" onClick={() => void github()} disabled={!configured || pending}>
            {pending ? "GitHub を開いています…" : "GitHub でログイン"}
          </button>
          <p className="help-text">Spot が要求する権限はプロフィールとメールアドレスの読み取りだけです。</p>
        </div>
      ) : (
        <form className="form-grid" onSubmit={emailSubmit}>
          <label>
            メールアドレス
            <input type="email" value={email} onChange={(event) => setEmail(event.target.value)} required autoComplete="email" />
          </label>
          <label>
            パスワード
            <input type="password" value={password} onChange={(event) => setPassword(event.target.value)} required minLength={6} autoComplete={createAccount ? "new-password" : "current-password"} />
          </label>
          {message ? <p className={message.includes("送信") || message.includes("確認") ? "form-success" : "form-error"} role="status">{message}</p> : null}
          <button type="submit" className="button button-primary" disabled={!configured || pending}>{pending ? "処理中…" : createAccount ? "アカウントを作成" : "ログイン"}</button>
          <div className="inline-actions">
            <button type="button" className="text-button" onClick={() => setCreateAccount((value) => !value)}>{createAccount ? "ログインに戻る" : "新しく登録する"}</button>
            <button type="button" className="text-button" onClick={() => void passwordReset()} disabled={!email || pending}>パスワードを忘れた</button>
          </div>
        </form>
      )}
    </Dialog>
  );
}
