import { describe, it, expect, afterEach, beforeEach } from 'vitest'
import { prisma } from '../../src/lib/prisma'
import { createCliente, listClientes } from '../../src/server/actions/clientes'
import { setActor, ADMIN_ACTOR } from '../helpers/actor'

describe('createCliente', () => {
  beforeEach(() => setActor(ADMIN_ACTOR))
  afterEach(async () => {
    await prisma.cliente.deleteMany({ where: { nombre: { startsWith: 'Test Cliente' } } })
  })

  it('creates a cliente and it appears in listClientes', async () => {
    await createCliente({ nombre: 'Test Cliente ACME', logoUrl: 'https://res.cloudinary.com/demo/logo.png' })
    const clientes = await listClientes()
    expect(clientes.some((c) => c.nombre === 'Test Cliente ACME')).toBe(true)
  })

  it('throws when nombre is empty', async () => {
    await expect(createCliente({ nombre: '  ' })).rejects.toThrow('El nombre del cliente es obligatorio')
  })
})
