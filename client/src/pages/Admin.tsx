import {APP_NAME, RELEASE} from "@/lib/release";
import {useState} from 'react';
import {Link} from 'react-router-dom';
import {useQuery} from '@tanstack/react-query';
import {useAuth} from '../lib/auth';
import {requireSupabase} from '../lib/supabase';
export default function Admin(){
 const {session,access,loading,signInWithGithub,signOut,error,configured}=useAuth();
 const [pending,setPending]=useState(false);
 const [message,setMessage]=useState<string|null>(null);
 const summary=useQuery({queryKey:['admin-summary',session?.user.id,access.provider],enabled:access.canAdmin,queryFn:async()=>{const {data,error}=await requireSupabase().rpc('admin_summary');if(error)throw error;return data as {role:string;spot_count:number;unassigned_legacy_count:number};}});
 async function login(){setPending(true);setMessage(null);try{await signInWithGithub();}catch(e){setMessage(e instanceof Error?e.message:'ログインを開始できませんでした。');setPending(false);}}
 return <div className="min-h-screen bg-background text-foreground">
  <header className="border-b border-border"><div className="mx-auto max-w-3xl p-4 flex justify-between items-center"><Link to="/" className="text-2xl font-[family-name:var(--font-display)]">{APP_NAME}<span className="block text-[10px] tracking-widest font-sans text-muted-foreground">{RELEASE}</span></Link><Link to="/" className="text-sm underline">地図帳へ戻る</Link></div></header>
  <main className="mx-auto max-w-3xl px-4 py-12">
   <p className="text-xs tracking-widest text-[#c45336]">ADMINISTRATION</p><h1 className="mt-2 text-4xl">オーナー・管理者</h1>
   <p className="mt-4 text-muted-foreground">この画面は、事前に許可されたGitHubアカウントだけが利用できます。Googleでの利用者ログインでは管理権限を取得できません。</p>
   {loading?<p className="mt-6" role="status">認証を確認中…</p>:null}
   {!loading&&!access.canAdmin?<section className="mt-8 p-6 border border-border bg-card">
    {access.provider==='github'?<p role="alert" className="form-error">このGitHubアカウントには管理権限がありません。</p>:null}
    {access.provider==='google'?<p className="help-text mb-4">現在はGoogleでログインしています。管理者として続けるにはGitHubでログインし直してください。</p>:null}
    <button className="button button-primary" disabled={!configured||pending} onClick={()=>void login()}>{pending?'GitHubを開いています…':'GitHubで管理者ログイン'}</button>
    <p className="help-text mt-4">ログインしただけでは管理者になりません。一般利用者の登録・投稿はGoogle認証をご利用ください。</p>
    <p className="help-text mt-3"><a href={`${import.meta.env.BASE_URL}privacy/`} className="text-button">プライバシーポリシー</a></p>
   </section>:null}
   {message||error?<p className="form-error mt-4" role="alert">{message||error}</p>:null}
   {access.canAdmin?<section className="mt-8 border border-border bg-card p-6">
    <h2 className="text-2xl">{access.role==='owner'?'オーナー':'管理者'}として認証済み</h2>
    {summary.isPending?<p>集計中…</p>:summary.isError?<p role="alert">情報を取得できませんでした。</p>:<dl className="mt-4 grid grid-cols-2 gap-3"><dt>公開スポット</dt><dd>{summary.data?.spot_count}件</dd><dt>旧所有者の確認待ち</dt><dd>{summary.data?.unassigned_legacy_count}件</dd></dl>}
    <p className="help-text mt-4">この画面は管理者認証と状況確認用です。管理者の追加、所有者の変更、他の利用者の投稿の編集・削除はここでは行いません。</p>
   </section>:null}
   {session?<button className="button mt-4 border border-border" onClick={()=>void signOut().catch(()=>setMessage('ログアウトできませんでした。'))}>ログアウト</button>:null}
  </main>
 </div>;
}
