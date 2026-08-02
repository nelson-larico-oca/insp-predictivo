'use client'

import { useState } from 'react'

interface ImageUploaderProps {
  folder: string
  value?: string
  onUploaded: (url: string) => void
  label: string
}

const ALLOWED_TYPES = ['image/jpeg', 'image/png']
const MAX_BYTES = 10 * 1024 * 1024

export function ImageUploader({ folder, value, onUploaded, label }: ImageUploaderProps) {
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    if (!file) return
    setError(null)

    if (!ALLOWED_TYPES.includes(file.type)) {
      setError('Solo se permiten imágenes JPG o PNG')
      return
    }
    if (file.size > MAX_BYTES) {
      setError('La imagen no puede superar 10MB')
      return
    }

    setUploading(true)
    try {
      const signResponse = await fetch('/api/cloudinary/sign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ folder }),
      })
      if (!signResponse.ok) throw new Error('No se pudo firmar la subida')
      const { timestamp, signature, apiKey, cloudName } = await signResponse.json()

      const formData = new FormData()
      formData.append('file', file)
      formData.append('timestamp', String(timestamp))
      formData.append('signature', signature)
      formData.append('api_key', apiKey)
      formData.append('folder', folder)

      const uploadResponse = await fetch(
        `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
        { method: 'POST', body: formData }
      )
      if (!uploadResponse.ok) throw new Error('La subida a Cloudinary falló')
      const uploaded = await uploadResponse.json()
      onUploaded(uploaded.secure_url as string)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al subir la imagen')
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium">{label}</label>
      {value && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={value} alt={label} className="h-24 w-24 rounded border object-cover" />
      )}
      <input type="file" accept="image/jpeg,image/png" onChange={handleFileChange} disabled={uploading} />
      {uploading && <p className="text-sm text-gray-500">Subiendo...</p>}
      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  )
}
