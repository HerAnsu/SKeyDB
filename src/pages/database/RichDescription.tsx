import {lazy, Suspense} from 'react'

import type {FullStats} from '@/domain/awakener-source-schema'
import type {ResolvedAwakenerDatabaseReferenceLayer} from '@/domain/awakeners-database-view'
import {buildDatabaseRichDescriptionText} from '@/domain/database-rich-text'
import type {DescribedRecord} from '@/domain/description-records'

import {useDatabasePopoverControllerContext} from './database-popover-context'
import type {DatabaseRichTextContentProps} from './DatabaseRichTextContent'
import {renderTextWithBreaks} from './font-scale'

const DatabaseRichTextContent = lazy(() =>
  import('./DatabaseRichTextContent').then((module) => ({default: module.DatabaseRichTextContent})),
)

interface RichDescriptionProps {
  text?: string
  record?: DescribedRecord
  keywordFooterText?: string
  descriptionRank?: number
  descriptionMaxRank?: number
  referenceLayer: ResolvedAwakenerDatabaseReferenceLayer | null
  skillLevel?: number
  stats?: FullStats | null
  showVisibleScaling?: boolean
  showTagIcons?: boolean
}

export function RichDescription({
  text,
  record,
  keywordFooterText,
  descriptionRank,
  descriptionMaxRank,
  referenceLayer,
  skillLevel = 1,
  stats = null,
  showVisibleScaling = true,
  showTagIcons = true,
}: RichDescriptionProps) {
  const popoverController = useDatabasePopoverControllerContext()
  const fallbackText = buildDatabaseRichDescriptionText(
    record?.descriptionTemplate ?? text,
    keywordFooterText,
  )
  const contentProps: DatabaseRichTextContentProps = {
    text,
    record,
    keywordFooterText,
    descriptionRank,
    descriptionMaxRank,
    referenceLayer,
    showVisibleScaling,
    showTagIcons,
    skillLevel,
    stats,
    variant: 'inline',
    onMechanicClick: (overlay, event) => {
      popoverController?.openRootOverlay(overlay, event)
    },
    onSkillClick: (name, event) => {
      popoverController?.openRootReferenceByName(name, event)
    },
  }

  return (
    <Suspense fallback={fallbackText ? <span>{renderTextWithBreaks(fallbackText)}</span> : null}>
      <DatabaseRichTextContent {...contentProps} />
    </Suspense>
  )
}
