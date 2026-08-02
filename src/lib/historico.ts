import { prisma } from './prisma'
import { computeDelta } from './condicion'
import type { Condicion } from '@prisma/client'

export interface LecturaHistorica {
  fecha: Date
  tempIzquierda: number
  tempDerecha: number
  delta: number
  condicion: Condicion
}

export interface PoleaHistorico {
  poleaId: string
  numero: number
  tipo: string | null
  lecturas: LecturaHistorica[]
}

export async function getHistoricoByFaja(fajaId: string): Promise<PoleaHistorico[]> {
  const poleas = await prisma.polea.findMany({
    where: { fajaId },
    orderBy: { numero: 'asc' },
    include: {
      lecturas: {
        include: { reporte: true },
        orderBy: { reporte: { fecha: 'asc' } },
      },
    },
  })

  return poleas.map((polea) => ({
    poleaId: polea.id,
    numero: polea.numero,
    tipo: polea.tipo,
    lecturas: polea.lecturas.map((lectura) => ({
      fecha: lectura.reporte.fecha,
      tempIzquierda: lectura.tempIzquierda,
      tempDerecha: lectura.tempDerecha,
      delta: computeDelta(lectura.tempIzquierda, lectura.tempDerecha),
      condicion: lectura.condicion,
    })),
  }))
}
