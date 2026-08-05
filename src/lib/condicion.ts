import type { Condicion } from '@prisma/client'

const SEVERITY: Record<Condicion, number> = {
  BUENO: 0,
  ACEPTABLE: 1,
  INSATISFACTORIO: 2,
  INACEPTABLE: 3,
}

export const CONDICION_COLORS: Record<Condicion, string> = {
  BUENO: '#22c55e',
  ACEPTABLE: '#eab308',
  INSATISFACTORIO: '#f97316',
  INACEPTABLE: '#ef4444',
}

export function computeDelta(tempIzquierda: number, tempDerecha: number): number {
  return Math.round(Math.abs(tempIzquierda - tempDerecha) * 10) / 10
}

export function worstCondicion(condiciones: Condicion[]): Condicion {
  if (condiciones.length === 0) {
    throw new Error('worstCondicion requires at least one condicion')
  }
  return condiciones.reduce((worst, current) =>
    SEVERITY[current] > SEVERITY[worst] ? current : worst
  )
}
