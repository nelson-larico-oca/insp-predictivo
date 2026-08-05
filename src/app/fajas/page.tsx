import Link from 'next/link'
import { listFajas } from '@/server/actions/fajas'

export default async function FajasPage() {
  const fajas = await listFajas()
  return (
    <main className="mx-auto max-w-3xl space-y-6 p-4 sm:p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-xl font-semibold">Fajas</h1>
        <Link href="/fajas/new" className="rounded bg-blue-600 px-4 py-2 text-center text-white hover:bg-blue-700">
          + Nueva faja
        </Link>
      </div>
      {fajas.length === 0 ? (
        <div className="rounded border border-dashed p-8 text-center">
          <p className="text-sm text-gray-500">Todavía no hay fajas registradas.</p>
          <Link href="/fajas/new" className="mt-2 inline-block text-sm font-medium text-blue-700 hover:underline">
            Crear la primera faja →
          </Link>
        </div>
      ) : (
        <ul className="space-y-2">
          {fajas.map((faja) => (
            <li key={faja.id}>
              <Link
                href={`/fajas/${faja.id}`}
                className="flex items-center gap-3 rounded border bg-white p-3 transition hover:border-blue-400 hover:shadow-sm"
              >
                {faja.cliente.logoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={faja.cliente.logoUrl} alt={faja.cliente.nombre} className="h-10 w-10 flex-shrink-0 object-contain" />
                ) : (
                  <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded bg-gray-100 text-xs text-gray-400">
                    {faja.cliente.nombre.slice(0, 2).toUpperCase()}
                  </div>
                )}
                <div className="flex-1">
                  <p className="font-medium text-blue-700">{faja.tag}</p>
                  <p className="text-sm text-gray-500">{faja.cliente.nombre} · {faja.lugar}</p>
                </div>
                <span className="rounded-full bg-gray-100 px-2 py-1 text-xs text-gray-600">
                  {faja.numeroPoleas} polea{faja.numeroPoleas === 1 ? '' : 's'}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </main>
  )
}
