'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { deleteUser, resetUserPassword, updateUser, type SafeUser } from '@/server/actions/users'
import type { Role } from '@prisma/client'

export function UserRow({ user, isSelf }: { user: SafeUser; isSelf: boolean }) {
  const router = useRouter()
  const [editing, setEditing] = useState(false)
  const [resetting, setResetting] = useState(false)
  const [confirmingDelete, setConfirmingDelete] = useState(false)
  const [name, setName] = useState(user.name)
  const [email, setEmail] = useState(user.email)
  const [role, setRole] = useState<Role>(user.role)
  const [newPassword, setNewPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  async function handleSaveEdit() {
    setError(null)
    setBusy(true)
    try {
      await updateUser(user.id, { name, email, role })
      setEditing(false)
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al actualizar')
    } finally {
      setBusy(false)
    }
  }

  async function handleResetPassword() {
    setError(null)
    setBusy(true)
    try {
      await resetUserPassword(user.id, newPassword)
      setNewPassword('')
      setResetting(false)
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al resetear contraseña')
    } finally {
      setBusy(false)
    }
  }

  async function handleDelete() {
    setError(null)
    setBusy(true)
    try {
      await deleteUser(user.id)
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al eliminar')
      setBusy(false)
    }
  }

  if (editing) {
    return (
      <tr className="border-b align-top">
        <td className="px-4 py-3" colSpan={5}>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-4 sm:items-center">
            <input className="rounded border px-2 py-1" value={name} onChange={(e) => setName(e.target.value)} />
            <input className="rounded border px-2 py-1" value={email} onChange={(e) => setEmail(e.target.value)} />
            <select className="rounded border px-2 py-1" value={role} onChange={(e) => setRole(e.target.value as Role)}>
              <option value="USER">Usuario</option>
              <option value="ADMIN">Administrador</option>
            </select>
            <div className="flex gap-2">
              <button
                onClick={handleSaveEdit}
                disabled={busy}
                className="rounded bg-blue-600 px-3 py-1.5 text-sm text-white disabled:opacity-50"
              >
                Guardar
              </button>
              <button onClick={() => setEditing(false)} className="rounded border px-3 py-1.5 text-sm">
                Cancelar
              </button>
            </div>
          </div>
          {error && <p className="mt-2 text-sm text-red-700">{error}</p>}
        </td>
      </tr>
    )
  }

  return (
    <tr className="border-b">
      <td className="px-4 py-3">{user.name}</td>
      <td className="px-4 py-3">{user.email}</td>
      <td className="px-4 py-3">
        <span
          className={`rounded-full px-2 py-0.5 text-xs font-medium ${
            user.role === 'ADMIN' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'
          }`}
        >
          {user.role === 'ADMIN' ? 'Administrador' : 'Usuario'}
        </span>
      </td>
      <td className="px-4 py-3 text-gray-500">{new Date(user.createdAt).toLocaleDateString('es-PE')}</td>
      <td className="px-4 py-3">
        <div className="flex flex-wrap justify-end gap-2">
          <button onClick={() => setEditing(true)} className="rounded border px-2 py-1 text-xs hover:bg-gray-50">
            Editar
          </button>
          <button onClick={() => setResetting((v) => !v)} className="rounded border px-2 py-1 text-xs hover:bg-gray-50">
            Resetear contraseña
          </button>
          {!isSelf && (
            <button
              onClick={() => setConfirmingDelete((v) => !v)}
              className="rounded border border-red-300 px-2 py-1 text-xs text-red-600 hover:bg-red-50"
            >
              Eliminar
            </button>
          )}
        </div>
        {resetting && (
          <div className="mt-2 flex flex-wrap items-center justify-end gap-2">
            <input
              type="password"
              placeholder="Nueva contraseña"
              className="rounded border px-2 py-1 text-sm"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              minLength={8}
            />
            <button
              onClick={handleResetPassword}
              disabled={busy || newPassword.length < 8}
              className="rounded bg-blue-600 px-3 py-1.5 text-sm text-white disabled:opacity-50"
            >
              Confirmar
            </button>
          </div>
        )}
        {confirmingDelete && (
          <div className="mt-2 flex flex-wrap items-center justify-end gap-2 text-sm text-red-700">
            <span>¿Eliminar a {user.name}?</span>
            <button onClick={handleDelete} disabled={busy} className="rounded bg-red-600 px-3 py-1.5 text-white disabled:opacity-50">
              Sí, eliminar
            </button>
            <button onClick={() => setConfirmingDelete(false)} className="rounded border px-3 py-1.5">
              Cancelar
            </button>
          </div>
        )}
        {error && <p className="mt-2 text-right text-xs text-red-700">{error}</p>}
      </td>
    </tr>
  )
}
