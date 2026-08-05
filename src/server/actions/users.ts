'use server'

import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/auth'
import { safeRevalidatePath } from '@/lib/safeRevalidate'
import type { Role, User } from '@prisma/client'

export type SafeUser = Omit<User, 'passwordHash'>

const USER_SELECT = {
  id: true,
  name: true,
  email: true,
  role: true,
  createdAt: true,
} as const

export async function listUsers(): Promise<SafeUser[]> {
  await requireAdmin()
  return prisma.user.findMany({ select: USER_SELECT, orderBy: { createdAt: 'asc' } })
}

export interface CreateUserInput {
  name: string
  email: string
  password: string
  role: Role
}

export async function createUser(input: CreateUserInput): Promise<SafeUser> {
  await requireAdmin()
  const name = input.name.trim()
  const email = input.email.trim().toLowerCase()
  if (!name) throw new Error('El nombre es obligatorio')
  if (!email) throw new Error('El email es obligatorio')
  if (input.password.length < 8) throw new Error('La contraseña debe tener al menos 8 caracteres')

  const existing = await prisma.user.findUnique({ where: { email } })
  if (existing) throw new Error(`Ya existe un usuario con el email ${email}`)

  const passwordHash = await bcrypt.hash(input.password, 10)
  const user = await prisma.user.create({
    data: { name, email, passwordHash, role: input.role },
    select: USER_SELECT,
  })
  safeRevalidatePath('/admin')
  return user
}

export interface UpdateUserInput {
  name: string
  email: string
  role: Role
}

export async function updateUser(userId: string, input: UpdateUserInput): Promise<SafeUser> {
  const admin = await requireAdmin()
  const name = input.name.trim()
  const email = input.email.trim().toLowerCase()
  if (!name) throw new Error('El nombre es obligatorio')
  if (!email) throw new Error('El email es obligatorio')
  if (admin.id === userId && input.role !== 'ADMIN') {
    throw new Error('No puedes quitarte tu propio rol de administrador')
  }

  const user = await prisma.user.update({
    where: { id: userId },
    data: { name, email, role: input.role },
    select: USER_SELECT,
  })
  safeRevalidatePath('/admin')
  return user
}

export async function resetUserPassword(userId: string, newPassword: string): Promise<void> {
  await requireAdmin()
  if (newPassword.length < 8) throw new Error('La contraseña debe tener al menos 8 caracteres')
  const passwordHash = await bcrypt.hash(newPassword, 10)
  await prisma.user.update({ where: { id: userId }, data: { passwordHash } })
  safeRevalidatePath('/admin')
}

export async function deleteUser(userId: string): Promise<void> {
  const admin = await requireAdmin()
  if (admin.id === userId) {
    throw new Error('No puedes eliminar tu propia cuenta')
  }
  await prisma.user.delete({ where: { id: userId } })
  safeRevalidatePath('/admin')
}
