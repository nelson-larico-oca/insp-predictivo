import { describe, it, expect, afterEach, beforeEach } from 'vitest'
import { prisma } from '../../src/lib/prisma'
import { createFaja, getFajaById } from '../../src/server/actions/fajas'
import { DEFAULT_CRITERIOS } from '../../src/lib/criterios'
import { setActor, ADMIN_ACTOR } from '../helpers/actor'

async function makeClienteYContratista() {
  const cliente = await prisma.cliente.create({ data: { nombre: 'Test Cliente Faja' } })
  const contratista = await prisma.contratista.create({ data: { nombre: 'Test Contratista Faja' } })
  return { cliente, contratista }
}

describe('createFaja', () => {
  beforeEach(() => setActor(ADMIN_ACTOR))
  afterEach(async () => {
    await prisma.faja.deleteMany({ where: { tag: { startsWith: '9999' } } })
    await prisma.cliente.deleteMany({ where: { nombre: 'Test Cliente Faja' } })
    await prisma.contratista.deleteMany({ where: { nombre: 'Test Contratista Faja' } })
  })

  it('creates a faja with its tag, 5 poleas and 4 default criterios', async () => {
    const { cliente, contratista } = await makeClienteYContratista()
    const faja = await createFaja({
      clienteId: cliente.id,
      contratistaId: contratista.id,
      area: '9999',
      nombre: 'CV001',
      lugar: 'MOQUEGUA',
      numeroPoleas: 5,
      criterios: DEFAULT_CRITERIOS,
    })
    expect(faja.tag).toBe('9999CV001')

    const detalle = await getFajaById(faja.id)
    expect(detalle?.poleas).toHaveLength(5)
    expect(detalle?.poleas.map((p) => p.numero)).toEqual([1, 2, 3, 4, 5])
    expect(detalle?.criterios).toHaveLength(4)
    expect(detalle?.criterios.map((c) => c.nivel).sort()).toEqual(
      ['ACEPTABLE', 'BUENO', 'INACEPTABLE', 'INSATISFACTORIO'].sort()
    )
  })

  it('stores the manually entered temp/delta ranges per nivel', async () => {
    const { cliente, contratista } = await makeClienteYContratista()
    const criterios = DEFAULT_CRITERIOS.map((c) => (c.nivel === 'INACEPTABLE' ? { ...c, tempMin: 95 } : c))
    const faja = await createFaja({
      clienteId: cliente.id,
      contratistaId: contratista.id,
      area: '9999',
      nombre: 'CV003',
      lugar: 'MOQUEGUA',
      numeroPoleas: 1,
      criterios,
    })

    const detalle = await getFajaById(faja.id)
    const inaceptable = detalle?.criterios.find((c) => c.nivel === 'INACEPTABLE')
    expect(inaceptable?.tempMin).toBe(95)
  })

  it('rejects criterios missing one of the 4 required niveles', async () => {
    const { cliente, contratista } = await makeClienteYContratista()
    await expect(
      createFaja({
        clienteId: cliente.id,
        contratistaId: contratista.id,
        area: '9999',
        nombre: 'CV004',
        lugar: 'MOQUEGUA',
        numeroPoleas: 1,
        criterios: DEFAULT_CRITERIOS.filter((c) => c.nivel !== 'INACEPTABLE'),
      })
    ).rejects.toThrow('Debes definir los 4 niveles de criterios de aceptación')
  })

  it('rejects a duplicate tag with a friendly error', async () => {
    const { cliente, contratista } = await makeClienteYContratista()
    const input = {
      clienteId: cliente.id,
      contratistaId: contratista.id,
      area: '9999',
      nombre: 'CV002',
      lugar: 'MOQUEGUA',
      numeroPoleas: 2,
      criterios: DEFAULT_CRITERIOS,
    }
    await createFaja(input)
    await expect(createFaja(input)).rejects.toThrow('Ya existe una faja con el tag 9999CV002')
  })
})
