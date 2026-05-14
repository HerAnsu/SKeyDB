export function toDZoneAccessibleText(text: string): string {
  return (
    text
      .replace(/@[1-4]\s*/g, '')
      .replace(/\s+/g, ' ')
      .trim() || text
  )
}
