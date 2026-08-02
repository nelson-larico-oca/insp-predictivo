export function computeTag(area: string, nombre: string): string {
  return `${area.trim()}${nombre.trim()}`.toUpperCase()
}
