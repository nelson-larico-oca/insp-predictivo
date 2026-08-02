import type { Metadata } from 'next'
import './globals.css'
import { Providers } from './Providers'
import { NavBar } from '@/components/NavBar'

export const metadata: Metadata = {
  title: 'Inspección Predictiva - Reportes de Termografía',
  description: 'Gestión de fajas y reportes de termografía de chumaceras',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body className="bg-gray-50 text-gray-900">
        <Providers>
          <NavBar />
          {children}
        </Providers>
      </body>
    </html>
  )
}
