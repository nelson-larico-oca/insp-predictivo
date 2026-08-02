'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useSession, signOut } from 'next-auth/react'

const LINKS = [
  { href: '/fajas', label: 'Fajas' },
  { href: '/clientes', label: 'Clientes' },
  { href: '/contratistas', label: 'Contratistas' },
]

export function NavBar() {
  const { data: session, status } = useSession()
  const pathname = usePathname()

  if (status !== 'authenticated') return null

  return (
    <nav className="flex items-center justify-between border-b bg-white px-6 py-3">
      <div className="flex items-center gap-1 text-sm font-medium">
        <Link href="/fajas" className="mr-3 font-semibold text-gray-900">
          Inspección Predictiva
        </Link>
        {LINKS.map((link) => {
          const active = pathname.startsWith(link.href)
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`rounded px-3 py-1.5 transition ${
                active ? 'bg-blue-50 text-blue-700' : 'text-gray-600 hover:bg-gray-50 hover:text-blue-700'
              }`}
            >
              {link.label}
            </Link>
          )
        })}
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
