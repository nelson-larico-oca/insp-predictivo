import type { Condicion } from '@prisma/client'

const SEVERITY: Record<Condicion, number> = {
  NORMAL: 0,
  TOLERABLE: 1,
  PRECAUCION: 2,
  CRITICO: 3,
}

export const CONDICION_COLORS: Record<Condicion, string> = {
  NORMAL: '#22c55e',
  TOLERABLE: '#eab308',
  PRECAUCION: '#f97316',
  CRITICO: '#ef4444',
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
