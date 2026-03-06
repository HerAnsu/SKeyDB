import awakenersLite from '@/data/awakeners-lite.json';
import {z} from 'zod';

const rawAwakenersSchema = z.array(
  z.object({
    id: z.number().int().positive(),
    name: z.string().trim().min(1),
    faction: z.string().trim().min(1),
    realm: z.string().trim().min(1),
    rarity: z.string().trim().min(1).optional(),
    aliases: z.array(z.string().trim().min(1)).optional(),
  }),
);

export interface Awakener {
  readonly id: number;
  readonly name: string;
  readonly faction: string;
  readonly realm: string;
  readonly rarity?: string;
  readonly aliases: readonly string[];
}

const parsedAwakeners = rawAwakenersSchema
  .parse(awakenersLite)
  .map((awakener): Awakener => {
    const aliases = Array.from(
      new Set([awakener.name, ...(awakener.aliases ?? [])]),
    );

    return {
      id: awakener.id,
      name: awakener.name,
      faction: awakener.faction,
      realm: awakener.realm,
      rarity: awakener.rarity,
      aliases,
    };
  });

export function getAwakeners(): Awakener[] {
  return parsedAwakeners;
}
