import {type ReactNode} from 'react'

import {
  DATABASE_POPOVER_SHELL_CLASS,
  DATABASE_POPOVER_SURFACE_STYLE,
} from '@/pages/database/utils/text-styles'

import type {PopoverHeaderModel} from './popover-header-model'
import {PopoverDivider, PopoverHeader} from './PopoverAtoms'

export {PopoverContent, PopoverDivider, PopoverFooter, PopoverHeader} from './PopoverAtoms'

interface PopoverShellProps {
  title?: ReactNode
  icon?: ReactNode
  header?: PopoverHeaderModel
  onClose: () => void
  children: ReactNode
  footer?: ReactNode
  depthIndicator?: ReactNode
  onBack?: () => void
  className?: string
  style?: React.CSSProperties
}

export function PopoverShell({
  title,
  icon,
  header,
  onClose,
  children,
  footer,
  depthIndicator,
  onBack,
  className = '',
  style = {},
}: PopoverShellProps) {
  return (
    <div
      className={`${DATABASE_POPOVER_SHELL_CLASS} px-3.5 py-2.5 ${className}`}
      style={{
        ...DATABASE_POPOVER_SURFACE_STYLE,
        ...style,
      }}
    >
      <PopoverHeader
        depthIndicator={depthIndicator}
        header={header}
        icon={icon}
        onBack={onBack}
        onClose={onClose}
        title={title}
      />
      <PopoverDivider />
      {children}
      {footer}
    </div>
  )
}
