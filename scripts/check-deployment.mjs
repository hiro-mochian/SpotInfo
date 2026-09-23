// No credentials are logged. This script verifies a configured backend BEFORE publication.
const url=process.env.VITE_SUPABASE_URL?.replace(/\/$/,'');
const key=process.env.VITE_SUPABASE_PUBLISHABLE_KEY;
const mode=process.env.VITE_AUTH_MODE||'github';
if(!url||!key) throw new Error('Set VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY.');
if(key.startsWith('sb_secret_')) throw new Error('A secret key must NEVER be put into VITE_* variables.');
if(key.startsWith('eyJ')){
 const payload=JSON.parse(Buffer.from(key.split('.')[1],'base64url').toString());
 if(payload.role!=='anon') throw new Error('Only an anon or publishable browser key is allowed.');
}
const headers={apikey:key,'Content-Type':'application/json'};
const count=await fetch(`${url}/rest/v1/rpc/count_spots`,{method:'POST',headers,body:'{}',signal:AbortSignal.timeout(20000)});
if(!count.ok||typeof await count.json()!=='number')throw new Error('The public spots API is not ready.');
const response=await fetch(`${url}/auth/v1/settings`,{headers,signal:AbortSignal.timeout(20000)});
if(!response.ok)throw new Error('Cannot read Supabase Auth settings.');
const settings=await response.json();
if(mode==='github'&&settings.external?.github!==true)throw new Error('Publication blocked: GitHub OAuth provider has not been enabled in Supabase.');
if(mode==='email')throw new Error('Email-mode publication requires a separately verified SMTP delivery setup; this workflow currently approves GitHub login only.');
if(mode!=='github')throw new Error('Unsupported authentication mode.');
console.log('Public API and GitHub login provider are configured. End-to-end login still requires a real browser sign-in.');
