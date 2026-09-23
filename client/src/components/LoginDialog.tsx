import {useState} from 'react';
import {useAuth} from '../lib/auth';
import {Dialog} from './Dialog';
export function LoginDialog({open,onOpenChange}:{open:boolean;onOpenChange:(open:boolean)=>void}){
 const {signInWithGoogle,configured,error}=useAuth();
 const [pending,setPending]=useState(false);
 const [message,setMessage]=useState<string|null>(null);
 async function login(){setPending(true);setMessage(null);try{await signInWithGoogle();}catch(e){setMessage(e instanceof Error?e.message:'ログインを開始できませんでした。');setPending(false);}}
 return <Dialog open={open} onOpenChange={onOpenChange} title="Googleでログイン" description="利用者登録・スポットの投稿と編集にはGoogleアカウントを使用します。">
  <p className="help-text">サイト内でパスワードを入力することはありません。Googleの認証画面へ移動します。</p>
  {!configured?<p className="form-error" role="alert">接続設定が未完了です。</p>:null}
  {message||error?<p className="form-error" role="alert">{message||error}</p>:null}
  <div className="dialog-actions-stack"><button className="button button-primary" type="button" disabled={!configured||pending} onClick={()=>void login()}>{pending?'Googleを開いています…':'Googleでログイン'}</button></div>
  <p className="help-text mt-3">取得するのは本人識別に必要なプロフィールとメールアドレスだけです。</p>
 </Dialog>;
}
