import type {Session} from '@supabase/supabase-js';
import {createContext,useContext,useEffect,useMemo,useRef,useState} from 'react';
import {appBaseUrl,isSupabaseConfigured} from './config';
import {requireSupabase,supabase} from './supabase';

export type Access={provider:'google'|'github'|null;role:'none'|'member'|'owner'|'admin'|'denied';canPost:boolean;canAdmin:boolean;expiresAt?:string};
const NONE:Access={provider:null,role:'none',canPost:false,canAdmin:false};
const PENDING='spotinfo.pending-provider';
const RETURN='spotinfo.return-path';
type AuthValue={session:Session|null;access:Access;loading:boolean;configured:boolean;error:string|null;signInWithGoogle:()=>Promise<void>;signInWithGithub:()=>Promise<void>;signOut:()=>Promise<void>};
const AuthContext=createContext<AuthValue|null>(null);
const inFlight=new Map<string,Promise<Access>>();
async function resolveAccess(session:Session):Promise<Access>{
 const existing=inFlight.get(session.access_token);if(existing)return existing;
 const task=(async()=>{
  const client=requireSupabase();
  const {data,error}=await client.rpc('session_access');
  if(error)throw new Error('認証状態を確認できませんでした。');
  if(data?.provider)return data as Access;
  const provider=sessionStorage.getItem(PENDING);
  if(!session.provider_token||!['google','github'].includes(provider??''))throw new Error('認証の有効期限が切れました。もう一度ログインしてください。');
  const result=await client.functions.invoke('verify-login',{body:{provider,providerToken:session.provider_token}});
  if(result.error||!result.data?.provider)throw new Error('認証元を検証できませんでした。もう一度ログインしてください。');
  sessionStorage.removeItem(PENDING);
  return result.data as Access;
 })();
 inFlight.set(session.access_token,task);
 try{return await task;}finally{inFlight.delete(session.access_token);}
}
export function AuthProvider({children}:{children:React.ReactNode}){
 const [session,setSession]=useState<Session|null>(null);
 const [access,setAccess]=useState<Access>(NONE);
 const [loading,setLoading]=useState(isSupabaseConfigured);
 const [error,setError]=useState<string|null>(null);
 const version=useRef(0);
 useEffect(()=>{
  if(!supabase){setLoading(false);return;}
  let alive=true;
  const sync=async(next:Session|null)=>{
   const current=++version.current;
   setSession(next);setAccess(NONE);setError(null);
   if(!next){setLoading(false);return;}
   setLoading(true);
   try{
    const result=await resolveAccess(next);
    if(alive&&current===version.current){
     setAccess(result);
     const back=sessionStorage.getItem(RETURN);
     if(back==='/admin'&&result.provider==='github'){sessionStorage.removeItem(RETURN);window.location.replace(`${appBaseUrl}admin/`);}
     else if(back==='/my'&&result.canPost){sessionStorage.removeItem(RETURN);window.location.replace(`${appBaseUrl}my/`);}
    }
   }catch(e){if(alive&&current===version.current)setError(e instanceof Error?e.message:'認証を確認できませんでした。');}
   finally{if(alive&&current===version.current)setLoading(false);}
  };
  void supabase.auth.getSession().then(({data,error})=>{if(alive){if(error){setError('セッションを復元できませんでした。');setLoading(false);}else void sync(data.session);}});
  const {data:{subscription}}=supabase.auth.onAuthStateChange((_event,next)=>{window.setTimeout(()=>{if(alive)void sync(next);},0);});
  return()=>{alive=false;version.current++;subscription.unsubscribe();};
 },[]);
 useEffect(()=>{
  if(!access.expiresAt)return;
  const remaining=Date.parse(access.expiresAt)-Date.now();
  const timer=window.setTimeout(()=>{setAccess(NONE);setError('認証の有効期限が切れました。もう一度ログインしてください。');},Math.max(0,remaining));
  return()=>window.clearTimeout(timer);
 },[access.expiresAt]);
 const value=useMemo<AuthValue>(()=>{
  const signIn=async(provider:'google'|'github')=>{
   const client=requireSupabase();
   if(session){const {error}=await client.auth.signOut({scope:'local'});if(error)throw error;}
   sessionStorage.setItem(PENDING,provider);
   sessionStorage.setItem(RETURN,provider==='github'?'/admin':window.location.pathname.replace(appBaseUrl.replace(/\/$/,''),'').startsWith('/my')?'/my':'/');
   const {error}=await client.auth.signInWithOAuth({provider,options:{redirectTo:`${window.location.origin}${appBaseUrl}`,scopes:provider==='github'?'read:user user:email':'openid email profile',queryParams:provider==='google'?{prompt:'select_account'}:undefined}});
   if(error){sessionStorage.removeItem(PENDING);throw error;}
  };
  return {session,access,loading,error,configured:isSupabaseConfigured,signInWithGoogle:()=>signIn('google'),signInWithGithub:()=>signIn('github'),signOut:async()=>{
   const {error}=await requireSupabase().auth.signOut({scope:'local'});if(error)throw error;
   setAccess(NONE);sessionStorage.removeItem(PENDING);sessionStorage.removeItem(RETURN);
  }};
 },[session,access,loading,error]);
 return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
export function useAuth(){const value=useContext(AuthContext);if(!value)throw new Error('Missing AuthProvider');return value;}
