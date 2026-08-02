import { listContratistas } from '@/server/actions/contratistas'
import { ContratistaForm } from './ContratistaForm'

export default async function ContratistasPage() {
  const contratistas = await listContratistas()
  return (
    <main className="mx-auto max-w-2xl space-y-6 p-6">
      <h1 className="text-xl font-semibold">Contratistas</h1>
      <ContratistaForm />
      <ul className="space-y-2">
        {contratistas.map((contratista) => (
          <li key={contratista.id} className="flex items-center gap-3 rounded border bg-white p-3">
            {contratista.logoUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={contratista.logoUrl} alt={contratista.nombre} className="h-10 w-10 object-contain" />
            )}
            <span>{contratista.nombre}</span>
          </li>
        ))}
      </ul>
    </main>
  )
}
