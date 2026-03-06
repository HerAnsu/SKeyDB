import covenantsLite from '@/data/covenants-lite.json';
import {z} from 'zod';

const rawCovenantsSchema = z.array(
  z.object({
    id: z.string().trim().min(1),
    assetId: z.string().trim().min(1),
    name: z.string().trim().min(1),
  }),
);

export interface Covenant {
  readonly id: string;
  readonly assetId: string;
  readonly name: string;
}

const parsedCovenants = rawCovenantsSchema.parse(covenantsLite);

export function getCovenants(): Covenant[] {
  return parsedCovenants;
}
