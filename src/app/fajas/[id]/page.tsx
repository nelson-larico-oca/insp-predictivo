import { notFound } from 'next/navigation'
import Link from 'next/link'
import { getFajaById, countReportesByFaja } from '@/server/actions/fajas'
import { getHistoricoByFaja } from '@/lib/historico'
import { PoleaTipoEditor } from './PoleaTipoEditor'
import { CriterioEditor } from './CriterioEditor'
import { DeleteFajaButton } from './DeleteFajaButton'
import { HistoricoTable } from '@/components/HistoricoTable'
import { TrendChart } from '@/components/TrendChart'

export default async function FajaDetailPage({ params }: { params: { id: string } }) {
  const faja = await getFajaById(params.id)
  if (!faja) notFound()
  const reportesCount = await countReportesByFaja(faja.id)
  const historico = await getHistoricoByFaja(faja.id)

  return (
    <main className="mx-auto max-w-3xl space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">{faja.tag}</h1>
          <p className="text-sm text-gray-500">{faja.cliente.nombre} · {faja.lugar}</p>
        </div>
        <Link href={`/fajas/${faja.id}/reportes/new`} className="rounded bg-blue-600 px-3 py-2 text-white">
          Crear reporte
        </Link>
      </div>

      {faja.esquemaUrl && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={faja.esquemaUrl} alt="Esquema de poleas" className="max-w-full rounded border" />
      )}

      <section>
        <h2 className="mb-2 font-medium">Poleas</h2>
        <div className="space-y-1 rounded border bg-white p-3">
          {faja.poleas.map((polea) => (
            <PoleaTipoEditor key={polea.id} polea={polea} />
          ))}
        </div>
      </section>

      <section>
        <h2 className="mb-2 font-medium">Criterios de aceptación</h2>
        <table className="w-full rounded border bg-white text-sm">
          <thead>
            <tr className="text-left">
              <th className="px-2 py-1">Nivel</th>
              <th className="px-2 py-1">Temp min</th>
              <th className="px-2 py-1">Temp max</th>
              <th className="px-2 py-1">Delta min</th>
              <th className="px-2 py-1">Delta max</th>
            </tr>
          </thead>
          <tbody>
            {faja.criterios.map((criterio) => (
              <CriterioEditor key={criterio.id} criterio={criterio} />
            ))}
          </tbody>
        </table>
      </section>

      <section>
        <h2 className="mb-2 font-medium">Reportes</h2>
        <ul className="space-y-2">
          {faja.reportes.map((reporte) => (
            <li key={reporte.id} className="rounded border bg-white p-3">
              <Link href={`/reportes/${reporte.id}`} className="text-blue-700">
                {new Date(reporte.fecha).toLocaleDateString('es-PE')} — {reporte.condicionGeneral}
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <section>
        <h2 className="mb-2 font-medium">Histórico de temperatura</h2>
        <HistoricoTable historico={historico} />
      </section>

      <section>
        <h2 className="mb-2 font-medium">Tendencias</h2>
        <div className="grid grid-cols-2 gap-4">
          {historico.map((polea) => (
            <TrendChart key={polea.poleaId} polea={polea} />
          ))}
        </div>
      </section>

      <DeleteFajaButton fajaId={faja.id} reportesCount={reportesCount} />
    </main>
  )
}
