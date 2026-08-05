import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { listClientes } from '@/server/actions/clientes'
import { listContratistas } from '@/server/actions/contratistas'
import { FajaForm } from './FajaForm'

export default async function NewFajaPage() {
  const session = await getServerSession(authOptions)
  const [clientes, contratistas] = await Promise.all([listClientes(), listContratistas()])
  return (
    <main className="mx-auto max-w-2xl space-y-6 p-4 sm:p-6">
      <h1 className="text-xl font-semibold">Nueva faja</h1>
      <FajaForm
        clientes={clientes}
        contratistas={contratistas}
        currentUserId={(session?.user as { id: string })?.id ?? ''}
      />
    </main>
  )
}
