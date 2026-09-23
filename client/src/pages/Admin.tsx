import { APP_NAME, RELEASE } from "@/lib/release";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "../lib/auth";
import { adminSummary } from "../lib/api";

export default function Admin() {
  const { session, access, loading, signInWithGoogle, signOut, error, configured } = useAuth();
  const summary = useQuery({
    queryKey: ["admin-summary", session?.uid, access.role],
    enabled: access.canAdmin,
    queryFn: async () => ({ ...(await adminSummary()), role: access.role }),
  });
  async function login() { try { await signInWithGoogle(); } catch { /* auth context exposes a clear error */ } }

  return <div className="min-h-screen bg-background text-foreground">
    <header className="border-b border-border"><div className="mx-auto flex max-w-3xl p-4 flex justify-between items-center"><Link to="/" className="text-2xl font-[family-name:var(--font-display)]">{APP_NAME}<span className="block text-[10px] tracking-widest font-sans text-muted-foreground">{RELEASE}</span></Link><Link to="/" className="text-sm underline">地図帳へ戻る</Link></div></header>
    <main className="mx-auto max-w-3xl px-4 py-12">
      <p className="text-xs tracking-widest text-[#c45336]">ADMINISTRATION</p><h1 className="mt-2 text-4xl">オーナー・管理者</h1>
      <p className="mt-4 text-muted-foreground">この画面は、Firebase の Google ログインとサーバー側で付与されたオーナーまたは管理者のカスタムクレームを持つアカウントだけが利用できます。クライアント側のメールアドレスでは権限を判定しません。</p>
      {loading ? <p className="mt-6" role="status">認証を確認中…</p> : null}
      {!loading && !access.canAdmin ? <section className="mt-8 p-6 border border-border bg-card">
        {access.role === "denied" ? <p role="alert" className="form-error">確認済みの Google アカウントでログインしてください。</p> : null}
        {access.provider === "google" && access.role === "none" ? <p role="alert" className="form-error">この Google アカウントには管理権限がありません。</p> : null}
        {!access.provider ? <p className="help-text mb-4">Google でログインすると、付与済みの管理権限を確認します。</p> : null}
        <button className="button button-primary" disabled={!configured || loading} onClick={() => void login()}>Googleで管理者ログイン</button>
        <p className="help-text mt-4">ログインしただけでは管理者になりません。投稿・編集は Google 認証済みの利用者として行えます。</p>
        <p className="help-text mt-3"><a href={`${import.meta.env.BASE_URL}privacy/`} className="text-button">プライバシーポリシー</a></p>
      </section> : null}
      {error ? <p className="form-error mt-4" role="alert">{error}</p> : null}
      {access.canAdmin ? <section className="mt-8 border border-border bg-card p-6">
        <h2 className="text-2xl">{access.role === "owner" ? "オーナー" : "管理者"}として認証済み</h2>
        {summary.isPending ? <p>集計中…</p> : summary.isError ? <p role="alert">情報を取得できませんでした。</p> : <dl className="mt-4 grid grid-cols-2 gap-3"><dt>公開スポット</dt><dd>{summary.data?.spot_count}件</dd><dt>旧所有者の確認待ち</dt><dd>{summary.data?.unassigned_legacy_count}件</dd></dl>}
        <p className="help-text mt-4">この画面は管理者認証と状況確認用です。管理者の追加、所有者の変更、他の利用者の投稿の編集・削除はここでは行いません。</p>
      </section> : null}
      {session ? <button className="button mt-4 border border-border" onClick={() => void signOut().catch(() => undefined)}>ログアウト</button> : null}
    </main>
  </div>;
}
