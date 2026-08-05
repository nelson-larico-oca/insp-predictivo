import { requireUser } from '@/lib/session'
import { listUsers } from '@/server/actions/users'
import { listContratistas } from '@/server/actions/contratistas'
import { listClientes } from '@/server/actions/clientes'
import { CreateUserForm } from './CreateUserForm'
import { UserRow } from './UserRow'

export default async function AdminPage() {
  const actor = await requireUser()
  const isAdmin = actor.role === 'ADMIN'

  const [users, contratistas, clientes] = await Promise.all([
    listUsers(),
    isAdmin ? listContratistas() : Promise.resolve([]),
    isAdmin ? listClientes() : Promise.resolve([]),
  ])

  const sinAsignar = users.filter(
    (u) => (u.role === 'SUPERVISOR' || u.role === 'INSPECTOR') && !u.contratistaId
  )

  return (
    <main className="mx-auto max-w-4xl space-y-6 p-4 sm:p-6">
      <div>
        <h1 className="text-xl font-semibold">{isAdmin ? 'Administración' : 'Mi equipo'}</h1>
        <p className="text-sm text-gray-500">
          {isAdmin
            ? 'Gestiona las cuentas registradas en el sistema.'
            : 'Gestiona los supervisores e inspectores de tu contratista.'}
        </p>
      </div>

      {sinAsignar.length > 0 && (
        <p className="rounded border border-yellow-400 bg-yellow-50 p-3 text-sm text-yellow-800">
          {sinAsignar.length} usuario(s) sin contratista asignada — no podrán ver ninguna faja hasta que edites su
          cuenta y les asignes una.
        </p>
      )}

      <CreateUserForm actorRole={actor.role} contratistas={contratistas} clientes={clientes} />

      <div className="overflow-x-auto rounded border bg-white">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead className="border-b bg-gray-50 text-xs uppercase text-gray-500">
            <tr>
              <th className="px-4 py-3">Nombre</th>
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3">Rol</th>
              <th className="px-4 py-3">Asignación</th>
              <th className="px-4 py-3">Creado</th>
              <th className="px-4 py-3 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <UserRow
                key={user.id}
                user={user}
                isSelf={user.id === actor.id}
                actorRole={actor.role}
                contratistas={contratistas}
                clientes={clientes}
              />
            ))}
          </tbody>
        </table>
      </div>
    </main>
  )
}
