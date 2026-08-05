import { listClientes } from '@/server/actions/clientes'
import { ClienteForm } from './ClienteForm'

export default async function ClientesPage() {
  const clientes = await listClientes()
  return (
    <main className="mx-auto max-w-2xl space-y-6 p-4 sm:p-6">
      <h1 className="text-xl font-semibold">Clientes</h1>
      <ClienteForm />
      {clientes.length === 0 ? (
        <p className="rounded border border-dashed p-6 text-center text-sm text-gray-500">
          Todavía no hay clientes. Crea el primero con el formulario de arriba.
        </p>
      ) : (
        <ul className="space-y-2">
          {clientes.map((cliente) => (
            <li key={cliente.id} className="flex items-center gap-3 rounded border bg-white p-3">
              {cliente.logoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={cliente.logoUrl} alt={cliente.nombre} className="h-10 w-10 object-contain" />
              ) : (
                <div className="flex h-10 w-10 items-center justify-center rounded bg-gray-100 text-xs text-gray-400">
                  Sin logo
                </div>
              )}
              <span>{cliente.nombre}</span>
            </li>
          ))}
        </ul>
      )}
    </main>
  )
}
