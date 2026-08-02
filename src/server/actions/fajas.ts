'use server'

import { prisma } from '@/lib/prisma'
import { computeTag } from '@/lib/tag'
import { safeRevalidatePath } from '@/lib/safeRevalidate'
import type { Faja } from '@prisma/client'

const DEFAULT_CRITERIOS = [
  { nivel: 'NORMAL' as const, tempMin: 45, tempMax: 54, deltaMin: 0, deltaMax: 5, color: '#22c55e' },
  { nivel: 'TOLERABLE' as const, tempMin: 55, tempMax: 68, deltaMin: 5, deltaMax: 8, color: '#eab308' },
  { nivel: 'PRECAUCION' as const, tempMin: 68, tempMax: 90, deltaMin: 8, deltaMax: 999, color: '#f97316' },
  { nivel: 'CRITICO' as const, tempMin: 90, tempMax: 999, deltaMin: 0, deltaMax: 999, color: '#ef4444' },
]

export interface CreateFajaInput {
  clienteId: string
  contratistaId: string
  area: string
  nombre: string
  lugar: string
  descripcion?: string
  numeroPoleas: number
  esquemaUrl?: string
  criteriosImagenUrl?: string
  createdByUserId: string
}

export async function createFaja(input: CreateFajaInput): Promise<Faja> {
  if (input.numeroPoleas < 1) {
    throw new Error('El número de poleas debe ser al menos 1')
  }
  const tag = computeTag(input.area, input.nombre)

  const existing = await prisma.faja.findUnique({ where: { tag } })
  if (existing) {
    throw new Error(`Ya existe una faja con el tag ${tag}`)
  }

  const faja = await prisma.faja.create({
    data: {
      clienteId: input.clienteId,
      contratistaId: input.contratistaId,
      area: input.area.trim(),
      nombre: input.nombre.trim(),
      tag,
      lugar: input.lugar.trim(),
      descripcion: input.descripcion,
      numeroPoleas: input.numeroPoleas,
      esquemaUrl: input.esquemaUrl,
      criteriosImagenUrl: input.criteriosImagenUrl,
      createdByUserId: input.createdByUserId,
      poleas: {
        create: Array.from({ length: input.numeroPoleas }, (_, index) => ({ numero: index + 1 })),
      },
      criterios: { create: DEFAULT_CRITERIOS },
    },
  })
  safeRevalidatePath('/fajas')
  return faja
}

export async function listFajas() {
  return prisma.faja.findMany({
    include: { cliente: true, contratista: true },
    orderBy: { createdAt: 'desc' },
  })
}

export async function getFajaById(id: string) {
  return prisma.faja.findUnique({
    where: { id },
    include: {
      cliente: true,
      contratista: true,
      poleas: { orderBy: { numero: 'asc' } },
      criterios: true,
      reportes: { orderBy: { fecha: 'desc' } },
    },
  })
}

export type FajaConDetalle = NonNullable<Awaited<ReturnType<typeof getFajaById>>>

export async function updatePoleaTipo(poleaId: string, tipo: string) {
  const updated = await prisma.polea.update({ where: { id: poleaId }, data: { tipo } })
  safeRevalidatePath(`/fajas/${updated.fajaId}`)
  return updated
}

export async function updateFajaImagenes(
  fajaId: string,
  data: { esquemaUrl?: string; criteriosImagenUrl?: string }
) {
  const updated = await prisma.faja.update({ where: { id: fajaId }, data })
  safeRevalidatePath(`/fajas/${fajaId}`)
  return updated
}

export async function updateCriterio(
  criterioId: string,
  data: { tempMin: number; tempMax: number; deltaMin: number; deltaMax: number }
) {
  const updated = await prisma.criterioAceptacion.update({ where: { id: criterioId }, data })
  safeRevalidatePath(`/fajas/${updated.fajaId}`)
  return updated
}

export async function updateNumeroPoleas(fajaId: string, numeroPoleas: number) {
  const poleasConLecturas = await prisma.polea.findMany({
    where: { fajaId, lecturas: { some: {} } },
    orderBy: { numero: 'desc' },
    take: 1,
  })
  const maxPoleaConLecturas = poleasConLecturas[0]?.numero ?? 0
  if (numeroPoleas < maxPoleaConLecturas) {
    throw new Error('No se puede reducir el número de poleas por debajo de las que ya tienen reportes')
  }

  const existentes = await prisma.polea.findMany({ where: { fajaId }, orderBy: { numero: 'asc' } })
  if (numeroPoleas > existentes.length) {
    await prisma.polea.createMany({
      data: Array.from({ length: numeroPoleas - existentes.length }, (_, index) => ({
        fajaId,
        numero: existentes.length + index + 1,
      })),
    })
  }

  const updated = await prisma.faja.update({ where: { id: fajaId }, data: { numeroPoleas } })
  safeRevalidatePath(`/fajas/${fajaId}`)
  return updated
}

export async function countReportesByFaja(fajaId: string): Promise<number> {
  return prisma.reporte.count({ where: { fajaId } })
}

export async function deleteFaja(fajaId: string): Promise<void> {
  await prisma.faja.delete({ where: { id: fajaId } })
  safeRevalidatePath('/fajas')
}
