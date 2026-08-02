'use server'

import { prisma } from '@/lib/prisma'
import { safeRevalidatePath } from '@/lib/safeRevalidate'
import type { Cliente } from '@prisma/client'

export interface CreateClienteInput {
  nombre: string
  logoUrl?: string
}

export async function createCliente(input: CreateClienteInput): Promise<Cliente> {
  if (!input.nombre.trim()) {
    throw new Error('El nombre del cliente es obligatorio')
  }
  const cliente = await prisma.cliente.create({
    data: { nombre: input.nombre.trim(), logoUrl: input.logoUrl },
  })
  safeRevalidatePath('/clientes')
  return cliente
}

export async function listClientes(): Promise<Cliente[]> {
  return prisma.cliente.findMany({ orderBy: { nombre: 'asc' } })
}
