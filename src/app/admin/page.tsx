import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { listUsers } from '@/server/actions/users'
import { CreateUserForm } from './CreateUserForm'
import { UserRow } from './UserRow'

export default async function AdminPage() {
  const [users, session] = await Promise.all([listUsers(), getServerSession(authOptions)])
  const currentUserId = session?.user?.id

  return (
    <main className="mx-auto max-w-4xl space-y-6 p-4 sm:p-6">
      <div>
        <h1 className="text-xl font-semibold">Administración</h1>
        <p className="text-sm text-gray-500">Gestiona las cuentas registradas en el sistema.</p>
      </div>

      <CreateUserForm />

      <div className="overflow-x-auto rounded border bg-white">
        <table className="w-full min-w-[560px] text-left text-sm">
          <thead className="border-b bg-gray-50 text-xs uppercase text-gray-500">
            <tr>
              <th className="px-4 py-3">Nombre</th>
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3">Rol</th>
              <th className="px-4 py-3">Creado</th>
              <th className="px-4 py-3 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <UserRow key={user.id} user={user} isSelf={user.id === currentUserId} />
            ))}
          </tbody>
        </table>
      </div>
    </main>
  )
}
