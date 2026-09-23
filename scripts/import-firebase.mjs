// One-time migration. Uses the signed-in official Firebase CLI account, never a
// private key in the repository. Dry-run unless --apply is supplied.
import {createRequire} from 'node:module';
import {execFileSync} from 'node:child_process';
import {readFile,writeFile} from 'node:fs/promises';
import {join} from 'node:path';
import {randomUUID} from 'node:crypto';
import {initializeApp,deleteApp} from 'firebase-admin/app';
import {getAuth} from 'firebase-admin/auth';
const require=createRequire(import.meta.url);
const cliRoot=join(execFileSync('npm',['root','-g'],{encoding:'utf8'}).trim(),'firebase-tools');
const cliAuth=require(join(cliRoot,'lib/auth.js'));
const PROJECT='spot-info';
const OWNER_EMAIL='hiro.mochian@gmail.com';
const input=process.argv.find(x=>x.startsWith('--input='))?.slice(8);
if(!input)throw new Error('Usage: node scripts/import-firebase.mjs --input=/private/export.json [--apply]');
const apply=process.argv.includes('--apply');
const account=cliAuth.getGlobalDefaultAccount();
if(account?.user?.email!==OWNER_EMAIL)throw new Error('Sign in with the approved owner using firebase login');
async function token(){return cliAuth.getAccessToken(account.tokens.refresh_token,['openid','email','https://www.googleapis.com/auth/cloud-platform','https://www.googleapis.com/auth/firebase']);}
async function request(url,method='GET',body){
 const t=await token();
 const res=await fetch(url,{method,headers:{Authorization:`Bearer ${t.access_token}`,'Content-Type':'application/json'},body:body===undefined?undefined:JSON.stringify(body)});
 const result=await res.json();
 if(!res.ok)throw new Error(`HTTP ${res.status}: ${result.error?.message??'request failed'}`);
 return result;
}
const source=JSON.parse(await readFile(input,'utf8'))[0].migration_export;
if(!Array.isArray(source.spots)||!Array.isArray(source.google_users))throw new Error('Invalid export structure');
for(const u of source.google_users){if(!u.google_sub||!u.email||u.email_verified!==true)throw new Error('Unverified source Google identity: manual review required');}
const owner=source.google_users.find(u=>u.email===OWNER_EMAIL);
if(!owner)throw new Error('Approved owner must have a verified source Google identity');
// Match the approved owner to Google's authenticated userinfo response as well.
const google=await request('https://openidconnect.googleapis.com/v1/userinfo');
if(google.email!==OWNER_EMAIL||google.email_verified!==true||google.sub!==owner.google_sub)throw new Error('Approved owner does not match verified Google identity');
const app=initializeApp({projectId:PROJECT,credential:{getAccessToken:async()=>{const t=await token();return {access_token:t.access_token,expires_in:3600};}}});
const auth=getAuth(app);
const mappings=new Map();
let imported=0,owners=0;
try{
 for(const u of source.google_users){
  let existing;
  try{existing=await auth.getUserByProviderUid('google.com',u.google_sub);}catch(e){if(e.code!=='auth/user-not-found')throw e;}
  if(existing?.email!==undefined&&existing.email!==u.email)throw new Error('Existing provider identity/email mismatch');
  const uid=existing?.uid??randomUUID();
  mappings.set(u.supabase_uid,uid);
  if(!existing&&apply){
   const result=await auth.importUsers([{uid,email:u.email,emailVerified:true,providerData:[{uid:u.google_sub,email:u.email,providerId:'google.com'}]}]);
   if(result.failureCount)throw new Error(result.errors[0].error.message);
   imported++;
  }
  if(u.email===OWNER_EMAIL){
   if(apply)await auth.setCustomUserClaims(uid,{...(existing?.customClaims??{}),role:'owner'});
   owners++;
  }
 }
 const base=`projects/${PROJECT}/databases/(default)/documents`;
 const writes=[];
 for(const s of source.spots){
  if(s.owner_id&&!mappings.has(s.owner_id))throw new Error('Spot ownership cannot be mapped to a verified Google identity');
  const id=String(s.id);
  if(!/^\d+$/.test(id))throw new Error('Invalid legacy record ID');
  const fields={};
  for(const k of ['name','area','category','note']){if(typeof s[k]!=='string')throw new Error('Invalid spot text');fields[k]={stringValue:s[k]};}
  for(const k of ['lat','lng']){const n=Number(s[k]);if(!Number.isFinite(n))throw new Error('Invalid coordinates');fields[k]={doubleValue:n};}
  fields.createdAt={timestampValue:new Date(s.created_at).toISOString()};
  const privateFields={uid:s.owner_id?{stringValue:mappings.get(s.owner_id)}:{nullValue:null},legacySource:{stringValue:'SpotInfo-before-Firebase'}};
  if(s.legacy_owner_id!=null)privateFields.legacyOwnerId={stringValue:String(s.legacy_owner_id)};
  for(const [collection,record] of [['spots',fields],['spotOwners',privateFields]]){
   // Do not overwrite already migrated or user-edited data, even on accidental reruns.
   writes.push({update:{name:`${base}/${collection}/${id}`,fields:record},currentDocument:{exists:false}});
  }
 }
 if(apply)await request(`https://firestore.googleapis.com/v1/${base}:commit`,'POST',{writes});
 const summary={project:PROJECT,applied:apply,sourceSpots:source.spots.length,sourceGoogleUsers:source.google_users.length,importedUsers:imported,approvedOwners:owners,unassignedLegacySpots:source.spots.filter(s=>!s.owner_id).length};
 console.log(JSON.stringify(summary,null,2));
 const report=process.argv.find(x=>x.startsWith('--report='))?.slice(9);
 if(report)await writeFile(report,JSON.stringify(summary,null,2)+'\n');
}finally{await deleteApp(app);}
