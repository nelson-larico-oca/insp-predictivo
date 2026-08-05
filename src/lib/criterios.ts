import type { Condicion } from '@prisma/client'

export const NIVELES_CRITERIO: Condicion[] = ['BUENO', 'ACEPTABLE', 'INSATISFACTORIO', 'INACEPTABLE']

export interface CriterioValores {
  nivel: Condicion
  tempMin: number
  tempMax: number
  deltaMin: number
  deltaMax: number
}

export const DEFAULT_CRITERIOS: CriterioValores[] = [
  { nivel: 'BUENO', tempMin: 45, tempMax: 54, deltaMin: 0, deltaMax: 5 },
  { nivel: 'ACEPTABLE', tempMin: 55, tempMax: 68, deltaMin: 5, deltaMax: 8 },
  { nivel: 'INSATISFACTORIO', tempMin: 68, tempMax: 90, deltaMin: 8, deltaMax: 999 },
  { nivel: 'INACEPTABLE', tempMin: 90, tempMax: 999, deltaMin: 0, deltaMax: 999 },
]
