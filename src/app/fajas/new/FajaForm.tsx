'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import type { Cliente, Contratista } from '@prisma/client'
import { ImageUploader } from '@/components/ImageUploader'
import { createFaja } from '@/server/actions/fajas'
import { computeTag } from '@/lib/tag'

interface FajaFormProps {
  clientes: Cliente[]
  contratistas: Contratista[]
  currentUserId: string
}

export function FajaForm({ clientes, contratistas, currentUserId }: FajaFormProps) {
  const router = useRouter()
  const [clienteId, setClienteId] = useState(clientes[0]?.id ?? '')
  const [contratistaId, setContratistaId] = useState(contratistas[0]?.id ?? '')
  const [area, setArea] = useState('')
  const [nombre, setNombre] = useState('')
  const [lugar, setLugar] = useState('')
  const [descripcion, setDescripcion] = useState('')
  const [numeroPoleas, setNumeroPoleas] = useState(5)
  const [esquemaUrl, setEsquemaUrl] = useState<string>()
  const [error, setError] = useState<string | null>(null)

  const tagPreview = useMemo(() => (area && nombre ? computeTag(area, nombre) : ''), [area, nombre])

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    setError(null)
    try {
      const faja = await createFaja({
        clienteId,
        contratistaId,
        area,
        nombre,
        lugar,
        descripcion: descripcion || undefined,
        numeroPoleas,
        esquemaUrl,
        createdByUserId: currentUserId,
      })
      router.push(`/fajas/${faja.id}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al crear la faja')
    }
  }

  if (clientes.length === 0 || contratistas.length === 0) {
    return (
      <p className="rounded border border-yellow-400 bg-yellow-50 p-3 text-sm text-yellow-800">
        Primero debes crear al menos un{' '}
        <a href="/clientes" className="underline">cliente</a> y un{' '}
        <a href="/contratistas" className="underline">contratista</a>.
      </p>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3 rounded border bg-white p-4">
      <div className="grid grid-cols-2 gap-3">
        <select className="rounded border px-3 py-2" value={clienteId} onChange={(e) => setClienteId(e.target.value)} required>
          {clientes.map((c) => (
            <option key={c.id} value={c.id}>{c.nombre}</option>
          ))}
        </select>
        <select className="rounded border px-3 py-2" value={contratistaId} onChange={(e) => setContratistaId(e.target.value)} required>
          {contratistas.map((c) => (
            <option key={c.id} value={c.id}>{c.nombre}</option>
          ))}
        </select>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <input className="rounded border px-3 py-2" placeholder="Área (ej. 3220)" value={area} onChange={(e) => setArea(e.target.value)} required />
        <input className="rounded border px-3 py-2" placeholder="Nombre (ej. CV001)" value={nombre} onChange={(e) => setNombre(e.target.value)} required />
      </div>
      {tagPreview && <p className="text-sm text-gray-500">Tag: <strong>{tagPreview}</strong></p>}
      <input className="w-full rounded border px-3 py-2" placeholder="Lugar" value={lugar} onChange={(e) => setLugar(e.target.value)} required />
      <input className="w-full rounded border px-3 py-2" placeholder="Descripción (opcional)" value={descripcion} onChange={(e) => setDescripcion(e.target.value)} />
      <label className="block text-sm font-medium">
        Número de poleas
        <input
          type="number"
          min={1}
          className="mt-1 w-full rounded border px-3 py-2"
          value={numeroPoleas}
          onChange={(e) => setNumeroPoleas(Number(e.target.value))}
          required
        />
      </label>
      <ImageUploader folder="insp-predictivo/esquemas" value={esquemaUrl} onUploaded={setEsquemaUrl} label="Esquema de ubicación de poleas" />
      {error && <p className="text-sm text-red-600">{error}</p>}
      <button type="submit" className="rounded bg-blue-600 px-3 py-2 text-white">Crear faja</button>
    </form>
  )
}
