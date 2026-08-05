import { mockActor } from '../setup'
import type { ActorUser } from '../../src/lib/permissions'

export function setActor(actor: ActorUser | null) {
  mockActor.current = actor
}

export const ADMIN_ACTOR: ActorUser = {
  id: 'test-admin',
  role: 'ADMIN',
  contratistaId: null,
  clienteId: null,
}

export function supervisorActor(contratistaId: string, id = 'test-supervisor'): ActorUser {
  return { id, role: 'SUPERVISOR', contratistaId, clienteId: null }
}

export function inspectorActor(contratistaId: string, id = 'test-inspector'): ActorUser {
  return { id, role: 'INSPECTOR', contratistaId, clienteId: null }
}

export function clienteActor(clienteId: string, id = 'test-cliente'): ActorUser {
  return { id, role: 'CLIENTE', contratistaId: null, clienteId }
}
