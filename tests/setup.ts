import { vi } from 'vitest'
import type { ActorUser } from '../src/lib/permissions'

export const mockActor: { current: ActorUser | null } = { current: null }

vi.mock('@/lib/session', () => ({
  getCurrentUser: async () => mockActor.current,
  requireUser: async () => {
    if (!mockActor.current) throw new Error('No autorizado: inicia sesión')
    return mockActor.current
  },
  requireAdmin: async () => {
    if (!mockActor.current) throw new Error('No autorizado: inicia sesión')
    if (mockActor.current.role !== 'ADMIN') {
      throw new Error('No autorizado: se requiere rol de administrador')
    }
    return mockActor.current
  },
}))
