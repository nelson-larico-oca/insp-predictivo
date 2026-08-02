import { notFound } from 'next/navigation'
import Link from 'next/link'
import { getFajaById } from '@/server/actions/fajas'
import { ReporteForm } from './ReporteForm'

export default async function NewReportePage({ params }: { params: { id: string } }) {
  const faja = await getFajaById(params.id)
  if (!faja) notFound()
  return (
    <main className="mx-auto max-w-3xl space-y-6 p-6">
      <Link href={`/fajas/${faja.id}`} className="text-sm text-gray-500 hover:text-blue-700">
        ← Volver a {faja.tag}
      </Link>
      <h1 className="text-xl font-semibold">Nuevo reporte — {faja.tag}</h1>
      <ReporteForm faja={faja} />
    </main>
  )
}
