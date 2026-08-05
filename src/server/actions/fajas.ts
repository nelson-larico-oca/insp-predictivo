'use server'

import { prisma } from '@/lib/prisma'
import { computeTag } from '@/lib/tag'
import { safeRevalidatePath } from '@/lib/safeRevalidate'
import { requireUser } from '@/lib/session'
import { canCreateFaja, canManageFaja, canReadFaja, fajaScopeWhere } from '@/lib/permissions'
import { CONDICION_COLORS } from '@/lib/condicion'
import { NIVELES_CRITERIO, type CriterioValores } from '@/lib/criterios'
import type { Faja } from '@prisma/client'

export interface CreateFajaInput {
  clienteId: string
  contratistaId: string
  area: string
  nombre: string
  lugar: string
  descripcion?: string
  numeroPoleas: number
  esquemaUrl?: string
  criterios: CriterioValores[]
}

function validarCriterios(criterios: CriterioValores[]) {
  if (criterios.length !== NIVELES_CRITERIO.length) {
    throw new Error('Debes definir los 4 niveles de criterios de aceptación')
  }
  const niveles = new Set(criterios.map((c) => c.nivel))
  for (const nivel of NIVELES_CRITERIO) {
    if (!niveles.has(nivel)) {
      throw new Error(`Falta el nivel ${nivel} en los criterios de aceptación`)
    }
  }
  for (const c of criterios) {
    if (c.tempMin > c.tempMax) {
      throw new Error(`El nivel ${c.nivel}: la temperatura mínima no puede ser mayor que la máxima`)
    }
    if (c.deltaMin > c.deltaMax) {
      throw new Error(`El nivel ${c.nivel}: el delta mínimo no puede ser mayor que el máximo`)
    }
  }
}

export async function createFaja(input: CreateFajaInput): Promise<Faja> {
  const user = await requireUser()
  if (!canCreateFaja(user)) {
    throw new Error('No autorizado para crear fajas')
  }
  if (input.numeroPoleas < 1) {
    throw new Error('El número de poleas debe ser al menos 1')
  }
  validarCriterios(input.criterios)

  // Never trust the contratista from the client: a supervisor is pinned to their own.
  let contratistaId = input.contratistaId
  if (user.role === 'SUPERVISOR') {
    if (!user.contratistaId) throw new Error('Tu cuenta no tiene una contratista asignada')
    contratistaId = user.contratistaId
  }

  const tag = computeTag(input.area, input.nombre)

  const existing = await prisma.faja.findUnique({ where: { tag } })
  if (existing) {
    throw new Error(`Ya existe una faja con el tag ${tag}`)
  }

  const faja = await prisma.faja.create({
    data: {
      clienteId: input.clienteId,
      contratistaId,
      area: input.area.trim(),
      nombre: input.nombre.trim(),
      tag,
      lugar: input.lugar.trim(),
      descripcion: input.descripcion,
      numeroPoleas: input.numeroPoleas,
      esquemaUrl: input.esquemaUrl,
      createdByUserId: user.id,
      poleas: {
        create: Array.from({ length: input.numeroPoleas }, (_, index) => ({ numero: index + 1 })),
      },
      criterios: {
        create: input.criterios.map((c) => ({ ...c, color: CONDICION_COLORS[c.nivel] })),
      },
    },
  })
  safeRevalidatePath('/fajas')
  return faja
}

export async function listFajas() {
  const user = await requireUser()
  return prisma.faja.findMany({
    where: fajaScopeWhere(user),
    include: { cliente: true, contratista: true },
    orderBy: { createdAt: 'desc' },
  })
}

export async function getFajaById(id: string) {
  const user = await requireUser()
  const faja = await prisma.faja.findUnique({
    where: { id },
    include: {
      cliente: true,
      contratista: true,
      poleas: { orderBy: { numero: 'asc' } },
      criterios: true,
      reportes: { orderBy: { fecha: 'desc' } },
    },
  })
  if (!faja || !canReadFaja(user, faja)) return null
  return faja
}

export type FajaConDetalle = NonNullable<Awaited<ReturnType<typeof getFajaById>>>

export async function updatePoleaTipo(poleaId: string, tipo: string) {
  const user = await requireUser()
  const polea = await prisma.polea.findUniqueOrThrow({ where: { id: poleaId }, include: { faja: true } })
  if (!canManageFaja(user, polea.faja)) {
    throw new Error('No autorizado para editar esta faja')
  }
  const updated = await prisma.polea.update({ where: { id: poleaId }, data: { tipo } })
  safeRevalidatePath(`/fajas/${updated.fajaId}`)
  return updated
}

export async function updateFajaImagenes(
  fajaId: string,
  data: { esquemaUrl?: string }
) {
  const user = await requireUser()
  const faja = await prisma.faja.findUniqueOrThrow({ where: { id: fajaId } })
  if (!canManageFaja(user, faja)) {
    throw new Error('No autorizado para editar esta faja')
  }
  const updated = await prisma.faja.update({ where: { id: fajaId }, data })
  safeRevalidatePath(`/fajas/${fajaId}`)
  return updated
}

export async function updateCriterio(
  criterioId: string,
  data: { tempMin: number; tempMax: number; deltaMin: number; deltaMax: number }
) {
  const user = await requireUser()
  const criterio = await prisma.criterioAceptacion.findUniqueOrThrow({
    where: { id: criterioId },
    include: { faja: true },
  })
  if (!canManageFaja(user, criterio.faja)) {
    throw new Error('No autorizado para editar esta faja')
  }
  const updated = await prisma.criterioAceptacion.update({ where: { id: criterioId }, data })
  safeRevalidatePath(`/fajas/${updated.fajaId}`)
  return updated
}

export async function updateNumeroPoleas(fajaId: string, numeroPoleas: number) {
  const user = await requireUser()
  const faja = await prisma.faja.findUniqueOrThrow({ where: { id: fajaId } })
  if (!canManageFaja(user, faja)) {
    throw new Error('No autorizado para editar esta faja')
  }

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
  const user = await requireUser()
  const faja = await prisma.faja.findUniqueOrThrow({ where: { id: fajaId } })
  if (!canReadFaja(user, faja)) {
    throw new Error('No autorizado')
  }
  return prisma.reporte.count({ where: { fajaId } })
}

export async function deleteFaja(fajaId: string): Promise<void> {
  const user = await requireUser()
  const faja = await prisma.faja.findUniqueOrThrow({ where: { id: fajaId } })
  if (!canManageFaja(user, faja)) {
    throw new Error('No autorizado para eliminar esta faja')
  }
  await prisma.faja.delete({ where: { id: fajaId } })
  safeRevalidatePath('/fajas')
}
