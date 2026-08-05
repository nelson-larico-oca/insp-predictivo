'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createUser } from '@/server/actions/users'
import type { Role } from '@prisma/client'

export function CreateUserForm() {
  const router = useRouter()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState<Role>('USER')
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    setError(null)
    setSuccess(false)
    setSubmitting(true)
    try {
      await createUser({ name, email, password, role })
      setName('')
      setEmail('')
      setPassword('')
      setRole('USER')
      setSuccess(true)
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al crear el usuario')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3 rounded border bg-white p-4">
      <h2 className="text-sm font-semibold text-gray-700">Nueva cuenta</h2>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <label className="block text-sm">
          <span className="mb-1 block text-gray-600">Nombre</span>
          <input
            className="w-full rounded border px-3 py-2"
            value={name}
            onChange={(event) => setName(event.target.value)}
            required
          />
        </label>
        <label className="block text-sm">
          <span className="mb-1 block text-gray-600">Email</span>
          <input
            type="email"
            className="w-full rounded border px-3 py-2"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
          />
        </label>
        <label className="block text-sm">
          <span className="mb-1 block text-gray-600">Contraseña</span>
          <input
            type="password"
            className="w-full rounded border px-3 py-2"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            minLength={8}
            required
          />
        </label>
        <label className="block text-sm">
          <span className="mb-1 block text-gray-600">Rol</span>
          <select
            className="w-full rounded border px-3 py-2"
            value={role}
            onChange={(event) => setRole(event.target.value as Role)}
          >
            <option value="USER">Usuario</option>
            <option value="ADMIN">Administrador</option>
          </select>
        </label>
      </div>
      {error && <p className="rounded border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
      {success && (
        <p className="rounded border border-green-300 bg-green-50 px-3 py-2 text-sm text-green-700">
          Cuenta creada correctamente.
        </p>
      )}
      <button
        type="submit"
        disabled={submitting}
        className="w-full rounded bg-blue-600 px-3 py-2 text-white disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
      >
        {submitting ? 'Creando...' : 'Crear cuenta'}
      </button>
    </form>
  )
}
