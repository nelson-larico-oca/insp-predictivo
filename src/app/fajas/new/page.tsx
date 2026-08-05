import { redirect } from 'next/navigation'
import { requireUser } from '@/lib/session'
import { canCreateFaja } from '@/lib/permissions'
import { listClientes } from '@/server/actions/clientes'
import { listContratistas } from '@/server/actions/contratistas'
import { prisma } from '@/lib/prisma'
import { FajaForm } from './FajaForm'

export default async function NewFajaPage() {
  const user = await requireUser()
  if (!canCreateFaja(user)) redirect('/fajas')

  const clientes = await listClientes()
  const lockedContratista =
    user.role === 'SUPERVISOR' && user.contratistaId
      ? await prisma.contratista.findUnique({ where: { id: user.contratistaId } })
      : null
  const contratistas = user.role === 'ADMIN' ? await listContratistas() : []

  return (
    <main className="mx-auto max-w-2xl space-y-6 p-4 sm:p-6">
      <h1 className="text-xl font-semibold">Nueva faja</h1>
      <FajaForm clientes={clientes} contratistas={contratistas} lockedContratista={lockedContratista ?? undefined} />
    </main>
  )
}
