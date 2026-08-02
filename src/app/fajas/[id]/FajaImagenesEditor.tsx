'use client'

import { useRouter } from 'next/navigation'
import { ImageUploader } from '@/components/ImageUploader'
import { updateFajaImagenes } from '@/server/actions/fajas'

interface FajaImagenesEditorProps {
  fajaId: string
  esquemaUrl?: string | null
  criteriosImagenUrl?: string | null
}

export function FajaImagenesEditor({ fajaId, esquemaUrl, criteriosImagenUrl }: FajaImagenesEditorProps) {
  const router = useRouter()

  async function handleEsquemaUploaded(url: string) {
    await updateFajaImagenes(fajaId, { esquemaUrl: url })
    router.refresh()
  }

  async function handleCriteriosUploaded(url: string) {
    await updateFajaImagenes(fajaId, { criteriosImagenUrl: url })
    router.refresh()
  }

  return (
    <div className="grid grid-cols-2 gap-4 rounded border bg-white p-4">
      <ImageUploader
        folder="insp-predictivo/esquemas"
        value={esquemaUrl ?? undefined}
        onUploaded={handleEsquemaUploaded}
        label="Esquema de ubicación de poleas"
      />
      <ImageUploader
        folder="insp-predictivo/criterios"
        value={criteriosImagenUrl ?? undefined}
        onUploaded={handleCriteriosUploaded}
        label="Imagen de criterios de aceptación"
      />
    </div>
  )
}
