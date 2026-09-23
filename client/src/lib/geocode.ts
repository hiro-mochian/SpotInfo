export type GeocodedPlace={lat:number;lng:number;label:string};
const cache=new Map<string,GeocodedPlace|null>();
let lastRequestAt=0;
let sequence=Promise.resolve();
export function parsePhoton(data:unknown):GeocodedPlace|null{
 const first=(data as {features?:Array<{geometry?:{coordinates?:number[]};properties?:{name?:string;city?:string;country?:string}}>})?.features?.[0];
 const coords=first?.geometry?.coordinates;
 if(!coords||!Number.isFinite(coords[0])||!Number.isFinite(coords[1])||Math.abs(coords[0])>180||Math.abs(coords[1])>90)return null;
 return {lng:coords[0],lat:coords[1],label:[first?.properties?.name,first?.properties?.city,first?.properties?.country].filter(Boolean).join(', ')};
}
// Public Photon is best-effort and for reasonable use only. Switch to a
// private/commercial Photon-compatible endpoint before scaling up.
export function searchPlace(query:string):Promise<GeocodedPlace|null>{
 const key=query.trim().toLocaleLowerCase();
 if(!key)return Promise.resolve(null);
 if(cache.has(key))return Promise.resolve(cache.get(key)??null);
 const task=sequence.then(async()=>{
  if(cache.has(key))return cache.get(key)??null;
  const wait=Math.max(0,1200-(Date.now()-lastRequestAt));
  if(wait)await new Promise(resolve=>setTimeout(resolve,wait));
  lastRequestAt=Date.now();
  const url=new URL(import.meta.env.VITE_GEOCODING_URL?.trim()||'https://photon.komoot.io/api/');
  url.searchParams.set('q',query.trim());url.searchParams.set('limit','1');
  const response=await fetch(url,{headers:{Accept:'application/json'},signal:AbortSignal.timeout(15000)});
  if(!response.ok)throw new Error(`地名検索に失敗しました (${response.status})。`);
  const result=parsePhoton(await response.json());
  if(cache.size>=100)cache.delete(cache.keys().next().value!);
  cache.set(key,result);return result;
 });
 sequence=task.then(()=>undefined,()=>undefined);
 return task;
}
