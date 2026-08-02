import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import bcrypt from 'bcryptjs'
import { prisma } from '../../src/lib/prisma'
import { verifyCredentials } from '../../src/lib/auth'

describe('verifyCredentials', () => {
  beforeAll(async () => {
    const passwordHash = await bcrypt.hash('secret123', 10)
    await prisma.user.create({
      data: { name: 'Test User', email: 'auth-test@example.com', passwordHash },
    })
  })

  afterAll(async () => {
    await prisma.user.deleteMany({ where: { email: 'auth-test@example.com' } })
    await prisma.$disconnect()
  })

  it('returns the user when credentials are correct', async () => {
    const result = await verifyCredentials('auth-test@example.com', 'secret123')
    expect(result?.email).toBe('auth-test@example.com')
  })

  it('returns null when the password is wrong', async () => {
    expect(await verifyCredentials('auth-test@example.com', 'wrong')).toBeNull()
  })

  it('returns null when the user does not exist', async () => {
    expect(await verifyCredentials('nobody@example.com', 'secret123')).toBeNull()
  })
})
