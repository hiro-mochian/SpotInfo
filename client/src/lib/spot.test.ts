import {describe,it,expect} from 'vitest';
import {createSpotSchema,updateSpotSchema} from './validation';
import {inTokyoView,filterAndSortSpots,categoriesFor,type Spot} from './spots';
import {normaliseBasePath,routerBasename,routeHref} from './routes';
const input={name:'上野公園',area:'東京',category:'公園',note:'ひとこと',lat:'35.7',lng:'139.7'};
const row=(id:number,name:string,lat=35.7,lng=139.7,category='公園'):Spot=>({id,name,area:'東京',category,note:'test',lat,lng,created_at:'2026-09-22T00:00:00Z'});
describe('validation',()=>{
 it('converts valid coordinates and trims text',()=>{expect(createSpotSchema.parse({...input,name:' 上野公園 '}).name).toBe('上野公園');expect(createSpotSchema.parse(input).lat).toBe(35.7);});
 it.each([-91,91,Infinity,NaN])('rejects latitude %s',lat=>expect(createSpotSchema.safeParse({...input,lat}).success).toBe(false));
 it.each([-181,181,Infinity,NaN])('rejects longitude %s',lng=>expect(createSpotSchema.safeParse({...input,lng}).success).toBe(false));
 it('rejects empty and overlong names',()=>{expect(createSpotSchema.safeParse({...input,name:'  '}).success).toBe(false);expect(createSpotSchema.safeParse({...input,name:'x'.repeat(201)}).success).toBe(false);});
 it('rejects overlong notes',()=>expect(createSpotSchema.safeParse({...input,note:'x'.repeat(2001)}).success).toBe(false));
 it('does not pass an owner id to RPC',()=>expect(createSpotSchema.parse({...input,owner_id:'attacker'})).not.toHaveProperty('owner_id'));
 it('keeps edit separate from coordinate changes',()=>{const result=updateSpotSchema.parse({...input,id:1});expect(result).not.toHaveProperty('lat');expect(result).not.toHaveProperty('lng');});
 it('rejects invalid IDs',()=>expect(updateSpotSchema.safeParse({...input,id:-1}).success).toBe(false));
});
describe('atlas',()=>{
 it('distinguishes Tokyo and off-map',()=>{expect(inTokyoView(35.7,139.7)).toBe(true);expect(inTokyoView(42.3,-83.2)).toBe(false);});
 it('sorts Tokyo first without mutating data',()=>{const rows=[row(1,'Ford',42.3,-83.2),row(2,'上野')];expect(filterAndSortSpots(rows,'all','').map(r=>r.id)).toEqual([2,1]);expect(rows[0].id).toBe(1);});
 it('searches case-insensitively and independently of map search',()=>expect(filterAndSortSpots([row(1,'Ford'),row(2,'上野')],'all','FORD').map(r=>r.id)).toEqual([1]));
 it('filters categories and unique names',()=>{const rows=[row(1,'a'),row(2,'b'),row(3,'c',35,139,'温泉')];expect(categoriesFor(rows)).toEqual(['公園','温泉']);expect(filterAndSortSpots(rows,'温泉','')).toHaveLength(1);});
});
describe('Pages routes',()=>{
 it('normalises the project base',()=>expect(normaliseBasePath('SpotInfo')).toBe('/SpotInfo/'));
 it('generates root and my routes',()=>{expect(routeHref('/SpotInfo/','/')).toBe('/SpotInfo/');expect(routeHref('/SpotInfo/','/my')).toBe('/SpotInfo/my');});
 it('supports local development',()=>{expect(routerBasename('/')).toBeUndefined();expect(routerBasename('/SpotInfo/')).toBe('/SpotInfo');expect(routeHref('/','/my')).toBe('/my');});
});
