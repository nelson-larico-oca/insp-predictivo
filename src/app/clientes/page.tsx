import { listClientes } from '@/server/actions/clientes'
import { ClienteForm } from './ClienteForm'

export default async function ClientesPage() {
  const clientes = await listClientes()
  return (
    <main className="mx-auto max-w-2xl space-y-6 p-6">
      <h1 className="text-xl font-semibold">Clientes</h1>
      <ClienteForm />
      <ul className="space-y-2">
        {clientes.map((cliente) => (
          <li key={cliente.id} className="flex items-center gap-3 rounded border bg-white p-3">
            {cliente.logoUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={cliente.logoUrl} alt={cliente.nombre} className="h-10 w-10 object-contain" />
            )}
            <span>{cliente.nombre}</span>
          </li>
        ))}
      </ul>
    </main>
  )
}
