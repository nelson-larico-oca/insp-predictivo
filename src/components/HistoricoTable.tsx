import type { PoleaHistorico } from '@/lib/historico'

export function HistoricoTable({ historico }: { historico: PoleaHistorico[] }) {
  return (
    <div className="space-y-4">
      {historico.map((polea) => (
        <table key={polea.poleaId} className="w-full rounded border bg-white text-sm">
          <caption className="p-2 text-left font-medium">
            Polea {polea.numero}{polea.tipo ? ` — ${polea.tipo}` : ''}
          </caption>
          <thead>
            <tr className="text-left">
              <th className="px-2 py-1">Fecha</th>
              <th className="px-2 py-1">Izquierda °C</th>
              <th className="px-2 py-1">Derecha °C</th>
              <th className="px-2 py-1">Delta</th>
              <th className="px-2 py-1">Condición</th>
            </tr>
          </thead>
          <tbody>
            {polea.lecturas.map((lectura, index) => (
              <tr key={index}>
                <td className="px-2 py-1">{new Date(lectura.fecha).toLocaleDateString('es-PE')}</td>
                <td className="px-2 py-1">{lectura.tempIzquierda}</td>
                <td className="px-2 py-1">{lectura.tempDerecha}</td>
                <td className="px-2 py-1">{lectura.delta}</td>
                <td className="px-2 py-1">{lectura.condicion}</td>
              </tr>
            ))}
          </tbody>
        </table>
      ))}
    </div>
  )
}
