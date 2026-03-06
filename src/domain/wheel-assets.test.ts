import {getWheelAssetById} from '@/domain/wheel-assets';
import {describe, expect, it} from 'vitest';

describe('getWheelAssetById', () => {
  it('resolves wheel asset by compact id', () => {
    expect(getWheelAssetById('SR19')).toEqual(expect.any(String));
  });
});
