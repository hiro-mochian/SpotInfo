// Configuration checks only; real browser OAuth round trips are still required.
const url=process.env.VITE_SUPABASE_URL?.replace(/\/$/,'');
const key=process.env.VITE_SUPABASE_PUBLISHABLE_KEY;
if(!url||!key)throw new Error('Set VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY.');
if(key.startsWith('sb_secret_'))throw new Error('Never use a secret key in VITE_* variables.');
if(key.startsWith('eyJ')&&JSON.parse(Buffer.from(key.split('.')[1],'base64url').toString()).role!=='anon')throw new Error('Only a browser-safe public key is allowed.');
const headers={apikey:key,'Content-Type':'application/json'};
async function read(path,body){const r=await fetch(`${url}${path}`,{method:body===undefined?'GET':'POST',headers,body:body===undefined?undefined:JSON.stringify(body),signal:AbortSignal.timeout(20000)});if(!r.ok)throw new Error(`Backend check failed: ${path}`);return r.json();}
const count=await read('/rest/v1/rpc/count_spots',{});
if(typeof count!=='number')throw new Error('Public API unavailable.');
const policy=await read('/rest/v1/rpc/auth_policy',{});
if(policy.member_provider!=='google'||policy.staff_provider!=='github'||policy.anonymous_write!==false)throw new Error('Provider separation is not deployed.');
const settings=await read('/auth/v1/settings');
const missing=[];
if(settings.external?.google!==true)missing.push('Google OAuth');
if(settings.external?.github!==true)missing.push('GitHub OAuth');
const others=Object.entries(settings.external??{}).filter(([provider,enabled])=>enabled===true&&!['google','github'].includes(provider)).map(([provider])=>provider);
if(others.length)missing.push(`disable other sign-in providers: ${others.join(', ')}`);
if(!policy.owner_configured)missing.push('approved GitHub owner allowlist');
const edge=await fetch(`${url}/functions/v1/verify-login`,{method:'POST',headers,body:'{}',signal:AbortSignal.timeout(20000)});
if(edge.status!==401)missing.push('provider verification API must reject unauthenticated requests');
if(missing.length)throw new Error(`Publication blocked: ${missing.join(', ')}.`);
console.log('Google members and allowlisted GitHub staff are configured. Real-provider browser sign-in is still an acceptance step.');
