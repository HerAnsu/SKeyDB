import {render, screen} from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import {afterEach, describe, expect, it, vi} from 'vitest'

import {ArtViewerOverlay} from './ArtViewerOverlay'

describe('ArtViewerOverlay', () => {
  const showModalDescriptor = Object.getOwnPropertyDescriptor(
    HTMLDialogElement.prototype,
    'showModal',
  )
  const closeDescriptor = Object.getOwnPropertyDescriptor(HTMLDialogElement.prototype, 'close')

  afterEach(() => {
    restoreDialogMethod('showModal', showModalDescriptor)
    restoreDialogMethod('close', closeDescriptor)
    document.body.style.overflow = ''
    document.body.replaceChildren()
  })

  it('runs mount cleanup and restores previous focus on unmount', () => {
    const previousButton = document.createElement('button')
    document.body.appendChild(previousButton)
    previousButton.focus()
    const cleanup = vi.fn()

    const {unmount} = render(
      <ArtViewerOverlay alt='Large art' onClose={vi.fn()} onMount={() => cleanup} src='/art.png' />,
    )

    expect(screen.getByRole('dialog', {name: 'Large art'})).toBeInTheDocument()

    unmount()

    expect(cleanup).toHaveBeenCalledTimes(1)
    expect(document.activeElement).toBe(previousButton)
  })

  it('closes on native cancel and backdrop click but not image click', async () => {
    const user = userEvent.setup()
    const onClose = vi.fn()

    render(<ArtViewerOverlay alt='Large art' onClose={onClose} src='/art.png' />)

    const dialog = screen.getByRole('dialog', {name: 'Large art'})
    await user.click(screen.getByRole('img', {name: 'Large art'}))
    expect(onClose).not.toHaveBeenCalled()

    await user.click(dialog)
    expect(onClose).toHaveBeenCalledTimes(1)

    const cancelEvent = new Event('cancel', {cancelable: true})
    dialog.dispatchEvent(cancelEvent)

    expect(onClose).toHaveBeenCalledTimes(2)
    expect(cancelEvent.defaultPrevented).toBe(true)
  })
})

function restoreDialogMethod(
  methodName: 'close' | 'showModal',
  descriptor: PropertyDescriptor | undefined,
) {
  if (descriptor) {
    Object.defineProperty(HTMLDialogElement.prototype, methodName, descriptor)
    return
  }

  Reflect.deleteProperty(HTMLDialogElement.prototype, methodName)
}
