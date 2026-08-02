'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ImageUploader } from '@/components/ImageUploader'
import { createCliente } from '@/server/actions/clientes'

export function ClienteForm() {
  const router = useRouter()
  const [nombre, setNombre] = useState('')
  const [logoUrl, setLogoUrl] = useState<string>()
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    setError(null)
    try {
      await createCliente({ nombre, logoUrl })
      setNombre('')
      setLogoUrl(undefined)
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al crear el cliente')
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3 rounded border bg-white p-4">
      <input
        className="w-full rounded border px-3 py-2"
        placeholder="Nombre del cliente"
        value={nombre}
        onChange={(event) => setNombre(event.target.value)}
        required
      />
      <ImageUploader folder="insp-predictivo/logos-cliente" value={logoUrl} onUploaded={setLogoUrl} label="Logo" />
      {error && <p className="text-sm text-red-600">{error}</p>}
      <button type="submit" className="rounded bg-blue-600 px-3 py-2 text-white">
        Crear cliente
      </button>
    </form>
  )
}
