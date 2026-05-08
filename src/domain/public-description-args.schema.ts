import {z} from 'zod'

const nonEmptyStringSchema = z.string().trim().min(1)

const publicFormulaKeySchema = z.enum(['accountLevel', 'ownedPosseCount', 'wheelRefinementLevel'])

const publicScaledBaseFormulaSchema = z.enum([
  'accountStageGrowth',
  'somaticResearchHpMultiplier',
  'esotericResearchDepth',
  'occultResearchDepth',
])

const publicDescriptionArgStatSchema = z.enum(['ATK', 'DEF', 'CON'])

const publicDescriptionArgSubstatBonusSchema = z
  .object({
    substat: nonEmptyStringSchema,
    multiplier: nonEmptyStringSchema,
    suffix: nonEmptyStringSchema.optional(),
    mode: z.enum(['additive', 'scale_base', 'additive_factor']).optional(),
    baseMultiplier: nonEmptyStringSchema.optional(),
  })
  .strict()

export const publicDescriptionArgSchema = z.discriminatedUnion('kind', [
  z
    .object({
      kind: z.literal('fixed'),
      value: nonEmptyStringSchema.optional(),
      displayFormula: nonEmptyStringSchema.optional(),
      channel: nonEmptyStringSchema.optional(),
      suffix: nonEmptyStringSchema.optional(),
      stat: publicDescriptionArgStatSchema.optional(),
      substatBonus: publicDescriptionArgSubstatBonusSchema.optional(),
    })
    .strict()
    .superRefine((arg, ctx) => {
      if (arg.value || arg.displayFormula || arg.substatBonus) {
        return
      }
      ctx.addIssue({
        code: 'custom',
        message: 'fixed args require value, displayFormula, or substatBonus.',
        path: ['value'],
      })
    }),
  z
    .object({
      kind: z.literal('linear'),
      base: nonEmptyStringSchema,
      gainPerLevel: nonEmptyStringSchema,
      channel: nonEmptyStringSchema.optional(),
      suffix: nonEmptyStringSchema.optional(),
      stat: publicDescriptionArgStatSchema.optional(),
      substatBonus: publicDescriptionArgSubstatBonusSchema.optional(),
    })
    .strict(),
  z
    .object({
      kind: z.literal('scaling'),
      values: z.array(nonEmptyStringSchema).min(1),
      channel: nonEmptyStringSchema.optional(),
      suffix: nonEmptyStringSchema.optional(),
      stat: publicDescriptionArgStatSchema.optional(),
      substatBonus: publicDescriptionArgSubstatBonusSchema.optional(),
    })
    .strict(),
  z.discriminatedUnion('formulaKey', [
    z
      .object({
        kind: z.literal('computed'),
        formulaKey: z.literal('scaled'),
        baseFormula: publicScaledBaseFormulaSchema,
        multiplier: z.number().optional(),
        rounding: z.literal('ceil').optional(),
        inputs: z.array(publicFormulaKeySchema).min(1),
        channel: nonEmptyStringSchema.optional(),
        suffix: nonEmptyStringSchema.optional(),
        stat: publicDescriptionArgStatSchema.optional(),
        substatBonus: publicDescriptionArgSubstatBonusSchema.optional(),
      })
      .strict(),
    z
      .object({
        kind: z.literal('computed'),
        formulaKey: z.literal('wheelRefinementLinear'),
        baseValue: z.number(),
        perLevel: z.number(),
        inputs: z.tuple([z.literal('wheelRefinementLevel')]),
        channel: nonEmptyStringSchema.optional(),
        suffix: nonEmptyStringSchema.optional(),
        stat: publicDescriptionArgStatSchema.optional(),
        substatBonus: publicDescriptionArgSubstatBonusSchema.optional(),
      })
      .strict(),
  ]),
])

export const publicDescriptionArgsSchema = z.record(
  nonEmptyStringSchema,
  publicDescriptionArgSchema,
)

export type PublicFormulaKey = z.infer<typeof publicFormulaKeySchema>
export type PublicScaledBaseFormula = z.infer<typeof publicScaledBaseFormulaSchema>
export type PublicDescriptionArgStat = z.infer<typeof publicDescriptionArgStatSchema>
export type PublicDescriptionArgSubstatBonus = z.infer<
  typeof publicDescriptionArgSubstatBonusSchema
>
export type PublicDescriptionArg = z.infer<typeof publicDescriptionArgSchema>
export type PublicFixedDescriptionArg = Extract<PublicDescriptionArg, {kind: 'fixed'}>
export type PublicLinearDescriptionArg = Extract<PublicDescriptionArg, {kind: 'linear'}>
export type PublicScalingDescriptionArg = Extract<PublicDescriptionArg, {kind: 'scaling'}>
export type PublicComputedDescriptionArg = Extract<PublicDescriptionArg, {kind: 'computed'}>
export type PublicScaledComputedDescriptionArg = Extract<
  PublicComputedDescriptionArg,
  {formulaKey: 'scaled'}
>
export type PublicWheelRefinementLinearComputedDescriptionArg = Extract<
  PublicComputedDescriptionArg,
  {formulaKey: 'wheelRefinementLinear'}
>
