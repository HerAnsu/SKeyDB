import {getCovenantAssetById} from '@/domain/covenant-assets';
import {describe, expect, it} from 'vitest';

describe('getCovenantAssetById', () => {
  it('resolves covenant asset by compact id', () => {
    expect(getCovenantAssetById('001')).toMatch(/Icon_Trinket_001\.png$/);
  });
});
