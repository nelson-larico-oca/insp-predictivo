'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import type { Polea } from '@prisma/client'
import { updatePoleaTipo } from '@/server/actions/fajas'

export function PoleaTipoEditor({ polea }: { polea: Polea }) {
  const router = useRouter()
  const [tipo, setTipo] = useState(polea.tipo ?? '')

  async function handleBlur() {
    if (tipo !== (polea.tipo ?? '')) {
      await updatePoleaTipo(polea.id, tipo)
      router.refresh()
    }
  }

  return (
    <div className="flex items-center gap-2">
      <span className="w-20 text-sm text-gray-500">Polea {polea.numero}</span>
      <input
        className="flex-1 rounded border px-2 py-1 text-sm"
        placeholder="Tipo (ej. Motriz, Cabeza, Tensora)"
        value={tipo}
        onChange={(e) => setTipo(e.target.value)}
        onBlur={handleBlur}
      />
    </div>
  )
}
