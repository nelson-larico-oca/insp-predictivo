import Link from 'next/link'
import { listFajas } from '@/server/actions/fajas'

export default async function FajasPage() {
  const fajas = await listFajas()
  return (
    <main className="mx-auto max-w-3xl space-y-6 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Fajas</h1>
        <Link href="/fajas/new" className="rounded bg-blue-600 px-3 py-2 text-white">Nueva faja</Link>
      </div>
      <ul className="space-y-2">
        {fajas.map((faja) => (
          <li key={faja.id} className="rounded border bg-white p-3">
            <Link href={`/fajas/${faja.id}`} className="font-medium text-blue-700">{faja.tag}</Link>
            <p className="text-sm text-gray-500">{faja.cliente.nombre} · {faja.lugar}</p>
          </li>
        ))}
      </ul>
    </main>
  )
}
