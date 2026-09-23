import {it,expect} from 'vitest';
import {parsePhoton} from './geocode';
it('reads GeoJSON longitude before latitude',()=>expect(parsePhoton({features:[{geometry:{coordinates:[139.7,35.7]},properties:{name:'東京'}}]})).toEqual({lat:35.7,lng:139.7,label:'東京'}));
it('returns null for no matches',()=>expect(parsePhoton({features:[]})).toBeNull());
it('rejects invalid coordinates',()=>expect(parsePhoton({features:[{geometry:{coordinates:[139,999]}}]})).toBeNull());
