import { describe, it, expect, beforeAll } from 'vitest'

beforeAll(() => {
  process.env.PRINT_TOKEN_SECRET = 'test-secret'
})

describe('printToken', () => {
  it('generates a token that verifies for the same reporteId and rejects others', async () => {
    const { generatePrintToken, verifyPrintToken } = await import('../../src/lib/printToken')
    const token = generatePrintToken('reporte-123')
    expect(verifyPrintToken('reporte-123', token)).toBe(true)
    expect(verifyPrintToken('reporte-456', token)).toBe(false)
    expect(verifyPrintToken('reporte-123', 'tampered')).toBe(false)
  })
})
