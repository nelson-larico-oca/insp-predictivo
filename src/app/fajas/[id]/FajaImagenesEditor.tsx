'use client'

import { useRouter } from 'next/navigation'
import { ImageUploader } from '@/components/ImageUploader'
import { updateFajaImagenes } from '@/server/actions/fajas'

interface FajaImagenesEditorProps {
  fajaId: string
  esquemaUrl?: string | null
}

export function FajaImagenesEditor({ fajaId, esquemaUrl }: FajaImagenesEditorProps) {
  const router = useRouter()

  async function handleEsquemaUploaded(url: string) {
    await updateFajaImagenes(fajaId, { esquemaUrl: url })
    router.refresh()
  }

  return (
    <div className="rounded border bg-white p-4">
      <ImageUploader
        folder="insp-predictivo/esquemas"
        value={esquemaUrl ?? undefined}
        onUploaded={handleEsquemaUploaded}
        label="Esquema de ubicación de poleas"
      />
    </div>
  )
}
