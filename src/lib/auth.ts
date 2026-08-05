import type { NextAuthOptions } from 'next-auth'
import { getServerSession } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import bcrypt from 'bcryptjs'
import { prisma } from './prisma'
import type { Role } from '@prisma/client'

export interface AuthenticatedUser {
  id: string
  name: string
  email: string
  role: Role
}

export async function verifyCredentials(
  email: string,
  password: string
): Promise<AuthenticatedUser | null> {
  const user = await prisma.user.findUnique({ where: { email } })
  if (!user) return null
  const valid = await bcrypt.compare(password, user.passwordHash)
  if (!valid) return null
  return { id: user.id, name: user.name, email: user.email, role: user.role }
}

export const authOptions: NextAuthOptions = {
  session: { strategy: 'jwt' },
  pages: { signIn: '/login' },
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null
        return verifyCredentials(credentials.email, credentials.password)
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = (user as AuthenticatedUser).id
        token.role = (user as AuthenticatedUser).role
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id
        session.user.role = token.role
      }
      return session
    },
  },
}

export async function requireAdmin() {
  const session = await getServerSession(authOptions)
  if (session?.user?.role !== 'ADMIN') {
    throw new Error('No autorizado: se requiere rol de administrador')
  }
  return session.user
}
