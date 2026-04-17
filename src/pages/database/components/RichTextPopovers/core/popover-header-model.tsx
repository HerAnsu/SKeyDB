import type {CSSProperties, ReactNode} from 'react'

export type PopoverHeaderAction = Readonly<{
  label: string
  onClick: () => void
  title?: string
}>

export type PopoverHeaderModel = Readonly<{
  icon?: ReactNode
  eyebrow?: ReactNode
  title: ReactNode
  accent?: ReactNode
  action?: PopoverHeaderAction
  eyebrowClassName?: string
  eyebrowStyle?: CSSProperties
  titleClassName?: string
  titleStyle?: CSSProperties
  accentClassName?: string
  accentStyle?: CSSProperties
}>
