import { notFound, redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getReporteById } from '@/server/actions/reportes'
import { ReporteHeader } from '@/components/ReporteHeader'
import { CriterioTable } from '@/components/CriterioTable'
import { PoleaDiagnosticoBlock } from '@/components/PoleaDiagnosticoBlock'
import { DeleteReporteButton } from './DeleteReporteButton'

export default async function ReporteDetailPage({ params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session) redirect('/login')

  const reporte = await getReporteById(params.id)
  if (!reporte) notFound()

  return (
    <main className="mx-auto max-w-3xl space-y-4 p-6">
      <ReporteHeader reporte={reporte} />
      {reporte.faja.esquemaUrl && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={reporte.faja.esquemaUrl} alt="Esquema de poleas" className="max-w-full rounded border" />
      )}
      <CriterioTable criterios={reporte.faja.criterios} />
      {reporte.lecturas.map((lectura) => (
        <PoleaDiagnosticoBlock key={lectura.id} lectura={lectura} />
      ))}
      <div className="flex gap-3">
        <a
          href={`/api/reportes/${reporte.id}/pdf`}
          className="inline-block rounded bg-blue-600 px-4 py-2 text-white"
        >
          Descargar PDF
        </a>
        <DeleteReporteButton reporteId={reporte.id} fajaId={reporte.fajaId} />
      </div>
    </main>
  )
}
