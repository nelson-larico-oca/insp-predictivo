'use server'

import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'
import { requireUser } from '@/lib/session'
import { canAssignRole, canManageUser } from '@/lib/permissions'
import type { ActorUser } from '@/lib/permissions'
import { safeRevalidatePath } from '@/lib/safeRevalidate'
import type { Role, User } from '@prisma/client'

export type SafeUser = Omit<User, 'passwordHash'> & {
  contratista: { nombre: string } | null
  cliente: { nombre: string } | null
}

const USER_SELECT = {
  id: true,
  name: true,
  email: true,
  role: true,
  contratistaId: true,
  clienteId: true,
  createdAt: true,
  contratista: { select: { nombre: true } },
  cliente: { select: { nombre: true } },
} as const

function assertManager(actor: ActorUser) {
  if (actor.role !== 'ADMIN' && actor.role !== 'SUPERVISOR') {
    throw new Error('No autorizado: se requiere rol de administrador o supervisor')
  }
}

/** Derives the contratistaId/clienteId a user of `role` should have, trusting the actor's own scope over client input. */
function resolveScope(
  actor: ActorUser,
  role: Role,
  input: { contratistaId?: string; clienteId?: string }
): { contratistaId: string | null; clienteId: string | null } {
  if (role === 'ADMIN') return { contratistaId: null, clienteId: null }

  if (role === 'CLIENTE') {
    if (!input.clienteId) throw new Error('Debes seleccionar un cliente para este rol')
    return { contratistaId: null, clienteId: input.clienteId }
  }

  // SUPERVISOR / INSPECTOR: a supervisor can only staff their own contratista.
  const contratistaId = actor.role === 'SUPERVISOR' ? actor.contratistaId : input.contratistaId
  if (!contratistaId) throw new Error('Debes seleccionar una contratista para este rol')
  return { contratistaId, clienteId: null }
}

/** Names only, for populating the "supervisor" select on the reporte form — any authenticated user may call this. */
export async function listSupervisoresDeContratista(contratistaId: string): Promise<{ id: string; name: string }[]> {
  await requireUser()
  return prisma.user.findMany({
    where: { contratistaId, role: 'SUPERVISOR' },
    select: { id: true, name: true },
    orderBy: { name: 'asc' },
  })
}

export async function listUsers(): Promise<SafeUser[]> {
  const actor = await requireUser()
  assertManager(actor)
  const where = actor.role === 'ADMIN' ? {} : { contratistaId: actor.contratistaId ?? '__none__' }
  return prisma.user.findMany({ where, select: USER_SELECT, orderBy: { createdAt: 'asc' } })
}

export interface CreateUserInput {
  name: string
  email: string
  password: string
  role: Role
  contratistaId?: string
  clienteId?: string
}

export async function createUser(input: CreateUserInput): Promise<SafeUser> {
  const actor = await requireUser()
  assertManager(actor)
  if (!canAssignRole(actor, input.role)) {
    throw new Error('No autorizado para asignar ese rol')
  }

  const name = input.name.trim()
  const email = input.email.trim().toLowerCase()
  if (!name) throw new Error('El nombre es obligatorio')
  if (!email) throw new Error('El email es obligatorio')
  if (input.password.length < 8) throw new Error('La contraseña debe tener al menos 8 caracteres')

  const scope = resolveScope(actor, input.role, input)

  const existing = await prisma.user.findUnique({ where: { email } })
  if (existing) throw new Error(`Ya existe un usuario con el email ${email}`)

  const passwordHash = await bcrypt.hash(input.password, 10)
  const user = await prisma.user.create({
    data: { name, email, passwordHash, role: input.role, ...scope },
    select: USER_SELECT,
  })
  safeRevalidatePath('/admin')
  return user
}

export interface UpdateUserInput {
  name: string
  email: string
  role: Role
  contratistaId?: string
  clienteId?: string
}

export async function updateUser(userId: string, input: UpdateUserInput): Promise<SafeUser> {
  const actor = await requireUser()
  assertManager(actor)
  const target = await prisma.user.findUniqueOrThrow({ where: { id: userId } })
  if (!canManageUser(actor, target)) throw new Error('No autorizado para editar este usuario')
  if (!canAssignRole(actor, input.role)) throw new Error('No autorizado para asignar ese rol')

  const name = input.name.trim()
  const email = input.email.trim().toLowerCase()
  if (!name) throw new Error('El nombre es obligatorio')
  if (!email) throw new Error('El email es obligatorio')
  if (actor.role === 'ADMIN' && actor.id === userId && input.role !== 'ADMIN') {
    throw new Error('No puedes quitarte tu propio rol de administrador')
  }

  const scope = resolveScope(actor, input.role, input)

  const user = await prisma.user.update({
    where: { id: userId },
    data: { name, email, role: input.role, ...scope },
    select: USER_SELECT,
  })
  safeRevalidatePath('/admin')
  return user
}

export async function resetUserPassword(userId: string, newPassword: string): Promise<void> {
  const actor = await requireUser()
  assertManager(actor)
  const target = await prisma.user.findUniqueOrThrow({ where: { id: userId } })
  if (!canManageUser(actor, target)) throw new Error('No autorizado para editar este usuario')
  if (newPassword.length < 8) throw new Error('La contraseña debe tener al menos 8 caracteres')
  const passwordHash = await bcrypt.hash(newPassword, 10)
  await prisma.user.update({ where: { id: userId }, data: { passwordHash } })
  safeRevalidatePath('/admin')
}

export async function deleteUser(userId: string): Promise<void> {
  const actor = await requireUser()
  assertManager(actor)
  if (actor.id === userId) {
    throw new Error('No puedes eliminar tu propia cuenta')
  }
  const target = await prisma.user.findUniqueOrThrow({ where: { id: userId } })
  if (!canManageUser(actor, target)) throw new Error('No autorizado para eliminar este usuario')
  await prisma.user.delete({ where: { id: userId } })
  safeRevalidatePath('/admin')
}
