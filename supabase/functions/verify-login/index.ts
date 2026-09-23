import {createClient} from 'npm:@supabase/supabase-js@2.117.1';

// Hosted on Supabase, not on any AI platform. No provider token is stored or logged.
const cors=(origin:string|null)=>({
 'Access-Control-Allow-Origin':origin===Deno.env.get('APP_ORIGIN')?origin:'https://hiro-mochian.github.io',
 'Access-Control-Allow-Headers':'authorization, apikey, content-type, x-client-info',
 'Access-Control-Allow-Methods':'POST, OPTIONS',
 'Vary':'Origin',
 'Cache-Control':'no-store'
});
Deno.serve(async(req:Request)=>{
 const headers=cors(req.headers.get('origin'));
 const reply=(status:number,error:string)=>new Response(JSON.stringify({error}),{status,headers:{...headers,'Content-Type':'application/json'}});
 if(req.method==='OPTIONS')return new Response(null,{status:204,headers});
 if(req.method!=='POST')return reply(405,'method_not_allowed');
 const authorization=req.headers.get('authorization')??'';
 if(!authorization.startsWith('Bearer '))return reply(401,'authentication_required');
 try{
  if(Number(req.headers.get('content-length')||0)>24000)return reply(413,'request_too_large');
  const raw=await req.text();if(raw.length>24000)return reply(413,'request_too_large');
  const body=JSON.parse(raw);
  const provider=body.provider;
  const providerToken=body.providerToken;
  if(!['google','github'].includes(provider)||typeof providerToken!=='string'||providerToken.length<12||providerToken.length>16000)return reply(400,'invalid_request');
  const client=createClient(Deno.env.get('SUPABASE_URL')!,Deno.env.get('SUPABASE_ANON_KEY')!,{auth:{persistSession:false,autoRefreshToken:false},global:{headers:{Authorization:authorization}}});
  const token=authorization.slice(7);
  const {data:{user},error}=await client.auth.getUser(token);
  if(error||!user)return reply(401,'invalid_session');
  // Parse only AFTER the Auth server has verified this exact access token.
  const part=token.split('.')[1].replace(/-/g,'+').replace(/_/g,'/');
  const claims=JSON.parse(atob(part.padEnd(Math.ceil(part.length/4)*4,'=')));
  if(!claims.session_id||claims.sub!==user.id)return reply(401,'invalid_session');
  const endpoint=provider==='google'?'https://openidconnect.googleapis.com/v1/userinfo':'https://api.github.com/user';
  const upstream=await fetch(endpoint,{headers:{Authorization:`Bearer ${providerToken}`,Accept:'application/json','User-Agent':'SpotInfo-auth-verifier/1.0'},signal:AbortSignal.timeout(12000)});
  if(!upstream.ok)return reply(401,'provider_verification_failed');
  const identity=await upstream.json();
  const subject=provider==='google'?String(identity.sub??''):String(identity.id??'');
  if(!subject)return reply(401,'invalid_provider_identity');
  const server=createClient(Deno.env.get('SUPABASE_URL')!,Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,{auth:{persistSession:false,autoRefreshToken:false}});
  const {error:bindingError}=await server.rpc('bind_verified_login',{p_session_id:claims.session_id,p_user_id:user.id,p_provider:provider,p_subject:subject});
  if(bindingError)return reply(403,'provider_binding_denied');
  const {data:access,error:accessError}=await client.rpc('session_access');
  if(accessError)return reply(500,'access_check_failed');
  return new Response(JSON.stringify(access),{status:200,headers:{...headers,'Content-Type':'application/json'}});
 }catch{return reply(400,'verification_failed');}
});
