import possesLite from '@/data/posses-lite.json';
import {z} from 'zod';

const rawPossesSchema = z.array(
  z.object({
    id: z.string().trim().min(1),
    index: z.number().int().nonnegative(),
    name: z.string().trim().min(1),
    realm: z.string().trim().min(1),
    isFadedLegacy: z.boolean(),
    awakenerName: z.string().trim().min(1).optional(),
  }),
);

export interface Posse {
  readonly id: string;
  readonly index: number;
  readonly name: string;
  readonly realm: string;
  readonly isFadedLegacy: boolean;
  readonly awakenerName?: string;
}

const parsedPosses = rawPossesSchema.parse(possesLite);

export function getPosses(): readonly Posse[] {
  return parsedPosses;
}
