import { describe, it, expect, afterEach } from 'vitest'
import { prisma } from '../../src/lib/prisma'
import { createContratista, listContratistas } from '../../src/server/actions/contratistas'

describe('createContratista', () => {
  afterEach(async () => {
    await prisma.contratista.deleteMany({ where: { nombre: { startsWith: 'Test Contratista' } } })
  })

  it('creates a contratista and it appears in listContratistas', async () => {
    await createContratista({ nombre: 'Test Contratista OCA', logoUrl: 'https://res.cloudinary.com/demo/logo2.png' })
    const contratistas = await listContratistas()
    expect(contratistas.some((c) => c.nombre === 'Test Contratista OCA')).toBe(true)
  })

  it('throws when nombre is empty', async () => {
    await expect(createContratista({ nombre: '' })).rejects.toThrow('El nombre del contratista es obligatorio')
  })
})
