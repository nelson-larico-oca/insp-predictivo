import { describe, it, expect } from 'vitest'
import { computeTag } from '../../src/lib/tag'

describe('computeTag', () => {
  it('joins area and nombre uppercased with no separator', () => {
    expect(computeTag('3220', 'CV001')).toBe('3220CV001')
  })

  it('trims whitespace and uppercases lowercase input', () => {
    expect(computeTag(' 3220 ', ' cv001 ')).toBe('3220CV001')
  })
})
