import type { CriterioAceptacion } from '@prisma/client'

export function CriterioTable({ criterios }: { criterios: CriterioAceptacion[] }) {
  return (
    <div className="overflow-x-auto rounded border bg-white">
      <table className="w-full min-w-[420px] text-sm">
        <thead>
          <tr className="text-left">
            <th className="px-2 py-1">Nivel</th>
            <th className="px-2 py-1">Rango °C</th>
            <th className="px-2 py-1">Delta °C</th>
          </tr>
        </thead>
        <tbody>
          {criterios.map((criterio) => (
            <tr key={criterio.id} style={{ backgroundColor: `${criterio.color}22` }}>
              <td className="px-2 py-1 font-semibold">{criterio.nivel}</td>
              <td className="px-2 py-1">{criterio.tempMin}° - {criterio.tempMax}°C</td>
              <td className="px-2 py-1">{criterio.deltaMin} - {criterio.deltaMax}°C</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
