'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import type { CriterioAceptacion } from '@prisma/client'
import { updateCriterio } from '@/server/actions/fajas'

export function CriterioEditor({ criterio }: { criterio: CriterioAceptacion }) {
  const router = useRouter()
  const [values, setValues] = useState({
    tempMin: criterio.tempMin,
    tempMax: criterio.tempMax,
    deltaMin: criterio.deltaMin,
    deltaMax: criterio.deltaMax,
  })
  const [saved, setSaved] = useState(false)

  async function handleBlur() {
    const unchanged =
      values.tempMin === criterio.tempMin &&
      values.tempMax === criterio.tempMax &&
      values.deltaMin === criterio.deltaMin &&
      values.deltaMax === criterio.deltaMax
    if (unchanged) return
    await updateCriterio(criterio.id, values)
    router.refresh()
    setSaved(true)
    setTimeout(() => setSaved(false), 1500)
  }

  return (
    <tr style={{ backgroundColor: `${criterio.color}22` }}>
      <td className="px-2 py-1 font-medium">{criterio.nivel}</td>
      {(['tempMin', 'tempMax', 'deltaMin', 'deltaMax'] as const).map((field) => (
        <td key={field} className="px-2 py-1">
          <input
            type="number"
            className="w-20 rounded border px-1 py-0.5 text-sm"
            value={values[field]}
            onChange={(e) => setValues((v) => ({ ...v, [field]: Number(e.target.value) }))}
            onBlur={handleBlur}
          />
        </td>
      ))}
      <td className="px-2 py-1 text-xs text-green-600">{saved && 'Guardado ✓'}</td>
    </tr>
  )
}
