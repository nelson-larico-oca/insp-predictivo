import { describe, it, expect, afterEach } from 'vitest'
import { prisma } from '../../src/lib/prisma'
import { createFaja, getFajaById, updateFajaImagenes } from '../../src/server/actions/fajas'

async function makeClienteYContratista() {
  const cliente = await prisma.cliente.create({ data: { nombre: 'Test Cliente Faja' } })
  const contratista = await prisma.contratista.create({ data: { nombre: 'Test Contratista Faja' } })
  return { cliente, contratista }
}

describe('createFaja', () => {
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
      createdByUserId: 'test-user',
    })
    expect(faja.tag).toBe('9999CV001')

    const detalle = await getFajaById(faja.id)
    expect(detalle?.poleas).toHaveLength(5)
    expect(detalle?.poleas.map((p) => p.numero)).toEqual([1, 2, 3, 4, 5])
    expect(detalle?.criterios).toHaveLength(4)
    expect(detalle?.criterios.map((c) => c.nivel).sort()).toEqual(
      ['CRITICO', 'NORMAL', 'PRECAUCION', 'TOLERABLE'].sort()
    )
  })

  it('stores the criteriosImagenUrl when provided and allows updating it later', async () => {
    const { cliente, contratista } = await makeClienteYContratista()
    const faja = await createFaja({
      clienteId: cliente.id,
      contratistaId: contratista.id,
      area: '9999',
      nombre: 'CV003',
      lugar: 'MOQUEGUA',
      numeroPoleas: 1,
      criteriosImagenUrl: 'https://res.cloudinary.com/demo/criterios-v1.jpg',
      createdByUserId: 'test-user',
    })
    expect(faja.criteriosImagenUrl).toBe('https://res.cloudinary.com/demo/criterios-v1.jpg')

    const updated = await updateFajaImagenes(faja.id, {
      criteriosImagenUrl: 'https://res.cloudinary.com/demo/criterios-v2.jpg',
    })
    expect(updated.criteriosImagenUrl).toBe('https://res.cloudinary.com/demo/criterios-v2.jpg')
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
      createdByUserId: 'test-user',
    }
    await createFaja(input)
    await expect(createFaja(input)).rejects.toThrow('Ya existe una faja con el tag 9999CV002')
  })
})
