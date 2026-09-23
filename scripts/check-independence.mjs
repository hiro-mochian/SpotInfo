import {readdir,readFile} from 'node:fs/promises';
import {join} from 'node:path';
const forbidden=[/https?:\/\/[^\s"'`<>]*(?:manus\.(?:space|computer|im|com)|forge\.)/i,/VITE_(?:OAUTH_PORTAL_URL|APP_ID|FORGE_API_URL|FORGE_API_KEY)/,/BUILT_IN_FORGE_API/,/manus-runtime|@manus\//i];
const roots=['client','supabase/functions','.github','dist'];
let count=0;const failures=[];
async function walk(path){for(const entry of await readdir(path,{withFileTypes:true})){const p=join(path,entry.name);if(entry.isDirectory())await walk(p);else if(/\.(?:[cm]?[jt]sx?|html|css|json|ya?ml)$/.test(p)){count++;const text=await readFile(p,'utf8');if(forbidden.some(re=>re.test(text)))failures.push(p);}}}
for(const root of roots)await walk(root);
for(const p of ['package.json','vite.config.ts']){count++;const text=await readFile(p,'utf8');if(forbidden.some(re=>re.test(text)))failures.push(p);}
if(failures.length)throw new Error(`Platform-specific runtime dependency found in: ${failures.join(', ')}`);
console.log(`PASS: ${count} runtime/build files contain none of the prohibited platform endpoints, credentials, or SDK patterns. Archived source and historical documents are not executable dependencies.`);
