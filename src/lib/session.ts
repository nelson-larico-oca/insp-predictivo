import { getServerSession } from 'next-auth'
import { authOptions } from './auth'
import { prisma } from './prisma'
import type { ActorUser } from './permissions'

const ACTOR_SELECT = {
  id: true,
  role: true,
  contratistaId: true,
  clienteId: true,
} as const

/**
 * Reads role/contratistaId/clienteId straight from the database rather than the JWT,
 * so that an admin editing someone's role or contratista takes effect immediately
 * instead of waiting for their token to expire. The JWT is only used for UI decisions.
 */
export async function getCurrentUser(): Promise<ActorUser | null> {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return null
  return prisma.user.findUnique({ where: { id: session.user.id }, select: ACTOR_SELECT })
}

export async function requireUser(): Promise<ActorUser> {
  const user = await getCurrentUser()
  if (!user) throw new Error('No autorizado: inicia sesión')
  return user
}

export async function requireAdmin(): Promise<ActorUser> {
  const user = await requireUser()
  if (user.role !== 'ADMIN') {
    throw new Error('No autorizado: se requiere rol de administrador')
  }
  return user
}
