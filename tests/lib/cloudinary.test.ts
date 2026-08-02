import { describe, it, expect, beforeAll } from 'vitest'

beforeAll(() => {
  process.env.CLOUDINARY_CLOUD_NAME = 'demo'
  process.env.CLOUDINARY_API_KEY = 'key123'
  process.env.CLOUDINARY_API_SECRET = 'secret123'
})

describe('generateUploadSignature', () => {
  it('returns a signature, timestamp, apiKey, cloudName and folder', async () => {
    const { generateUploadSignature } = await import('../../src/lib/cloudinary')
    const result = generateUploadSignature('insp-predictivo/logos')
    expect(result.folder).toBe('insp-predictivo/logos')
    expect(result.apiKey).toBe('key123')
    expect(result.cloudName).toBe('demo')
    expect(typeof result.signature).toBe('string')
    expect(result.signature.length).toBeGreaterThan(0)
    expect(typeof result.timestamp).toBe('number')
  })
})
