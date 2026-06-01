import {render, screen} from '@testing-library/react'
import {describe, expect, it, vi} from 'vitest'

import {DatabasePopoverRoot, type DatabasePopoverRootProps} from './DatabasePopoverRoot'

vi.mock('./DatabasePopoverPortal', () => ({
  DatabasePopoverPortal: () => <div data-testid='database-popover-portal' />,
}))

function makeRootProps(anchorElement: HTMLElement): DatabasePopoverRootProps {
  return {
    anchorElement,
    anchorRect: new DOMRect(10, 10, 20, 20),
    entries: [
      {
        activeEntry: {} as DatabasePopoverRootProps['entries'][number]['activeEntry'],
        key: 'entry',
        layerIndex: 0,
        onClose: vi.fn(),
        onMechanicTokenClick: vi.fn(),
        onSkillTokenClick: vi.fn(),
      },
    ],
    onCloseAll: vi.fn(),
    referenceLayer: null,
    stats: {} as DatabasePopoverRootProps['stats'],
  }
}

describe('DatabasePopoverRoot', () => {
  it('mounts popovers inside the active detail modal shell when the anchor belongs to it', async () => {
    const modalDialog = document.createElement('dialog')
    modalDialog.dataset.detailModalOverlay = ''
    const modalShell = document.createElement('div')
    modalShell.dataset.detailModalShell = ''
    const anchor = document.createElement('button')
    modalShell.append(anchor)
    modalDialog.append(modalShell)
    document.body.append(modalDialog)

    render(<DatabasePopoverRoot {...makeRootProps(anchor)} />)

    const portal = await screen.findByTestId('database-popover-portal')
    expect(portal.closest('[data-detail-modal-shell]')).toBe(modalShell)

    modalDialog.remove()
  })

  it('falls back to the active detail modal overlay when no shell owns the anchor', async () => {
    const modalDialog = document.createElement('dialog')
    modalDialog.dataset.detailModalOverlay = ''
    const anchor = document.createElement('button')
    modalDialog.append(anchor)
    document.body.append(modalDialog)

    render(<DatabasePopoverRoot {...makeRootProps(anchor)} />)

    const portal = await screen.findByTestId('database-popover-portal')
    expect(portal.closest('[data-detail-modal-overlay]')).toBe(modalDialog)

    modalDialog.remove()
  })

  it('mounts page popovers on the document body when no modal owns the anchor', async () => {
    const anchor = document.createElement('button')
    document.body.append(anchor)

    render(<DatabasePopoverRoot {...makeRootProps(anchor)} />)

    const portal = await screen.findByTestId('database-popover-portal')
    expect(portal.parentElement).toBe(document.body)

    anchor.remove()
  })
})
