import {getAwakeners} from '@/domain/awakeners';
import {getCovenants} from '@/domain/covenants';
import frozenContract from '@/domain/persistence-contract.v1.json';
import {getPosses} from '@/domain/posses';
import {getWheels} from '@/domain/wheels';
import {describe, expect, it} from 'vitest';

interface PersistenceContract {
  version: number;
  awakeners: {name: string; id: number}[];
  wheels: string[];
  posses: {id: string; index: number}[];
  covenants: string[];
}

function buildCurrentContract(): PersistenceContract {
  return {
    version: 1,
    awakeners: getAwakeners()
      .map((awakener) => ({name: awakener.name, id: awakener.id}))
      .sort((left, right) => left.name.localeCompare(right.name)),
    wheels: getWheels().map((wheel) => wheel.id),
    posses: getPosses()
      .map((posse) => ({id: posse.id, index: posse.index}))
      .sort((left, right) => left.id.localeCompare(right.id)),
    covenants: getCovenants().map((covenant) => covenant.id),
  };
}

describe('persistence contract', () => {
  it('keeps stable identifiers and index order used by persistence/import', () => {
    const current = buildCurrentContract();
    const expected = frozenContract as PersistenceContract;

    expect(
      current,
      [
        'Persistence/import contract changed.',
        'If this is intentional, ship a data migration and then update',
        'src/domain/persistence-contract.v1.json in the same PR.',
      ].join(' '),
    ).toEqual(expected);
  });
});
