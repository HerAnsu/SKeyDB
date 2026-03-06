import type {Awakener} from '@/domain/awakeners';
import type {TeamSlot} from '@/pages/builder/types';

export const awakenersByNameForTests = new Map<string, Awakener>([
  [
    'Goliath',
    {
      id: 1,
      name: 'Goliath',
      faction: 'Hybrid',
      realm: 'AEQUOR',
      aliases: ['Goliath'],
    },
  ],
  [
    'Miryam',
    {
      id: 2,
      name: 'Miryam',
      faction: 'Hybrid',
      realm: 'AEQUOR',
      aliases: ['Miryam'],
    },
  ],
  [
    'Ramona',
    {
      id: 3,
      name: 'Ramona',
      faction: 'The Fools',
      realm: 'CHAOS',
      aliases: ['Ramona'],
    },
  ],
  [
    'Ramona: Timeworn',
    {
      id: 4,
      name: 'Ramona: Timeworn',
      faction: 'The Fools',
      realm: 'CHAOS',
      aliases: ['Ramona: Timeworn'],
    },
  ],
  [
    'Castor',
    {
      id: 5,
      name: 'Castor',
      faction: 'Outlanders',
      realm: 'CARO',
      aliases: ['Castor'],
    },
  ],
  [
    'Helot',
    {
      id: 6,
      name: 'Helot',
      faction: 'Among the Stars',
      realm: 'CHAOS',
      aliases: ['Helot'],
    },
  ],
]);

export function teamSlotsForTests(): readonly TeamSlot[] {
  return [
    {
      slotId: 'slot-1',
      awakenerName: 'Goliath',
      realm: 'AEQUOR',
      level: 60,
      wheels: ['w1', 'w2'] as [string, string],
    },
    {
      slotId: 'slot-2',
      awakenerName: 'Miryam',
      realm: 'AEQUOR',
      level: 60,
      wheels: [null, null] as [null, null],
    },
    {slotId: 'slot-3', wheels: [null, null] as [null, null]},
  ];
}

export function teamSlotsForTestsWithTwoFactions(): readonly TeamSlot[] {
  return [
    {
      slotId: 'slot-1',
      awakenerName: 'Helot',
      realm: 'CHAOS',
      level: 60,
      wheels: ['w1', null] as [string, null],
    },
    {
      slotId: 'slot-2',
      awakenerName: 'Goliath',
      realm: 'AEQUOR',
      level: 60,
      wheels: [null, null] as [null, null],
    },
    {slotId: 'slot-3', wheels: [null, null] as [null, null]},
    {
      slotId: 'slot-4',
      awakenerName: 'Miryam',
      realm: 'AEQUOR',
      level: 60,
      wheels: [null, null] as [null, null],
    },
  ];
}
