'use server'

import { prisma } from '@/lib/prisma'
import { safeRevalidatePath } from '@/lib/safeRevalidate'
import { requireAdmin } from '@/lib/session'
import type { Contratista } from '@prisma/client'

export interface CreateContratistaInput {
  nombre: string
  logoUrl?: string
}

export async function createContratista(input: CreateContratistaInput): Promise<Contratista> {
  await requireAdmin()
  if (!input.nombre.trim()) {
    throw new Error('El nombre del contratista es obligatorio')
  }
  const contratista = await prisma.contratista.create({
    data: { nombre: input.nombre.trim(), logoUrl: input.logoUrl },
  })
  safeRevalidatePath('/contratistas')
  return contratista
}

export async function listContratistas(): Promise<Contratista[]> {
  return prisma.contratista.findMany({ orderBy: { nombre: 'asc' } })
}
