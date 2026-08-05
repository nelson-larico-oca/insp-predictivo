'use client'

import { useState } from 'react'
import type { CriterioAceptacion } from '@prisma/client'
import { CriterioTable } from '@/components/CriterioTable'
import { CriterioEditor } from './CriterioEditor'

interface CriteriosSectionProps {
  criterios: CriterioAceptacion[]
  /** true once the faja has at least one reporte — locks editing behind the Editar button. */
  locked: boolean
}

export function CriteriosSection({ criterios, locked }: CriteriosSectionProps) {
  const [editing, setEditing] = useState(!locked)

  if (!editing) {
    return (
      <div className="space-y-2">
        <CriterioTable criterios={criterios} />
        <button
          type="button"
          onClick={() => setEditing(true)}
          className="rounded border px-3 py-1.5 text-sm hover:bg-gray-50"
        >
          Editar
        </button>
      </div>
    )
  }

  return (
    <div className="overflow-x-auto rounded border bg-white">
      <table className="w-full min-w-[520px] text-sm">
        <thead>
          <tr className="text-left">
            <th className="px-2 py-1">Nivel</th>
            <th className="px-2 py-1">Temp min</th>
            <th className="px-2 py-1">Temp max</th>
            <th className="px-2 py-1">Delta min</th>
            <th className="px-2 py-1">Delta max</th>
            <th className="px-2 py-1"></th>
          </tr>
        </thead>
        <tbody>
          {criterios.map((criterio) => (
            <CriterioEditor key={criterio.id} criterio={criterio} />
          ))}
        </tbody>
      </table>
    </div>
  )
}
