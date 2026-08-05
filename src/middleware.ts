import { withAuth } from 'next-auth/middleware'
import { NextResponse } from 'next/server'

export default withAuth(
  function middleware(req) {
    const isAdminRoute = req.nextUrl.pathname.startsWith('/admin')
    if (isAdminRoute && req.nextauth.token?.role !== 'ADMIN') {
      return NextResponse.redirect(new URL('/fajas', req.url))
    }
    return NextResponse.next()
  },
  { pages: { signIn: '/login' } }
)

export const config = {
  matcher: [
    '/clientes/:path*',
    '/contratistas/:path*',
    '/fajas/:path*',
    '/api/cloudinary/:path*',
    '/admin/:path*',
  ],
}
