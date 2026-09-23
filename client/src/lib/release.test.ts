import {describe,it,expect} from 'vitest';
import {APP_NAME,VERSION,REVISION,RELEASE,IS_BASELINE} from './release';
describe('Spot_Info baseline',()=>{
 it('uses the requested product name',()=>expect(APP_NAME).toBe('Spot_Info'));
 it('maps Version01 revision01 to V01R01',()=>{expect(RELEASE).toBe(`V${String(VERSION).padStart(2,'0')}R${String(REVISION).padStart(2,'0')}`);expect(RELEASE).toBe('V01R01');});
 it('is the designated baseline',()=>expect(IS_BASELINE).toBe(true));
});
