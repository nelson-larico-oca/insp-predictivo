import { describe, it, expect } from 'vitest'
import { computeDelta, worstCondicion, CONDICION_COLORS } from '../../src/lib/condicion'

describe('computeDelta', () => {
  it('returns the absolute difference rounded to 1 decimal', () => {
    expect(computeDelta(18.6, 18.1)).toBe(0.5)
    expect(computeDelta(22.5, 32.4)).toBeCloseTo(9.9)
  })
})

describe('worstCondicion', () => {
  it('returns the most severe condicion in the list', () => {
    expect(worstCondicion(['BUENO', 'ACEPTABLE', 'BUENO'])).toBe('ACEPTABLE')
    expect(worstCondicion(['INACEPTABLE', 'BUENO'])).toBe('INACEPTABLE')
    expect(worstCondicion(['BUENO'])).toBe('BUENO')
  })

  it('throws when given an empty list', () => {
    expect(() => worstCondicion([])).toThrow()
  })
})

describe('CONDICION_COLORS', () => {
  it('has an entry for every condicion level', () => {
    expect(Object.keys(CONDICION_COLORS).sort()).toEqual(
      ['ACEPTABLE', 'BUENO', 'INACEPTABLE', 'INSATISFACTORIO'].sort()
    )
  })
})
