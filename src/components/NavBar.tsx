'use client'

import Link from 'next/link'
import { useSession, signOut } from 'next-auth/react'

export function NavBar() {
  const { data: session, status } = useSession()

  if (status !== 'authenticated') return null

  return (
    <nav className="flex items-center justify-between border-b bg-white px-6 py-3">
      <div className="flex items-center gap-4 text-sm font-medium">
        <Link href="/fajas" className="text-gray-700 hover:text-blue-700">Fajas</Link>
        <Link href="/clientes" className="text-gray-700 hover:text-blue-700">Clientes</Link>
        <Link href="/contratistas" className="text-gray-700 hover:text-blue-700">Contratistas</Link>
      </div>
      <div className="flex items-center gap-3 text-sm text-gray-500">
        <span>{session.user?.name ?? session.user?.email}</span>
        <button onClick={() => signOut({ callbackUrl: '/login' })} className="rounded border px-2 py-1 hover:bg-gray-50">
          Salir
        </button>
      </div>
    </nav>
  )
}
