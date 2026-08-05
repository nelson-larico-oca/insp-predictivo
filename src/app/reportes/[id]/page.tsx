import { notFound } from 'next/navigation'
import Link from 'next/link'
import { requireUser } from '@/lib/session'
import { canManageFaja } from '@/lib/permissions'
import { getReporteById } from '@/server/actions/reportes'
import { ReporteHeader } from '@/components/ReporteHeader'
import { CriterioTable } from '@/components/CriterioTable'
import { PoleaDiagnosticoBlock } from '@/components/PoleaDiagnosticoBlock'
import { DeleteReporteButton } from './DeleteReporteButton'

export default async function ReporteDetailPage({ params }: { params: { id: string } }) {
  const user = await requireUser()

  const reporte = await getReporteById(params.id)
  if (!reporte) notFound()
  const canDelete = canManageFaja(user, reporte.faja)

  return (
    <main className="mx-auto max-w-3xl space-y-4 p-4 sm:p-6">
      <Link href={`/fajas/${reporte.fajaId}`} className="text-sm text-gray-500 hover:text-blue-700">
        ← Volver a {reporte.faja.tag}
      </Link>
      <ReporteHeader reporte={reporte} />
      {reporte.faja.esquemaUrl && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={reporte.faja.esquemaUrl} alt="Esquema de poleas" className="max-w-full rounded border" />
      )}
      <CriterioTable criterios={reporte.faja.criterios} />
      {reporte.lecturas.map((lectura) => (
        <PoleaDiagnosticoBlock key={lectura.id} lectura={lectura} />
      ))}
      <div className="flex flex-col gap-3 sm:flex-row">
        <a
          href={`/api/reportes/${reporte.id}/pdf`}
          className="inline-block rounded bg-blue-600 px-4 py-2 text-center text-white"
        >
          Descargar PDF
        </a>
        {canDelete && <DeleteReporteButton reporteId={reporte.id} fajaId={reporte.fajaId} />}
      </div>
    </main>
  )
}
