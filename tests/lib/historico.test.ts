import { describe, it, expect, afterEach } from 'vitest'
import { prisma } from '../../src/lib/prisma'
import { createFaja } from '../../src/server/actions/fajas'
import { createReporte } from '../../src/server/actions/reportes'
import { getHistoricoByFaja } from '../../src/lib/historico'

describe('getHistoricoByFaja', () => {
  afterEach(async () => {
    await prisma.faja.deleteMany({ where: { tag: { startsWith: '6666' } } })
    await prisma.cliente.deleteMany({ where: { nombre: 'Test Cliente Historico' } })
    await prisma.contratista.deleteMany({ where: { nombre: 'Test Contratista Historico' } })
  })

  it('returns lecturas per polea ordered by fecha with delta computed', async () => {
    const cliente = await prisma.cliente.create({ data: { nombre: 'Test Cliente Historico' } })
    const contratista = await prisma.contratista.create({ data: { nombre: 'Test Contratista Historico' } })
    const faja = await createFaja({
      clienteId: cliente.id,
      contratistaId: contratista.id,
      area: '6666',
      nombre: 'CV001',
      lugar: 'MOQUEGUA',
      numeroPoleas: 1,
      createdByUserId: 'test-user',
    })
    const polea = await prisma.polea.findFirstOrThrow({ where: { fajaId: faja.id } })

    const lecturaInput = {
      poleaId: polea.id,
      fotoIzquierdaUrl: 'https://example.com/i.jpg',
      fotoDerechaUrl: 'https://example.com/d.jpg',
      condicion: 'NORMAL' as const,
      diagnosticoTexto: 'texto',
    }
    await createReporte({
      fajaId: faja.id, fecha: new Date('2026-02-17'), especialista: 'X', supervisor: 'Y',
      numeroAvisoSAP: '1', createdByUserId: 'test-user',
      lecturas: [{ ...lecturaInput, tempIzquierda: 22.8, tempDerecha: 26.2 }],
    })
    await createReporte({
      fajaId: faja.id, fecha: new Date('2026-08-02'), especialista: 'X', supervisor: 'Y',
      numeroAvisoSAP: '2', createdByUserId: 'test-user',
      lecturas: [{ ...lecturaInput, tempIzquierda: 32.4, tempDerecha: 22.5 }],
    })

    const historico = await getHistoricoByFaja(faja.id)
    expect(historico).toHaveLength(1)
    expect(historico[0].lecturas).toHaveLength(2)
    expect(historico[0].lecturas[0].fecha.toISOString()).toContain('2026-02-17')
    expect(historico[0].lecturas[1].delta).toBeCloseTo(9.9)
  })
})
