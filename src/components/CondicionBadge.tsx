import type { Condicion } from '@prisma/client'
import { CONDICION_COLORS } from '@/lib/condicion'

export function CondicionBadge({ condicion }: { condicion: Condicion }) {
  return (
    <span
      className="rounded-full px-2 py-1 text-xs font-semibold text-white"
      style={{ backgroundColor: CONDICION_COLORS[condicion] }}
    >
      {condicion}
    </span>
  )
}
