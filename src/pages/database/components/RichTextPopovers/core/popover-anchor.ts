export type PopoverAnchorElement = HTMLElement

export type PopoverAnchorSnapshot = Readonly<{
  anchorElement: PopoverAnchorElement
  anchorRect: DOMRect
}>

export function snapshotPopoverAnchor(
  anchorElement: PopoverAnchorElement | null | undefined,
): PopoverAnchorSnapshot | null {
  if (!(anchorElement instanceof HTMLElement) || !anchorElement.isConnected) {
    return null
  }

  return {
    anchorElement,
    anchorRect: anchorElement.getBoundingClientRect(),
  }
}
