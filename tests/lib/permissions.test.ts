import { describe, it, expect } from 'vitest'
import {
  canAssignRole,
  canCreateFaja,
  canCreateReporte,
  canDeleteReporte,
  canManageFaja,
  canManageUser,
  canReadFaja,
  fajaScopeWhere,
  type ActorUser,
} from '../../src/lib/permissions'

const ADMIN: ActorUser = { id: 'admin', role: 'ADMIN', contratistaId: null, clienteId: null }
const SUPERVISOR_A: ActorUser = { id: 'sup-a', role: 'SUPERVISOR', contratistaId: 'contratista-a', clienteId: null }
const INSPECTOR_A: ActorUser = { id: 'insp-a', role: 'INSPECTOR', contratistaId: 'contratista-a', clienteId: null }
const SUPERVISOR_B: ActorUser = { id: 'sup-b', role: 'SUPERVISOR', contratistaId: 'contratista-b', clienteId: null }
const CLIENTE_X: ActorUser = { id: 'cli-x', role: 'CLIENTE', contratistaId: null, clienteId: 'cliente-x' }

const FAJA_A = { contratistaId: 'contratista-a', clienteId: 'cliente-x' }
const FAJA_B = { contratistaId: 'contratista-b', clienteId: 'cliente-y' }

describe('fajaScopeWhere', () => {
  it('admin has no restriction', () => {
    expect(fajaScopeWhere(ADMIN)).toEqual({})
  })
  it('contratista staff is scoped to their contratistaId', () => {
    expect(fajaScopeWhere(SUPERVISOR_A)).toEqual({ contratistaId: 'contratista-a' })
    expect(fajaScopeWhere(INSPECTOR_A)).toEqual({ contratistaId: 'contratista-a' })
  })
  it('cliente is scoped to their clienteId', () => {
    expect(fajaScopeWhere(CLIENTE_X)).toEqual({ clienteId: 'cliente-x' })
  })
})

describe('canReadFaja', () => {
  it('admin reads everything', () => {
    expect(canReadFaja(ADMIN, FAJA_B)).toBe(true)
  })
  it('contratista staff only reads their own contratista', () => {
    expect(canReadFaja(SUPERVISOR_A, FAJA_A)).toBe(true)
    expect(canReadFaja(SUPERVISOR_A, FAJA_B)).toBe(false)
    expect(canReadFaja(INSPECTOR_A, FAJA_A)).toBe(true)
    expect(canReadFaja(INSPECTOR_A, FAJA_B)).toBe(false)
  })
  it('cliente only reads fajas of their own cliente', () => {
    expect(canReadFaja(CLIENTE_X, FAJA_A)).toBe(true)
    expect(canReadFaja(CLIENTE_X, FAJA_B)).toBe(false)
  })
})

describe('canManageFaja / canDeleteReporte', () => {
  it('admin and the owning supervisor can manage; inspector and cliente cannot', () => {
    expect(canManageFaja(ADMIN, FAJA_A)).toBe(true)
    expect(canManageFaja(SUPERVISOR_A, FAJA_A)).toBe(true)
    expect(canManageFaja(SUPERVISOR_A, FAJA_B)).toBe(false)
    expect(canManageFaja(INSPECTOR_A, FAJA_A)).toBe(false)
    expect(canManageFaja(CLIENTE_X, FAJA_A)).toBe(false)
  })
})

describe('canCreateFaja', () => {
  it('only admin and supervisor can create fajas', () => {
    expect(canCreateFaja(ADMIN)).toBe(true)
    expect(canCreateFaja(SUPERVISOR_A)).toBe(true)
    expect(canCreateFaja(INSPECTOR_A)).toBe(false)
    expect(canCreateFaja(CLIENTE_X)).toBe(false)
  })
})

describe('canCreateReporte', () => {
  it('admin and contratista staff of the owning contratista can report; cliente cannot', () => {
    expect(canCreateReporte(ADMIN, FAJA_A)).toBe(true)
    expect(canCreateReporte(SUPERVISOR_A, FAJA_A)).toBe(true)
    expect(canCreateReporte(INSPECTOR_A, FAJA_A)).toBe(true)
    expect(canCreateReporte(SUPERVISOR_B, FAJA_A)).toBe(false)
    expect(canCreateReporte(CLIENTE_X, FAJA_A)).toBe(false)
  })
})

describe('canManageUser', () => {
  it('admin manages everyone', () => {
    expect(canManageUser(ADMIN, { role: 'SUPERVISOR', contratistaId: 'contratista-a' })).toBe(true)
    expect(canManageUser(ADMIN, { role: 'CLIENTE', contratistaId: null })).toBe(true)
  })
  it('supervisor manages only supervisor/inspector of their own contratista', () => {
    expect(canManageUser(SUPERVISOR_A, { role: 'INSPECTOR', contratistaId: 'contratista-a' })).toBe(true)
    expect(canManageUser(SUPERVISOR_A, { role: 'SUPERVISOR', contratistaId: 'contratista-a' })).toBe(true)
    expect(canManageUser(SUPERVISOR_A, { role: 'INSPECTOR', contratistaId: 'contratista-b' })).toBe(false)
    expect(canManageUser(SUPERVISOR_A, { role: 'ADMIN', contratistaId: null })).toBe(false)
    expect(canManageUser(SUPERVISOR_A, { role: 'CLIENTE', contratistaId: null })).toBe(false)
  })
  it('inspector and cliente manage nobody', () => {
    expect(canManageUser(INSPECTOR_A, { role: 'INSPECTOR', contratistaId: 'contratista-a' })).toBe(false)
    expect(canManageUser(CLIENTE_X, { role: 'CLIENTE', contratistaId: null })).toBe(false)
  })
})

describe('canAssignRole', () => {
  it('admin can assign any role', () => {
    expect(canAssignRole(ADMIN, 'ADMIN')).toBe(true)
    expect(canAssignRole(ADMIN, 'CLIENTE')).toBe(true)
  })
  it('supervisor can only assign contratista-staff roles', () => {
    expect(canAssignRole(SUPERVISOR_A, 'SUPERVISOR')).toBe(true)
    expect(canAssignRole(SUPERVISOR_A, 'INSPECTOR')).toBe(true)
    expect(canAssignRole(SUPERVISOR_A, 'ADMIN')).toBe(false)
    expect(canAssignRole(SUPERVISOR_A, 'CLIENTE')).toBe(false)
  })
})
