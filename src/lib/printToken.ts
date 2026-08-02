import { createHmac, timingSafeEqual } from 'node:crypto'

export function generatePrintToken(reporteId: string): string {
  const secret = process.env.PRINT_TOKEN_SECRET as string
  return createHmac('sha256', secret).update(reporteId).digest('hex')
}

export function verifyPrintToken(reporteId: string, token: string): boolean {
  const expected = generatePrintToken(reporteId)
  const expectedBuffer = Buffer.from(expected)
  const tokenBuffer = Buffer.from(token)
  if (expectedBuffer.length !== tokenBuffer.length) return false
  return timingSafeEqual(expectedBuffer, tokenBuffer)
}
