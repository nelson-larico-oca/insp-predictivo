'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { deleteFaja } from '@/server/actions/fajas'

export function DeleteFajaButton({ fajaId, reportesCount }: { fajaId: string; reportesCount: number }) {
  const router = useRouter()
  const [confirming, setConfirming] = useState(false)

  if (!confirming) {
    return (
      <button onClick={() => setConfirming(true)} className="rounded border border-red-600 px-3 py-2 text-red-600">
        Eliminar faja
      </button>
    )
  }

  return (
    <div className="rounded border border-red-600 bg-red-50 p-3">
      <p className="text-sm text-red-700">
        Esto eliminará la faja y sus {reportesCount} reporte(s) asociados. ¿Confirmas?
      </p>
      <div className="mt-2 flex gap-2">
        <button
          onClick={async () => {
            await deleteFaja(fajaId)
            router.push('/fajas')
          }}
          className="rounded bg-red-600 px-3 py-2 text-white"
        >
          Sí, eliminar
        </button>
        <button onClick={() => setConfirming(false)} className="rounded border px-3 py-2">
          Cancelar
        </button>
      </div>
    </div>
  )
}
