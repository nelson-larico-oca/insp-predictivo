import { listContratistas } from '@/server/actions/contratistas'
import { ContratistaForm } from './ContratistaForm'

export default async function ContratistasPage() {
  const contratistas = await listContratistas()
  return (
    <main className="mx-auto max-w-2xl space-y-6 p-4 sm:p-6">
      <h1 className="text-xl font-semibold">Contratistas</h1>
      <ContratistaForm />
      {contratistas.length === 0 ? (
        <p className="rounded border border-dashed p-6 text-center text-sm text-gray-500">
          Todavía no hay contratistas. Crea el primero con el formulario de arriba.
        </p>
      ) : (
        <ul className="space-y-2">
          {contratistas.map((contratista) => (
            <li key={contratista.id} className="flex items-center gap-3 rounded border bg-white p-3">
              {contratista.logoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={contratista.logoUrl} alt={contratista.nombre} className="h-10 w-10 object-contain" />
              ) : (
                <div className="flex h-10 w-10 items-center justify-center rounded bg-gray-100 text-xs text-gray-400">
                  Sin logo
                </div>
              )}
              <span>{contratista.nombre}</span>
            </li>
          ))}
        </ul>
      )}
    </main>
  )
}
