import { notFound } from 'next/navigation'
import { getReporteForPrint } from '@/server/actions/reportes'
import { getHistoricoByFaja } from '@/lib/historico'
import { ReporteHeader } from '@/components/ReporteHeader'
import { CriterioTable } from '@/components/CriterioTable'
import { PoleaDiagnosticoBlock } from '@/components/PoleaDiagnosticoBlock'
import { HistoricoTable } from '@/components/HistoricoTable'
import { TrendChart } from '@/components/TrendChart'
import './print.css'

export default async function ReportePrintPage({
  params,
  searchParams,
}: {
  params: { id: string }
  searchParams: { token?: string }
}) {
  if (!searchParams.token) notFound()

  const reporte = await getReporteForPrint(params.id, searchParams.token)
  if (!reporte) notFound()
  const historico = await getHistoricoByFaja(reporte.fajaId)

  return (
    <main className="mx-auto max-w-3xl space-y-4 p-6">
      <ReporteHeader reporte={reporte} />
      {reporte.faja.esquemaUrl && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={reporte.faja.esquemaUrl} alt="Esquema de poleas" className="max-w-full rounded border" />
      )}
      <CriterioTable criterios={reporte.faja.criterios} />
      {reporte.lecturas.map((lectura) => (
        <div key={lectura.id} className="polea-block">
          <PoleaDiagnosticoBlock lectura={lectura} />
        </div>
      ))}

      <div className="historico-section space-y-4">
        <h2 className="text-lg font-semibold">Histórico de temperatura</h2>
        <HistoricoTable historico={historico} />
        <div className="grid grid-cols-2 gap-4">
          {historico.map((polea) => (
            <div key={polea.poleaId} className="trend-chart">
              <TrendChart polea={polea} />
            </div>
          ))}
        </div>
      </div>

      <div id="print-ready" data-ready="true" />
    </main>
  )
}
