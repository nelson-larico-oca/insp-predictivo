'use server'

import { prisma } from '@/lib/prisma'
import { worstCondicion } from '@/lib/condicion'
import { safeRevalidatePath } from '@/lib/safeRevalidate'
import type { Condicion, Reporte } from '@prisma/client'

export interface LecturaPoleaInput {
  poleaId: string
  tempIzquierda: number
  tempDerecha: number
  fotoIzquierdaUrl: string
  fotoDerechaUrl: string
  condicion: Condicion
  diagnosticoTexto: string
}

export interface CreateReporteInput {
  fajaId: string
  fecha: Date
  especialista: string
  supervisor: string
  numeroAvisoSAP: string
  observacionGeneral?: string
  createdByUserId: string
  lecturas: LecturaPoleaInput[]
}

export async function createReporte(input: CreateReporteInput): Promise<Reporte> {
  const faja = await prisma.faja.findUniqueOrThrow({ where: { id: input.fajaId } })

  if (input.lecturas.length !== faja.numeroPoleas) {
    throw new Error(`Debes registrar una lectura para cada una de las ${faja.numeroPoleas} poleas de la faja`)
  }
  for (const lectura of input.lecturas) {
    if (!lectura.fotoIzquierdaUrl || !lectura.fotoDerechaUrl) {
      throw new Error('Cada polea requiere las dos fotos de termograma (izquierda y derecha)')
    }
  }
  if (!input.especialista.trim() || !input.supervisor.trim()) {
    throw new Error('Especialista y supervisor son obligatorios')
  }

  const condicionGeneral = worstCondicion(input.lecturas.map((l) => l.condicion))

  const reporte = await prisma.reporte.create({
    data: {
      fajaId: input.fajaId,
      fecha: input.fecha,
      especialista: input.especialista.trim(),
      supervisor: input.supervisor.trim(),
      numeroAvisoSAP: input.numeroAvisoSAP.trim(),
      condicionGeneral,
      observacionGeneral: input.observacionGeneral || 'Equipo sin indicaciones',
      createdByUserId: input.createdByUserId,
      lecturas: { create: input.lecturas },
    },
  })
  safeRevalidatePath(`/fajas/${input.fajaId}`)
  return reporte
}

export async function getReporteById(id: string) {
  return prisma.reporte.findUnique({
    where: { id },
    include: {
      faja: { include: { cliente: true, contratista: true, criterios: true } },
      lecturas: { include: { polea: true }, orderBy: { polea: { numero: 'asc' } } },
    },
  })
}

export type ReporteConDetalle = NonNullable<Awaited<ReturnType<typeof getReporteById>>>

export async function deleteReporte(id: string): Promise<void> {
  const reporte = await prisma.reporte.delete({ where: { id } })
  safeRevalidatePath(`/fajas/${reporte.fajaId}`)
}
