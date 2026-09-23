import {readFile,writeFile,access} from 'node:fs/promises';
const config=JSON.parse(await readFile(new URL('../config/firebase.public.json',import.meta.url),'utf8'));
const target=new URL('../.env.local',import.meta.url);
try{await access(target);console.log('.env.local already exists; not overwritten.');process.exit(0);}catch{}
const names={VITE_FIREBASE_API_KEY:'apiKey',VITE_FIREBASE_AUTH_DOMAIN:'authDomain',VITE_FIREBASE_PROJECT_ID:'projectId',VITE_FIREBASE_APP_ID:'appId',VITE_FIREBASE_MESSAGING_SENDER_ID:'messagingSenderId'};
await writeFile(target,Object.entries(names).map(([name,key])=>`${name}=${config[key]}`).join('\n')+'\nVITE_BASE_PATH=/\n',{mode:0o600});
console.log('Created .env.local with browser-public Firebase configuration. No private credentials are included.');
