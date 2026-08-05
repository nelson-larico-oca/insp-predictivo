import { describe, it, expect, afterEach, beforeEach } from 'vitest'
import { prisma } from '../../src/lib/prisma'
import { createFaja, listFajas, getFajaById, deleteFaja } from '../../src/server/actions/fajas'
import { DEFAULT_CRITERIOS } from '../../src/lib/criterios'
import { setActor, ADMIN_ACTOR, supervisorActor } from '../helpers/actor'

describe('contratista isolation', () => {
  beforeEach(() => setActor(ADMIN_ACTOR))
  afterEach(async () => {
    await prisma.faja.deleteMany({ where: { tag: { startsWith: '6666' } } })
    await prisma.cliente.deleteMany({ where: { nombre: 'Test Cliente Isolation' } })
    await prisma.contratista.deleteMany({ where: { nombre: { startsWith: 'Test Contratista Isolation' } } })
  })

  it('a supervisor of contratista A cannot see or delete a faja of contratista B', async () => {
    const cliente = await prisma.cliente.create({ data: { nombre: 'Test Cliente Isolation' } })
    const contratistaA = await prisma.contratista.create({ data: { nombre: 'Test Contratista Isolation A' } })
    const contratistaB = await prisma.contratista.create({ data: { nombre: 'Test Contratista Isolation B' } })

    const fajaB = await createFaja({
      clienteId: cliente.id,
      contratistaId: contratistaB.id,
      area: '6666',
      nombre: 'CV001',
      lugar: 'MOQUEGUA',
      numeroPoleas: 1,
      criterios: DEFAULT_CRITERIOS,
    })

    setActor(supervisorActor(contratistaA.id))

    const fajas = await listFajas()
    expect(fajas.some((f) => f.id === fajaB.id)).toBe(false)

    expect(await getFajaById(fajaB.id)).toBeNull()
    await expect(deleteFaja(fajaB.id)).rejects.toThrow('No autorizado para eliminar esta faja')
  })
})
