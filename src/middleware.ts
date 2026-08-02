import { withAuth } from 'next-auth/middleware'

export default withAuth({
  pages: { signIn: '/login' },
})

export const config = {
  matcher: ['/clientes/:path*', '/contratistas/:path*', '/fajas/:path*', '/api/cloudinary/:path*'],
}
